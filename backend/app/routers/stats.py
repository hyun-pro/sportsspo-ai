from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from app.database import get_db
from app.models.team_stats import TeamStats
from app.models.pitcher import Pitcher
from app.schemas.stats import TeamStatsResponse, PitcherResponse

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("/teams", response_model=list[TeamStatsResponse])
async def list_team_stats(
    league: Optional[str] = Query(None, regex="^(MLB|NPB|KBO)$"),
    db: AsyncSession = Depends(get_db),
):
    query = select(TeamStats)
    if league:
        query = query.where(TeamStats.league == league)
    query = query.order_by(TeamStats.elo_rating.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/pitchers", response_model=list[PitcherResponse])
async def list_pitchers(
    league: Optional[str] = Query(None, regex="^(MLB|NPB|KBO)$"),
    team: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Pitcher)
    if league:
        query = query.where(Pitcher.league == league)
    if team:
        query = query.where(Pitcher.team == team)
    query = query.order_by(Pitcher.era.asc())
    result = await db.execute(query)
    return result.scalars().all()
