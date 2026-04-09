"""
Baseball Prediction Engine

Weighted scoring model:
  Score = (Team Form * 0.25) + (Pitcher Strength * 0.30) +
          (Home Advantage * 0.10) + (ELO Difference * 0.20) + (H2H * 0.15)

Converts score into win probability using sigmoid function.
Architecture prepared for future ML model upgrade (XGBoost/LightGBM).
"""

import numpy as np
from dataclasses import dataclass
from typing import Optional


@dataclass
class TeamFeatures:
    win_rate_last5: float = 0.5
    avg_runs_scored: float = 4.5
    avg_runs_allowed: float = 4.5
    win_rate_home: float = 0.5
    win_rate_away: float = 0.5
    elo_rating: float = 1500.0
    run_differential: float = 0.0
    streak: int = 0
    rest_days: int = 1


@dataclass
class PitcherFeatures:
    era: float = 4.50
    whip: float = 1.30
    recent_form: float = 0.5


@dataclass
class PredictionResult:
    home_win_probability: float
    away_win_probability: float
    recommended_pick: str
    confidence_score: int
    team_form_score: float
    pitcher_score: float
    home_advantage_score: float
    elo_diff_score: float
    h2h_score: float


# Weights for the scoring model
WEIGHTS = {
    "team_form": 0.25,
    "pitcher": 0.30,
    "home_advantage": 0.10,
    "elo": 0.20,
    "h2h": 0.15,
}


def sigmoid(x: float) -> float:
    return 1.0 / (1.0 + np.exp(-x))


def normalize(value: float, min_val: float, max_val: float) -> float:
    if max_val == min_val:
        return 0.5
    return max(0.0, min(1.0, (value - min_val) / (max_val - min_val)))


def compute_team_form_score(home: TeamFeatures, away: TeamFeatures) -> float:
    """Compare recent team form. Returns score favoring home (>0.5) or away (<0.5)."""
    home_form = (
        home.win_rate_last5 * 0.4
        + normalize(home.avg_runs_scored, 2.0, 7.0) * 0.3
        + (1.0 - normalize(home.avg_runs_allowed, 2.0, 7.0)) * 0.2
        + normalize(home.streak, -5, 5) * 0.1
    )
    away_form = (
        away.win_rate_last5 * 0.4
        + normalize(away.avg_runs_scored, 2.0, 7.0) * 0.3
        + (1.0 - normalize(away.avg_runs_allowed, 2.0, 7.0)) * 0.2
        + normalize(away.streak, -5, 5) * 0.1
    )
    diff = home_form - away_form
    return sigmoid(diff * 3.0)


def compute_pitcher_score(
    home_pitcher: Optional[PitcherFeatures],
    away_pitcher: Optional[PitcherFeatures],
) -> float:
    """Compare starting pitchers. Lower ERA/WHIP = better."""
    if home_pitcher is None and away_pitcher is None:
        return 0.5

    def pitcher_strength(p: PitcherFeatures) -> float:
        era_score = 1.0 - normalize(p.era, 1.5, 7.0)
        whip_score = 1.0 - normalize(p.whip, 0.8, 2.0)
        form_score = p.recent_form
        return era_score * 0.4 + whip_score * 0.3 + form_score * 0.3

    hp = pitcher_strength(home_pitcher) if home_pitcher else 0.5
    ap = pitcher_strength(away_pitcher) if away_pitcher else 0.5
    diff = hp - ap
    return sigmoid(diff * 3.0)


def compute_home_advantage(home: TeamFeatures, away: TeamFeatures) -> float:
    """Home teams historically win ~54% in baseball."""
    base_advantage = 0.54
    home_boost = (home.win_rate_home - 0.5) * 0.3
    away_penalty = (0.5 - away.win_rate_away) * 0.2
    rest_factor = 0.0
    if home.rest_days == 0:
        rest_factor -= 0.03
    if away.rest_days == 0:
        rest_factor += 0.03
    return min(0.75, max(0.25, base_advantage + home_boost + away_penalty + rest_factor))


def compute_elo_score(home: TeamFeatures, away: TeamFeatures) -> float:
    """ELO-based prediction."""
    elo_diff = home.elo_rating - away.elo_rating
    expected = 1.0 / (1.0 + 10 ** (-elo_diff / 400.0))
    return expected


def compute_h2h_score(
    home_wins_vs_away: int = 0,
    away_wins_vs_home: int = 0,
) -> float:
    """Head-to-head record. Returns score favoring home if >0.5."""
    total = home_wins_vs_away + away_wins_vs_home
    if total == 0:
        return 0.5
    return home_wins_vs_away / total


def predict_game(
    home_team: TeamFeatures,
    away_team: TeamFeatures,
    home_pitcher: Optional[PitcherFeatures] = None,
    away_pitcher: Optional[PitcherFeatures] = None,
    home_h2h_wins: int = 0,
    away_h2h_wins: int = 0,
) -> PredictionResult:
    """Run the full prediction pipeline."""
    team_form = compute_team_form_score(home_team, away_team)
    pitcher = compute_pitcher_score(home_pitcher, away_pitcher)
    home_adv = compute_home_advantage(home_team, away_team)
    elo = compute_elo_score(home_team, away_team)
    h2h = compute_h2h_score(home_h2h_wins, away_h2h_wins)

    weighted_score = (
        team_form * WEIGHTS["team_form"]
        + pitcher * WEIGHTS["pitcher"]
        + home_adv * WEIGHTS["home_advantage"]
        + elo * WEIGHTS["elo"]
        + h2h * WEIGHTS["h2h"]
    )

    home_prob = round(weighted_score * 100, 1)
    away_prob = round((1 - weighted_score) * 100, 1)

    recommended = "home" if weighted_score >= 0.5 else "away"
    confidence = int(abs(weighted_score - 0.5) * 200)
    confidence = min(99, max(1, confidence))

    return PredictionResult(
        home_win_probability=home_prob,
        away_win_probability=away_prob,
        recommended_pick=recommended,
        confidence_score=confidence,
        team_form_score=round(team_form, 4),
        pitcher_score=round(pitcher, 4),
        home_advantage_score=round(home_adv, 4),
        elo_diff_score=round(elo, 4),
        h2h_score=round(h2h, 4),
    )
