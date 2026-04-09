from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, ForeignKey("games.id"), unique=True, nullable=False)
    home_win_probability = Column(Float, nullable=False)
    away_win_probability = Column(Float, nullable=False)
    recommended_pick = Column(String(10), nullable=False)  # home, away
    confidence_score = Column(Integer, nullable=False)  # 0-100
    team_form_score = Column(Float, nullable=True)
    pitcher_score = Column(Float, nullable=True)
    home_advantage_score = Column(Float, nullable=True)
    elo_diff_score = Column(Float, nullable=True)
    h2h_score = Column(Float, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    game = relationship("Game", back_populates="prediction")
