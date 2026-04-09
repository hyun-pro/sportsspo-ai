from sqlalchemy import Column, Integer, String, Float, DateTime, func
from app.database import Base


class Pitcher(Base):
    __tablename__ = "pitchers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    team = Column(String(100), nullable=False)
    league = Column(String(10), nullable=False)
    era = Column(Float, default=4.50)
    whip = Column(Float, default=1.30)
    wins = Column(Integer, default=0)
    losses = Column(Integer, default=0)
    innings_pitched = Column(Float, default=0.0)
    strikeouts = Column(Integer, default=0)
    recent_form = Column(Float, default=0.5)  # 0-1 scale based on last 3 games
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
