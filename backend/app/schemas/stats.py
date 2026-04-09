from pydantic import BaseModel
from typing import Optional


class TeamStatsResponse(BaseModel):
    id: int
    team_name: str
    league: str
    avg_runs_scored: float
    avg_runs_allowed: float
    win_rate_last5: float
    win_rate_home: float
    win_rate_away: float
    elo_rating: float
    run_differential: float
    league_rank: int
    games_played: int
    wins: int
    losses: int
    streak: int

    class Config:
        from_attributes = True


class PitcherResponse(BaseModel):
    id: int
    name: str
    team: str
    league: str
    era: float
    whip: float
    wins: int
    losses: int
    innings_pitched: float
    strikeouts: int
    recent_form: float

    class Config:
        from_attributes = True


class MatchDetailResponse(BaseModel):
    game: "GameDetailSchema"
    home_team_stats: Optional[TeamStatsResponse] = None
    away_team_stats: Optional[TeamStatsResponse] = None
    home_pitcher_stats: Optional[PitcherResponse] = None
    away_pitcher_stats: Optional[PitcherResponse] = None


class GameDetailSchema(BaseModel):
    id: int
    league: str
    home_team: str
    away_team: str
    game_date: str
    game_time: Optional[str] = None
    status: str
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    home_odds: Optional[float] = None
    away_odds: Optional[float] = None
    home_pitcher: Optional[str] = None
    away_pitcher: Optional[str] = None
    home_win_probability: Optional[float] = None
    away_win_probability: Optional[float] = None
    recommended_pick: Optional[str] = None
    confidence_score: Optional[int] = None

    class Config:
        from_attributes = True


MatchDetailResponse.model_rebuild()
