from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import joinedload
from datetime import date, datetime, timezone
from typing import Optional
from app.database import get_db
from app.models.game import Game
from app.models.prediction import Prediction
from app.models.team_stats import TeamStats
from app.models.pitcher import Pitcher
from app.models.user import User
from app.schemas.game import GameResponse, GameListResponse
from app.schemas.stats import MatchDetailResponse, TeamStatsResponse, PitcherResponse, GameDetailSchema
from app.services.auth import get_current_user, get_optional_user, check_subscription
from app.config import get_settings

router = APIRouter(prefix="/api/games", tags=["games"])
settings = get_settings()


@router.get("", response_model=GameListResponse)
async def list_games(
    league: Optional[str] = Query(None, regex="^(MLB|NPB|KBO)$"),
    game_date: Optional[date] = None,
    min_confidence: Optional[int] = Query(None, ge=0, le=100),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Game).options(joinedload(Game.prediction))
    count_query = select(func.count(Game.id))

    filters = []
    if league:
        filters.append(Game.league == league)
    if game_date:
        filters.append(Game.game_date == game_date)

    if filters:
        query = query.where(and_(*filters))
        count_query = count_query.where(and_(*filters))

    if min_confidence is not None:
        query = query.join(Prediction).where(Prediction.confidence_score >= min_confidence)
        count_query = count_query.join(Prediction).where(Prediction.confidence_score >= min_confidence)

    total_result = await db.execute(count_query)
    total = total_result.scalar()

    query = query.order_by(Game.game_date.desc(), Game.id).offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    games = result.unique().scalars().all()

    is_premium = user and check_subscription(user)
    game_responses = []
    for i, game in enumerate(games):
        gr = GameResponse.model_validate(game)
        if not is_premium and i >= settings.free_predictions_per_day and gr.prediction:
            gr.prediction.home_win_probability = 0
            gr.prediction.away_win_probability = 0
            gr.prediction.confidence_score = 0
            gr.prediction.recommended_pick = "locked"
        game_responses.append(gr)

    return GameListResponse(games=game_responses, total=total, page=page, per_page=per_page)


@router.get("/{game_id}")
async def get_game_detail(
    game_id: int,
    user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Game).options(joinedload(Game.prediction)).where(Game.id == game_id)
    )
    game = result.unique().scalar_one_or_none()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    game_detail = GameDetailSchema(
        id=game.id,
        league=game.league,
        home_team=game.home_team,
        away_team=game.away_team,
        game_date=str(game.game_date),
        game_time=game.game_time,
        status=game.status,
        home_score=game.home_score,
        away_score=game.away_score,
        home_odds=game.home_odds,
        away_odds=game.away_odds,
        home_pitcher=game.home_pitcher,
        away_pitcher=game.away_pitcher,
        home_win_probability=game.prediction.home_win_probability if game.prediction else None,
        away_win_probability=game.prediction.away_win_probability if game.prediction else None,
        recommended_pick=game.prediction.recommended_pick if game.prediction else None,
        confidence_score=game.prediction.confidence_score if game.prediction else None,
    )

    # Fetch team stats
    home_stats_result = await db.execute(
        select(TeamStats).where(TeamStats.team_name == game.home_team)
    )
    away_stats_result = await db.execute(
        select(TeamStats).where(TeamStats.team_name == game.away_team)
    )
    home_stats = home_stats_result.scalar_one_or_none()
    away_stats = away_stats_result.scalar_one_or_none()

    # Fetch pitcher stats
    home_pitcher_stats = None
    away_pitcher_stats = None
    if game.home_pitcher:
        r = await db.execute(select(Pitcher).where(Pitcher.name == game.home_pitcher))
        home_pitcher_stats = r.scalar_one_or_none()
    if game.away_pitcher:
        r = await db.execute(select(Pitcher).where(Pitcher.name == game.away_pitcher))
        away_pitcher_stats = r.scalar_one_or_none()

    is_premium = user and check_subscription(user)
    if not is_premium:
        game_detail.home_win_probability = None
        game_detail.away_win_probability = None
        game_detail.confidence_score = None
        game_detail.recommended_pick = None

    return {
        "game": game_detail.model_dump(),
        "home_team_stats": TeamStatsResponse.model_validate(home_stats).model_dump() if home_stats else None,
        "away_team_stats": TeamStatsResponse.model_validate(away_stats).model_dump() if away_stats else None,
        "home_pitcher_stats": PitcherResponse.model_validate(home_pitcher_stats).model_dump() if home_pitcher_stats else None,
        "away_pitcher_stats": PitcherResponse.model_validate(away_pitcher_stats).model_dump() if away_pitcher_stats else None,
        "is_premium": is_premium,
    }
