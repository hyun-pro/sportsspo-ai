from sqlalchemy import Column, Integer, String, DateTime, Date, Float, func
from sqlalchemy.orm import relationship
from app.database import Base


class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(String(100), unique=True, nullable=True)
    league = Column(String(10), nullable=False, index=True)  # MLB, NPB, KBO
    home_team = Column(String(100), nullable=False)
    away_team = Column(String(100), nullable=False)
    game_date = Column(Date, nullable=False, index=True)
    game_time = Column(String(10), nullable=True)
    home_score = Column(Integer, nullable=True)
    away_score = Column(Integer, nullable=True)
    status = Column(String(20), default="scheduled")  # scheduled, live, final
    home_odds = Column(Float, nullable=True)
    away_odds = Column(Float, nullable=True)
    home_pitcher = Column(String(100), nullable=True)
    away_pitcher = Column(String(100), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    prediction = relationship("Prediction", back_populates="game", uselist=False)
