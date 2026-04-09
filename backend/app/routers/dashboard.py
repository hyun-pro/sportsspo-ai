from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case, and_
from sqlalchemy.orm import joinedload
from datetime import date, timedelta
from typing import Optional
from app.database import get_db
from app.models.game import Game
from app.models.prediction import Prediction
from app.models.team_stats import TeamStats

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
async def dashboard_summary(db: AsyncSession = Depends(get_db)):
    """Main dashboard summary stats."""
    today = date.today()

    # Total games today
    today_games = (await db.execute(
        select(func.count(Game.id)).where(Game.game_date == today)
    )).scalar() or 0

    # Total games with predictions
    total_predictions = (await db.execute(
        select(func.count(Prediction.id))
    )).scalar() or 0

    # Games by league today
    league_counts_q = await db.execute(
        select(Game.league, func.count(Game.id))
        .where(Game.game_date == today)
        .group_by(Game.league)
    )
    league_today = {row[0]: row[1] for row in league_counts_q.all()}

    # Accuracy: finished games where prediction was correct
    finished_games = await db.execute(
        select(Game).options(joinedload(Game.prediction))
        .where(Game.status == "final")
        .where(Game.home_score.isnot(None))
        .where(Game.away_score.isnot(None))
    )
    finished = finished_games.unique().scalars().all()

    total_finished = 0
    correct = 0
    correct_by_league = {"MLB": [0, 0], "NPB": [0, 0], "KBO": [0, 0]}
    high_conf_correct = 0
    high_conf_total = 0

    for g in finished:
        if not g.prediction or g.home_score == g.away_score:
            continue
        total_finished += 1
        actual = "home" if g.home_score > g.away_score else "away"
        is_correct = g.prediction.recommended_pick == actual

        if g.league in correct_by_league:
            correct_by_league[g.league][1] += 1
            if is_correct:
                correct_by_league[g.league][0] += 1

        if is_correct:
            correct += 1
        if g.prediction.confidence_score >= 70:
            high_conf_total += 1
            if is_correct:
                high_conf_correct += 1

    accuracy = round(correct / max(1, total_finished) * 100, 1)
    high_conf_accuracy = round(high_conf_correct / max(1, high_conf_total) * 100, 1)

    league_accuracy = {}
    for league, (c, t) in correct_by_league.items():
        league_accuracy[league] = {
            "correct": c,
            "total": t,
            "accuracy": round(c / max(1, t) * 100, 1),
        }

    return {
        "today_games": today_games,
        "total_predictions": total_predictions,
        "total_finished": total_finished,
        "overall_accuracy": accuracy,
        "correct_predictions": correct,
        "high_confidence_accuracy": high_conf_accuracy,
        "high_confidence_total": high_conf_total,
        "league_today": league_today,
        "league_accuracy": league_accuracy,
    }


@router.get("/today")
async def today_games(
    league: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Today's games with predictions."""
    today = date.today()
    query = (
        select(Game).options(joinedload(Game.prediction))
        .where(Game.game_date == today)
    )
    if league:
        query = query.where(Game.league == league)
    query = query.order_by(Game.game_time, Game.id)

    result = await db.execute(query)
    games = result.unique().scalars().all()

    return [
        {
            "id": g.id,
            "league": g.league,
            "home_team": g.home_team,
            "away_team": g.away_team,
            "game_time": g.game_time,
            "status": g.status,
            "home_score": g.home_score,
            "away_score": g.away_score,
            "home_odds": g.home_odds,
            "away_odds": g.away_odds,
            "home_pitcher": g.home_pitcher,
            "away_pitcher": g.away_pitcher,
            "prediction": {
                "home_win_probability": g.prediction.home_win_probability,
                "away_win_probability": g.prediction.away_win_probability,
                "recommended_pick": g.prediction.recommended_pick,
                "confidence_score": g.prediction.confidence_score,
            } if g.prediction else None,
        }
        for g in games
    ]


@router.get("/top-picks")
async def top_picks(db: AsyncSession = Depends(get_db)):
    """Top high-confidence picks for today and tomorrow."""
    today = date.today()
    tomorrow = today + timedelta(days=1)

    result = await db.execute(
        select(Game).options(joinedload(Game.prediction))
        .join(Prediction)
        .where(Game.game_date.in_([today, tomorrow]))
        .where(Prediction.confidence_score >= 60)
        .order_by(Prediction.confidence_score.desc())
        .limit(10)
    )
    games = result.unique().scalars().all()

    return [
        {
            "id": g.id,
            "league": g.league,
            "home_team": g.home_team,
            "away_team": g.away_team,
            "game_date": str(g.game_date),
            "game_time": g.game_time,
            "status": g.status,
            "prediction": {
                "home_win_probability": g.prediction.home_win_probability,
                "away_win_probability": g.prediction.away_win_probability,
                "recommended_pick": g.prediction.recommended_pick,
                "confidence_score": g.prediction.confidence_score,
            } if g.prediction else None,
        }
        for g in games
    ]


@router.get("/recent-results")
async def recent_results(
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    """Recent finished games with prediction results."""
    result = await db.execute(
        select(Game).options(joinedload(Game.prediction))
        .where(Game.status == "final")
        .where(Game.home_score.isnot(None))
        .order_by(Game.game_date.desc(), Game.id.desc())
        .limit(limit)
    )
    games = result.unique().scalars().all()

    results = []
    for g in games:
        if not g.prediction or g.home_score is None or g.away_score is None:
            continue
        actual = "home" if g.home_score > g.away_score else ("away" if g.away_score > g.home_score else "draw")
        is_correct = g.prediction.recommended_pick == actual if actual != "draw" else None
        results.append({
            "id": g.id,
            "league": g.league,
            "home_team": g.home_team,
            "away_team": g.away_team,
            "game_date": str(g.game_date),
            "home_score": g.home_score,
            "away_score": g.away_score,
            "predicted_pick": g.prediction.recommended_pick,
            "confidence_score": g.prediction.confidence_score,
            "actual_winner": actual,
            "is_correct": is_correct,
        })

    return results


@router.get("/league-standings")
async def league_standings(
    league: str = Query(..., regex="^(MLB|NPB|KBO)$"),
    db: AsyncSession = Depends(get_db),
):
    """Team standings for a league."""
    result = await db.execute(
        select(TeamStats)
        .where(TeamStats.league == league)
        .order_by(TeamStats.league_rank.asc())
    )
    teams = result.scalars().all()

    return [
        {
            "team_name": t.team_name,
            "league": t.league,
            "rank": t.league_rank,
            "wins": t.wins,
            "losses": t.losses,
            "games_played": t.games_played,
            "win_rate": round(t.wins / max(1, t.games_played), 3),
            "elo_rating": t.elo_rating,
            "avg_runs_scored": t.avg_runs_scored,
            "avg_runs_allowed": t.avg_runs_allowed,
            "run_differential": t.run_differential,
            "streak": t.streak,
        }
        for t in teams
    ]
