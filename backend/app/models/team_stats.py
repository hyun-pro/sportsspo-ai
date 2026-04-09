from sqlalchemy import Column, Integer, String, Float, DateTime, func
from app.database import Base


class TeamStats(Base):
    __tablename__ = "team_stats"

    id = Column(Integer, primary_key=True, index=True)
    team_name = Column(String(100), nullable=False, index=True)
    league = Column(String(10), nullable=False, index=True)
    avg_runs_scored = Column(Float, default=0.0)
    avg_runs_allowed = Column(Float, default=0.0)
    win_rate_last5 = Column(Float, default=0.5)
    win_rate_home = Column(Float, default=0.5)
    win_rate_away = Column(Float, default=0.5)
    elo_rating = Column(Float, default=1500.0)
    run_differential = Column(Float, default=0.0)
    league_rank = Column(Integer, default=0)
    rest_days = Column(Integer, default=1)
    games_played = Column(Integer, default=0)
    wins = Column(Integer, default=0)
    losses = Column(Integer, default=0)
    streak = Column(Integer, default=0)  # positive = win streak, negative = loss streak
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
