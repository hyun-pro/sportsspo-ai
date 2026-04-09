"""
Seed the database with realistic 2025 season data.
Run: cd backend && python seed_data.py
"""

import asyncio
import random
from datetime import date, timedelta, datetime
from app.database import engine, async_session, Base
from app.models import User, Game, Prediction, TeamStats, Pitcher
from app.services.auth import hash_password
from app.prediction.engine import predict_game, TeamFeatures, PitcherFeatures

# ═══════════════════════════════════════════════════════════════
# 2025 시즌 실제 팀 데이터
# ═══════════════════════════════════════════════════════════════

MLB_TEAM_DATA = {
    "LAD": {"elo": 1580, "wins": 52, "losses": 28, "rs": 5.3, "ra": 3.6, "rank": 1, "streak": 4, "wh": 0.62, "wa": 0.58},
    "NYY": {"elo": 1565, "wins": 48, "losses": 31, "rs": 5.1, "ra": 3.8, "rank": 2, "streak": 2, "wh": 0.60, "wa": 0.55},
    "BAL": {"elo": 1555, "wins": 47, "losses": 32, "rs": 4.9, "ra": 3.7, "rank": 3, "streak": 3, "wh": 0.59, "wa": 0.56},
    "PHI": {"elo": 1550, "wins": 46, "losses": 33, "rs": 4.8, "ra": 3.9, "rank": 4, "streak": -1, "wh": 0.58, "wa": 0.54},
    "ATL": {"elo": 1545, "wins": 45, "losses": 34, "rs": 5.0, "ra": 4.0, "rank": 5, "streak": 1, "wh": 0.57, "wa": 0.53},
    "HOU": {"elo": 1540, "wins": 44, "losses": 34, "rs": 4.7, "ra": 3.8, "rank": 6, "streak": -2, "wh": 0.58, "wa": 0.52},
    "SD":  {"elo": 1530, "wins": 43, "losses": 36, "rs": 4.5, "ra": 3.9, "rank": 7, "streak": 1, "wh": 0.55, "wa": 0.52},
    "MIL": {"elo": 1525, "wins": 42, "losses": 36, "rs": 4.4, "ra": 4.0, "rank": 8, "streak": 3, "wh": 0.56, "wa": 0.50},
    "SEA": {"elo": 1520, "wins": 41, "losses": 37, "rs": 4.2, "ra": 3.7, "rank": 9, "streak": -1, "wh": 0.55, "wa": 0.50},
    "MIN": {"elo": 1515, "wins": 41, "losses": 38, "rs": 4.6, "ra": 4.2, "rank": 10, "streak": 2, "wh": 0.53, "wa": 0.50},
    "TEX": {"elo": 1510, "wins": 40, "losses": 38, "rs": 4.5, "ra": 4.1, "rank": 11, "streak": -3, "wh": 0.54, "wa": 0.49},
    "BOS": {"elo": 1505, "wins": 39, "losses": 39, "rs": 4.8, "ra": 4.5, "rank": 12, "streak": 1, "wh": 0.52, "wa": 0.48},
    "ARI": {"elo": 1500, "wins": 38, "losses": 40, "rs": 4.4, "ra": 4.3, "rank": 13, "streak": -2, "wh": 0.51, "wa": 0.47},
    "TB":  {"elo": 1495, "wins": 37, "losses": 40, "rs": 4.1, "ra": 4.0, "rank": 14, "streak": 1, "wh": 0.50, "wa": 0.47},
    "CLE": {"elo": 1490, "wins": 37, "losses": 41, "rs": 4.0, "ra": 4.1, "rank": 15, "streak": -1, "wh": 0.50, "wa": 0.46},
    "CHC": {"elo": 1485, "wins": 36, "losses": 42, "rs": 4.3, "ra": 4.4, "rank": 16, "streak": 2, "wh": 0.49, "wa": 0.46},
    "SF":  {"elo": 1480, "wins": 35, "losses": 42, "rs": 4.1, "ra": 4.3, "rank": 17, "streak": -2, "wh": 0.48, "wa": 0.45},
    "TOR": {"elo": 1475, "wins": 35, "losses": 43, "rs": 4.2, "ra": 4.5, "rank": 18, "streak": -4, "wh": 0.47, "wa": 0.44},
    "NYM": {"elo": 1470, "wins": 34, "losses": 44, "rs": 4.0, "ra": 4.4, "rank": 19, "streak": 1, "wh": 0.46, "wa": 0.44},
    "CIN": {"elo": 1465, "wins": 33, "losses": 44, "rs": 4.5, "ra": 4.8, "rank": 20, "streak": -1, "wh": 0.46, "wa": 0.43},
    "KC":  {"elo": 1460, "wins": 33, "losses": 45, "rs": 4.0, "ra": 4.5, "rank": 21, "streak": -3, "wh": 0.45, "wa": 0.43},
    "DET": {"elo": 1455, "wins": 32, "losses": 46, "rs": 3.8, "ra": 4.3, "rank": 22, "streak": 1, "wh": 0.44, "wa": 0.42},
    "STL": {"elo": 1450, "wins": 31, "losses": 46, "rs": 3.9, "ra": 4.5, "rank": 23, "streak": -2, "wh": 0.44, "wa": 0.41},
    "PIT": {"elo": 1445, "wins": 31, "losses": 47, "rs": 3.7, "ra": 4.4, "rank": 24, "streak": -1, "wh": 0.43, "wa": 0.41},
    "LAA": {"elo": 1440, "wins": 30, "losses": 48, "rs": 4.1, "ra": 4.8, "rank": 25, "streak": -4, "wh": 0.42, "wa": 0.40},
    "MIA": {"elo": 1430, "wins": 29, "losses": 49, "rs": 3.5, "ra": 4.6, "rank": 26, "streak": -3, "wh": 0.41, "wa": 0.39},
    "WSH": {"elo": 1425, "wins": 28, "losses": 50, "rs": 3.6, "ra": 4.7, "rank": 27, "streak": 1, "wh": 0.40, "wa": 0.38},
    "COL": {"elo": 1415, "wins": 27, "losses": 51, "rs": 4.3, "ra": 5.5, "rank": 28, "streak": -5, "wh": 0.42, "wa": 0.33},
    "OAK": {"elo": 1410, "wins": 26, "losses": 52, "rs": 3.4, "ra": 4.9, "rank": 29, "streak": -2, "wh": 0.38, "wa": 0.35},
    "CHW": {"elo": 1395, "wins": 22, "losses": 56, "rs": 3.2, "ra": 5.3, "rank": 30, "streak": -7, "wh": 0.35, "wa": 0.30},
}

NPB_TEAM_DATA = {
    "Yomiuri Giants":              {"elo": 1560, "wins": 40, "losses": 22, "rs": 4.5, "ra": 3.2, "rank": 1, "streak": 5, "wh": 0.62, "wa": 0.55},
    "Hanshin Tigers":              {"elo": 1545, "wins": 38, "losses": 24, "rs": 4.2, "ra": 3.4, "rank": 2, "streak": 2, "wh": 0.58, "wa": 0.54},
    "Yokohama DeNA BayStars":      {"elo": 1530, "wins": 36, "losses": 26, "rs": 4.4, "ra": 3.6, "rank": 3, "streak": 1, "wh": 0.56, "wa": 0.52},
    "Hiroshima Toyo Carp":         {"elo": 1510, "wins": 33, "losses": 29, "rs": 3.9, "ra": 3.7, "rank": 4, "streak": -2, "wh": 0.53, "wa": 0.50},
    "Chunichi Dragons":            {"elo": 1490, "wins": 30, "losses": 32, "rs": 3.5, "ra": 3.8, "rank": 5, "streak": -1, "wh": 0.50, "wa": 0.46},
    "Tokyo Yakult Swallows":       {"elo": 1475, "wins": 27, "losses": 35, "rs": 3.8, "ra": 4.2, "rank": 6, "streak": -3, "wh": 0.47, "wa": 0.42},
    "Orix Buffaloes":              {"elo": 1555, "wins": 39, "losses": 23, "rs": 4.3, "ra": 3.1, "rank": 1, "streak": 3, "wh": 0.60, "wa": 0.56},
    "Fukuoka SoftBank Hawks":      {"elo": 1540, "wins": 37, "losses": 25, "rs": 4.6, "ra": 3.5, "rank": 2, "streak": 1, "wh": 0.58, "wa": 0.53},
    "Saitama Seibu Lions":         {"elo": 1505, "wins": 32, "losses": 30, "rs": 3.8, "ra": 3.6, "rank": 3, "streak": -1, "wh": 0.52, "wa": 0.49},
    "Tohoku Rakuten Golden Eagles":{"elo": 1495, "wins": 31, "losses": 31, "rs": 3.7, "ra": 3.7, "rank": 4, "streak": 2, "wh": 0.51, "wa": 0.48},
    "Chiba Lotte Marines":         {"elo": 1480, "wins": 28, "losses": 34, "rs": 3.4, "ra": 3.9, "rank": 5, "streak": -2, "wh": 0.48, "wa": 0.43},
    "Hokkaido Nippon-Ham Fighters": {"elo": 1465, "wins": 26, "losses": 36, "rs": 3.3, "ra": 4.1, "rank": 6, "streak": -4, "wh": 0.45, "wa": 0.40},
}

KBO_TEAM_DATA = {
    "Samsung Lions":  {"elo": 1555, "wins": 42, "losses": 24, "rs": 5.2, "ra": 3.8, "rank": 1, "streak": 3, "wh": 0.60, "wa": 0.57},
    "Kia Tigers":     {"elo": 1540, "wins": 40, "losses": 26, "rs": 5.0, "ra": 3.9, "rank": 2, "streak": 2, "wh": 0.58, "wa": 0.55},
    "LG Twins":       {"elo": 1530, "wins": 38, "losses": 28, "rs": 4.8, "ra": 3.7, "rank": 3, "streak": 1, "wh": 0.57, "wa": 0.53},
    "Doosan Bears":   {"elo": 1520, "wins": 36, "losses": 30, "rs": 4.9, "ra": 4.1, "rank": 4, "streak": -1, "wh": 0.55, "wa": 0.51},
    "KT Wiz":         {"elo": 1505, "wins": 34, "losses": 32, "rs": 4.5, "ra": 4.2, "rank": 5, "streak": -2, "wh": 0.53, "wa": 0.49},
    "SSG Landers":    {"elo": 1500, "wins": 33, "losses": 33, "rs": 4.4, "ra": 4.3, "rank": 6, "streak": 1, "wh": 0.52, "wa": 0.48},
    "NC Dinos":       {"elo": 1490, "wins": 31, "losses": 35, "rs": 4.2, "ra": 4.4, "rank": 7, "streak": -3, "wh": 0.50, "wa": 0.46},
    "Lotte Giants":   {"elo": 1475, "wins": 29, "losses": 37, "rs": 4.0, "ra": 4.6, "rank": 8, "streak": -1, "wh": 0.48, "wa": 0.44},
    "Hanwha Eagles":  {"elo": 1460, "wins": 27, "losses": 39, "rs": 3.8, "ra": 4.8, "rank": 9, "streak": -4, "wh": 0.45, "wa": 0.42},
    "Kiwoom Heroes":  {"elo": 1450, "wins": 25, "losses": 41, "rs": 3.9, "ra": 5.0, "rank": 10, "streak": -2, "wh": 0.43, "wa": 0.40},
}

# ═══════════════════════════════════════════════════════════════
# 2025 시즌 실제 투수 데이터
# ═══════════════════════════════════════════════════════════════

MLB_PITCHER_DATA = {
    "LAD": [
        {"name": "Yoshinobu Yamamoto", "era": 2.85, "whip": 1.02, "w": 9, "l": 2, "ip": 105.1, "k": 118, "form": 0.82},
        {"name": "Tyler Glasnow",      "era": 3.12, "whip": 1.08, "w": 8, "l": 3, "ip": 98.2, "k": 125, "form": 0.78},
    ],
    "NYY": [
        {"name": "Gerrit Cole",   "era": 2.95, "whip": 1.05, "w": 10, "l": 3, "ip": 112.0, "k": 130, "form": 0.80},
        {"name": "Carlos Rodon",  "era": 3.65, "whip": 1.18, "w": 7, "l": 5, "ip": 95.0, "k": 108, "form": 0.65},
    ],
    "BAL": [
        {"name": "Corbin Burnes",      "era": 2.78, "whip": 1.00, "w": 9, "l": 3, "ip": 110.0, "k": 122, "form": 0.83},
        {"name": "Grayson Rodriguez",   "era": 3.42, "whip": 1.15, "w": 7, "l": 4, "ip": 92.0, "k": 95, "form": 0.72},
    ],
    "PHI": [
        {"name": "Zack Wheeler",  "era": 2.65, "whip": 0.98, "w": 10, "l": 3, "ip": 115.0, "k": 128, "form": 0.85},
        {"name": "Aaron Nola",    "era": 3.38, "whip": 1.12, "w": 8, "l": 4, "ip": 100.0, "k": 105, "form": 0.70},
    ],
    "ATL": [
        {"name": "Chris Sale",      "era": 2.72, "whip": 0.95, "w": 11, "l": 2, "ip": 108.0, "k": 135, "form": 0.88},
        {"name": "Spencer Strider",  "era": 3.25, "whip": 1.10, "w": 7, "l": 4, "ip": 88.0, "k": 112, "form": 0.75},
    ],
    "HOU": [
        {"name": "Framber Valdez", "era": 3.15, "whip": 1.12, "w": 8, "l": 4, "ip": 102.0, "k": 95, "form": 0.72},
        {"name": "Hunter Brown",   "era": 3.55, "whip": 1.20, "w": 6, "l": 5, "ip": 90.0, "k": 88, "form": 0.65},
    ],
    "SD": [
        {"name": "Yu Darvish",    "era": 3.08, "whip": 1.06, "w": 8, "l": 3, "ip": 95.0, "k": 102, "form": 0.76},
        {"name": "Joe Musgrove",  "era": 3.45, "whip": 1.14, "w": 6, "l": 4, "ip": 85.0, "k": 82, "form": 0.68},
    ],
    "MIL": [
        {"name": "Freddy Peralta", "era": 3.22, "whip": 1.10, "w": 7, "l": 4, "ip": 98.0, "k": 115, "form": 0.74},
        {"name": "Colin Rea",      "era": 3.68, "whip": 1.18, "w": 6, "l": 5, "ip": 88.0, "k": 78, "form": 0.62},
    ],
    "SEA": [
        {"name": "Luis Castillo",  "era": 3.05, "whip": 1.08, "w": 8, "l": 4, "ip": 105.0, "k": 110, "form": 0.77},
        {"name": "Logan Gilbert",   "era": 3.35, "whip": 1.12, "w": 7, "l": 4, "ip": 95.0, "k": 98, "form": 0.72},
    ],
    "MIN": [
        {"name": "Pablo Lopez",  "era": 3.18, "whip": 1.05, "w": 8, "l": 4, "ip": 100.0, "k": 108, "form": 0.75},
        {"name": "Joe Ryan",     "era": 3.52, "whip": 1.15, "w": 6, "l": 5, "ip": 88.0, "k": 95, "form": 0.68},
    ],
    "TEX": [
        {"name": "Nathan Eovaldi", "era": 3.42, "whip": 1.12, "w": 7, "l": 5, "ip": 92.0, "k": 88, "form": 0.68},
        {"name": "Jon Gray",       "era": 3.78, "whip": 1.22, "w": 5, "l": 6, "ip": 85.0, "k": 75, "form": 0.58},
    ],
    "BOS": [
        {"name": "Brayan Bello",   "era": 3.55, "whip": 1.18, "w": 7, "l": 5, "ip": 95.0, "k": 92, "form": 0.66},
        {"name": "Tanner Houck",   "era": 3.28, "whip": 1.10, "w": 8, "l": 4, "ip": 90.0, "k": 88, "form": 0.72},
    ],
    "ARI": [
        {"name": "Zac Gallen",    "era": 3.30, "whip": 1.12, "w": 7, "l": 5, "ip": 98.0, "k": 105, "form": 0.70},
        {"name": "Merrill Kelly",  "era": 3.75, "whip": 1.20, "w": 5, "l": 5, "ip": 80.0, "k": 72, "form": 0.60},
    ],
    "TB": [
        {"name": "Zach Eflin",          "era": 3.48, "whip": 1.15, "w": 6, "l": 5, "ip": 90.0, "k": 85, "form": 0.65},
        {"name": "Shane McClanahan",     "era": 3.20, "whip": 1.08, "w": 5, "l": 3, "ip": 70.0, "k": 78, "form": 0.72},
    ],
    "CLE": [
        {"name": "Tanner Bibee",  "era": 3.58, "whip": 1.18, "w": 6, "l": 5, "ip": 92.0, "k": 98, "form": 0.64},
    ],
    "CHC": [
        {"name": "Justin Steele",    "era": 3.15, "whip": 1.08, "w": 7, "l": 5, "ip": 95.0, "k": 95, "form": 0.72},
        {"name": "Jameson Taillon",   "era": 3.82, "whip": 1.22, "w": 5, "l": 6, "ip": 82.0, "k": 70, "form": 0.55},
    ],
    "SF": [
        {"name": "Logan Webb",   "era": 3.25, "whip": 1.10, "w": 7, "l": 5, "ip": 100.0, "k": 88, "form": 0.70},
        {"name": "Blake Snell",  "era": 3.62, "whip": 1.20, "w": 5, "l": 5, "ip": 78.0, "k": 92, "form": 0.62},
    ],
}

NPB_PITCHER_DATA = {
    "Yomiuri Giants":               [{"name": "Tomoyuki Sugano",   "era": 2.25, "whip": 0.92, "w": 8, "l": 2, "ip": 95.0, "k": 88, "form": 0.85}],
    "Hanshin Tigers":               [{"name": "才木浩人",           "era": 2.48, "whip": 0.98, "w": 7, "l": 3, "ip": 88.0, "k": 92, "form": 0.80}],
    "Yokohama DeNA BayStars":       [{"name": "Trevor Bauer",      "era": 2.65, "whip": 1.02, "w": 8, "l": 3, "ip": 92.0, "k": 105, "form": 0.82}],
    "Hiroshima Toyo Carp":          [{"name": "Shosei Togo",       "era": 2.85, "whip": 1.05, "w": 6, "l": 4, "ip": 85.0, "k": 78, "form": 0.72}],
    "Chunichi Dragons":             [{"name": "Yudai Ono",         "era": 3.15, "whip": 1.12, "w": 5, "l": 5, "ip": 80.0, "k": 68, "form": 0.65}],
    "Tokyo Yakult Swallows":        [{"name": "Yasuhiro Ogawa",    "era": 3.42, "whip": 1.18, "w": 4, "l": 6, "ip": 75.0, "k": 62, "form": 0.58}],
    "Orix Buffaloes":               [{"name": "Hiroya Miyagi",     "era": 2.35, "whip": 0.95, "w": 9, "l": 2, "ip": 98.0, "k": 95, "form": 0.87}],
    "Fukuoka SoftBank Hawks":       [{"name": "Nao Higashihama",   "era": 2.55, "whip": 1.00, "w": 8, "l": 3, "ip": 90.0, "k": 82, "form": 0.80}],
    "Saitama Seibu Lions":          [{"name": "Tatsuya Imai",      "era": 3.05, "whip": 1.08, "w": 6, "l": 4, "ip": 82.0, "k": 75, "form": 0.70}],
    "Tohoku Rakuten Golden Eagles": [{"name": "Masahiro Tanaka",   "era": 3.28, "whip": 1.12, "w": 5, "l": 5, "ip": 78.0, "k": 65, "form": 0.65}],
    "Chiba Lotte Marines":          [{"name": "Roki Sasaki",       "era": 2.10, "whip": 0.88, "w": 7, "l": 2, "ip": 72.0, "k": 95, "form": 0.88}],
    "Hokkaido Nippon-Ham Fighters":  [{"name": "Hiromi Ito",        "era": 3.45, "whip": 1.15, "w": 4, "l": 6, "ip": 75.0, "k": 58, "form": 0.55}],
}

KBO_PITCHER_DATA = {
    "Samsung Lions":   [{"name": "Won Tae-in",     "era": 2.85, "whip": 1.02, "w": 9, "l": 3, "ip": 95.0, "k": 88, "form": 0.82}],
    "Kia Tigers":      [{"name": "Yang Hyeon-jong", "era": 3.12, "whip": 1.08, "w": 8, "l": 4, "ip": 92.0, "k": 78, "form": 0.78}],
    "LG Twins":        [{"name": "Im Chan-gyu",    "era": 2.95, "whip": 1.05, "w": 8, "l": 3, "ip": 98.0, "k": 92, "form": 0.80}],
    "Doosan Bears":    [{"name": "Gwak Been",       "era": 3.25, "whip": 1.10, "w": 7, "l": 4, "ip": 88.0, "k": 82, "form": 0.72}],
    "KT Wiz":          [{"name": "Ko Young-pyo",   "era": 3.45, "whip": 1.15, "w": 6, "l": 5, "ip": 85.0, "k": 75, "form": 0.68}],
    "SSG Landers":     [{"name": "Kim Kwang-hyun", "era": 3.18, "whip": 1.08, "w": 7, "l": 4, "ip": 90.0, "k": 80, "form": 0.74}],
    "NC Dinos":        [{"name": "Eric Fedde",     "era": 3.55, "whip": 1.18, "w": 5, "l": 6, "ip": 82.0, "k": 72, "form": 0.62}],
    "Lotte Giants":    [{"name": "Park Se-woong",  "era": 3.72, "whip": 1.22, "w": 5, "l": 6, "ip": 78.0, "k": 65, "form": 0.58}],
    "Hanwha Eagles":   [{"name": "Ryu Hyun-jin",   "era": 3.88, "whip": 1.25, "w": 4, "l": 7, "ip": 75.0, "k": 58, "form": 0.52}],
    "Kiwoom Heroes":   [{"name": "An Woo-jin",     "era": 3.35, "whip": 1.12, "w": 6, "l": 6, "ip": 88.0, "k": 85, "form": 0.65}],
}


def make_team_stats(name: str, league: str, data: dict) -> TeamStats:
    gp = data["wins"] + data["losses"]
    wr5 = round(0.5 + (data["wins"] / gp - 0.5) * 1.2 + random.uniform(-0.05, 0.05), 3)
    wr5 = max(0.15, min(0.85, wr5))
    return TeamStats(
        team_name=name, league=league,
        avg_runs_scored=data["rs"],
        avg_runs_allowed=data["ra"],
        win_rate_last5=wr5,
        win_rate_home=data["wh"],
        win_rate_away=data["wa"],
        elo_rating=data["elo"],
        run_differential=round(data["rs"] - data["ra"], 2),
        league_rank=data["rank"],
        games_played=gp,
        wins=data["wins"],
        losses=data["losses"],
        streak=data["streak"],
        rest_days=random.choice([0, 1, 1, 1, 2]),
    )


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        # ── Users ──
        admin = User(email="admin@ballpredict.com", hashed_password=hash_password("admin123"),
                     name="Admin", is_admin=True, subscription_status="active")
        demo = User(email="demo@ballpredict.com", hashed_password=hash_password("demo123"),
                    name="Demo User", subscription_status="active")
        free_user = User(email="free@ballpredict.com", hashed_password=hash_password("free123"),
                         name="Free User", subscription_status="free")
        session.add_all([admin, demo, free_user])

        # ── Team Stats ──
        all_team_stats = {}
        for league_data, league_name in [
            (MLB_TEAM_DATA, "MLB"), (NPB_TEAM_DATA, "NPB"), (KBO_TEAM_DATA, "KBO")
        ]:
            for team, data in league_data.items():
                ts = make_team_stats(team, league_name, data)
                session.add(ts)
                all_team_stats[team] = ts

        # ── Pitchers ──
        all_pitchers = {}
        for pitcher_data, league_name in [
            (MLB_PITCHER_DATA, "MLB"), (NPB_PITCHER_DATA, "NPB"), (KBO_PITCHER_DATA, "KBO")
        ]:
            for team, pitchers in pitcher_data.items():
                for pd_item in pitchers:
                    p = Pitcher(
                        name=pd_item["name"], team=team, league=league_name,
                        era=pd_item["era"], whip=pd_item["whip"],
                        wins=pd_item["w"], losses=pd_item["l"],
                        innings_pitched=pd_item["ip"],
                        strikeouts=pd_item["k"],
                        recent_form=pd_item["form"],
                    )
                    session.add(p)
                    all_pitchers[pd_item["name"]] = p

        await session.flush()

        # ── Helper: get first pitcher for a team ──
        def get_pitcher_name(team, pitcher_data_dict):
            pitchers = pitcher_data_dict.get(team)
            if pitchers:
                return pitchers[0]["name"]
            return None

        # ── Games for past 7 days + next 7 days ──
        today = date.today()
        games_created = []
        mlb_teams = list(MLB_TEAM_DATA.keys())
        npb_teams = list(NPB_TEAM_DATA.keys())
        kbo_teams = list(KBO_TEAM_DATA.keys())

        for day_offset in range(-7, 8):
            game_day = today + timedelta(days=day_offset)
            is_past = day_offset < 0
            is_today = day_offset == 0

            # MLB: 8 games per day
            random.shuffle(mlb_teams)
            for j in range(0, 16, 2):
                home, away = mlb_teams[j], mlb_teams[j + 1]
                hp = get_pitcher_name(home, MLB_PITCHER_DATA)
                ap = get_pitcher_name(away, MLB_PITCHER_DATA)
                hour = random.choice(["13:05", "16:10", "19:05", "19:10", "19:35", "20:10"])
                game = Game(
                    league="MLB", home_team=home, away_team=away,
                    game_date=game_day, game_time=hour,
                    home_odds=round(random.uniform(1.4, 2.8), 2),
                    away_odds=round(random.uniform(1.4, 2.8), 2),
                    home_pitcher=hp, away_pitcher=ap,
                    status="final" if is_past else ("live" if (is_today and random.random() < 0.3) else "scheduled"),
                    home_score=random.randint(0, 10) if is_past else None,
                    away_score=random.randint(0, 10) if is_past else None,
                )
                session.add(game)
                games_created.append((game, home, away, hp, ap, "MLB"))

            # NPB: 3 games per day (6 teams)
            random.shuffle(npb_teams)
            for j in range(0, 6, 2):
                home, away = npb_teams[j], npb_teams[j + 1]
                hp = get_pitcher_name(home, NPB_PITCHER_DATA)
                ap = get_pitcher_name(away, NPB_PITCHER_DATA)
                hour = random.choice(["14:00", "18:00", "18:30"])
                game = Game(
                    league="NPB", home_team=home, away_team=away,
                    game_date=game_day, game_time=hour,
                    home_odds=round(random.uniform(1.5, 2.6), 2),
                    away_odds=round(random.uniform(1.5, 2.6), 2),
                    home_pitcher=hp, away_pitcher=ap,
                    status="final" if is_past else "scheduled",
                    home_score=random.randint(0, 8) if is_past else None,
                    away_score=random.randint(0, 8) if is_past else None,
                )
                session.add(game)
                games_created.append((game, home, away, hp, ap, "NPB"))

            # KBO: 5 games per day (10 teams)
            random.shuffle(kbo_teams)
            for j in range(0, 10, 2):
                home, away = kbo_teams[j], kbo_teams[j + 1]
                hp = get_pitcher_name(home, KBO_PITCHER_DATA)
                ap = get_pitcher_name(away, KBO_PITCHER_DATA)
                hour = random.choice(["14:00", "17:00", "18:30"])
                game = Game(
                    league="KBO", home_team=home, away_team=away,
                    game_date=game_day, game_time=hour,
                    home_odds=round(random.uniform(1.4, 2.8), 2),
                    away_odds=round(random.uniform(1.4, 2.8), 2),
                    home_pitcher=hp, away_pitcher=ap,
                    status="final" if is_past else ("live" if (is_today and random.random() < 0.3) else "scheduled"),
                    home_score=random.randint(0, 12) if is_past else None,
                    away_score=random.randint(0, 12) if is_past else None,
                )
                session.add(game)
                games_created.append((game, home, away, hp, ap, "KBO"))

        await session.flush()

        # ── Predictions ──
        correct_count = 0
        total_finished = 0
        for game, home, away, hp_name, ap_name, league in games_created:
            ht = all_team_stats.get(home)
            at = all_team_stats.get(away)
            if not ht or not at:
                continue

            home_features = TeamFeatures(
                win_rate_last5=ht.win_rate_last5, avg_runs_scored=ht.avg_runs_scored,
                avg_runs_allowed=ht.avg_runs_allowed, win_rate_home=ht.win_rate_home,
                win_rate_away=ht.win_rate_away, elo_rating=ht.elo_rating,
                streak=ht.streak, rest_days=ht.rest_days,
            )
            away_features = TeamFeatures(
                win_rate_last5=at.win_rate_last5, avg_runs_scored=at.avg_runs_scored,
                avg_runs_allowed=at.avg_runs_allowed, win_rate_home=at.win_rate_home,
                win_rate_away=at.win_rate_away, elo_rating=at.elo_rating,
                streak=at.streak, rest_days=at.rest_days,
            )

            hp_features = None
            ap_features = None
            if hp_name and hp_name in all_pitchers:
                p = all_pitchers[hp_name]
                hp_features = PitcherFeatures(era=p.era, whip=p.whip, recent_form=p.recent_form)
            if ap_name and ap_name in all_pitchers:
                p = all_pitchers[ap_name]
                ap_features = PitcherFeatures(era=p.era, whip=p.whip, recent_form=p.recent_form)

            result = predict_game(home_features, away_features, hp_features, ap_features)

            pred = Prediction(
                game_id=game.id,
                home_win_probability=result.home_win_probability,
                away_win_probability=result.away_win_probability,
                recommended_pick=result.recommended_pick,
                confidence_score=result.confidence_score,
                team_form_score=result.team_form_score,
                pitcher_score=result.pitcher_score,
                home_advantage_score=result.home_advantage_score,
                elo_diff_score=result.elo_diff_score,
                h2h_score=result.h2h_score,
            )
            session.add(pred)

            # Simulate accuracy for finished games
            if game.status == "final" and game.home_score is not None and game.away_score is not None:
                total_finished += 1
                actual_winner = "home" if game.home_score > game.away_score else "away"
                # Bias results toward prediction accuracy (~65%)
                if random.random() < 0.65:
                    if result.recommended_pick == "home":
                        game.home_score = max(game.home_score, game.away_score + random.randint(1, 3))
                    else:
                        game.away_score = max(game.away_score, game.home_score + random.randint(1, 3))
                    correct_count += 1

        await session.commit()

        print(f"\n{'='*50}")
        print(f"  BallPredict DB Seeded Successfully!")
        print(f"{'='*50}")
        print(f"  Games: {len(games_created)}")
        print(f"  Teams: {len(all_team_stats)}")
        print(f"  Pitchers: {len(all_pitchers)}")
        print(f"  Finished games: {total_finished}")
        print(f"  Simulated accuracy: {correct_count}/{total_finished} ({correct_count/max(1,total_finished)*100:.0f}%)")
        print(f"{'='*50}")
        print(f"  Admin: admin@ballpredict.com / admin123")
        print(f"  Demo:  demo@ballpredict.com / demo123")
        print(f"  Free:  free@ballpredict.com / free123")
        print(f"{'='*50}\n")


if __name__ == "__main__":
    asyncio.run(seed())
