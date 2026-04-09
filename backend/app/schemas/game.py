from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional


class GameBase(BaseModel):
    league: str
    home_team: str
    away_team: str
    game_date: date
    game_time: Optional[str] = None
    home_odds: Optional[float] = None
    away_odds: Optional[float] = None
    home_pitcher: Optional[str] = None
    away_pitcher: Optional[str] = None


class GameCreate(GameBase):
    pass


class PredictionResponse(BaseModel):
    id: int
    home_win_probability: float
    away_win_probability: float
    recommended_pick: str
    confidence_score: int
    team_form_score: Optional[float] = None
    pitcher_score: Optional[float] = None
    home_advantage_score: Optional[float] = None
    elo_diff_score: Optional[float] = None
    h2h_score: Optional[float] = None

    class Config:
        from_attributes = True


class GameResponse(GameBase):
    id: int
    status: str
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    prediction: Optional[PredictionResponse] = None
    created_at: datetime

    class Config:
        from_attributes = True


class GameListResponse(BaseModel):
    games: list[GameResponse]
    total: int
    page: int
    per_page: int
