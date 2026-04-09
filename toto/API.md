# API 명세서

Base URL: `http://localhost:8000/api`

## 인증 (Auth)

### POST /auth/register
```json
Request: { "email": "...", "password": "...", "name": "..." }
Response: { "access_token": "jwt...", "token_type": "bearer" }
```

### POST /auth/login
```json
Request: { "email": "...", "password": "..." }
Response: { "access_token": "jwt...", "token_type": "bearer" }
```

### GET /auth/me (Authorization: Bearer {token})
```json
Response: { "id": 1, "email": "...", "name": "...", "subscription_status": "free|active", "is_admin": false, "created_at": "..." }
```

## 경기 (Games)

### GET /games?league=MLB&game_date=2026-04-09&min_confidence=70&page=1&per_page=25
```json
Response: {
  "games": [{
    "id": 1, "league": "MLB", "home_team": "...", "away_team": "...",
    "game_date": "2026-04-09", "game_time": "19:05", "status": "scheduled",
    "home_score": null, "away_score": null,
    "home_odds": 1.85, "away_odds": 2.10,
    "home_pitcher": "...", "away_pitcher": "...",
    "prediction": {
      "home_win_probability": 62.5, "away_win_probability": 37.5,
      "recommended_pick": "home", "confidence_score": 25
    }
  }],
  "total": 100, "page": 1, "per_page": 25
}
```
- 무료 유저: 3개 이후 예측값 0/locked 처리

### GET /games/:id
```json
Response: {
  "game": { ...game fields + prediction fields },
  "home_team_stats": { "team_name": "...", "elo_rating": 1560, "wins": 40, ... },
  "away_team_stats": { ... },
  "home_pitcher_stats": { "name": "...", "era": 2.85, "whip": 1.02, ... },
  "away_pitcher_stats": { ... },
  "is_premium": false
}
```

## 대시보드 (Dashboard)

### GET /dashboard/summary
```json
Response: {
  "today_games": 14,
  "total_predictions": 232,
  "total_finished": 67,
  "overall_accuracy": 67.2,
  "correct_predictions": 45,
  "high_confidence_accuracy": 72.5,
  "high_confidence_total": 20,
  "league_today": { "MLB": 6, "KBO": 5, "NPB": 3 },
  "league_accuracy": {
    "MLB": { "correct": 33, "total": 43, "accuracy": 76.7 },
    "NPB": { "correct": 5, "total": 9, "accuracy": 55.6 },
    "KBO": { "correct": 7, "total": 15, "accuracy": 46.7 }
  }
}
```

### GET /dashboard/today?league=KBO
```json
Response: [{
  "id": 1, "league": "KBO", "home_team": "...", "away_team": "...",
  "game_time": "18:30", "status": "scheduled",
  "home_score": null, "away_score": null,
  "home_odds": 1.85, "away_odds": 2.10,
  "home_pitcher": "...", "away_pitcher": "...",
  "prediction": { "home_win_probability": 62.5, "away_win_probability": 37.5, "recommended_pick": "home", "confidence_score": 25 }
}]
```

### GET /dashboard/top-picks
오늘+내일 신뢰도 60%+ 경기 (최대 10개, 신뢰도 내림차순)

### GET /dashboard/recent-results?limit=20
```json
Response: [{
  "id": 1, "league": "MLB", "home_team": "...", "away_team": "...",
  "game_date": "2026-04-08", "home_score": 5, "away_score": 3,
  "predicted_pick": "home", "confidence_score": 30,
  "actual_winner": "home", "is_correct": true
}]
```

### GET /dashboard/league-standings?league=KBO
```json
Response: [{
  "team_name": "Samsung Lions", "league": "KBO", "rank": 1,
  "wins": 42, "losses": 24, "games_played": 66,
  "win_rate": 0.636, "elo_rating": 1555,
  "avg_runs_scored": 5.2, "avg_runs_allowed": 3.8,
  "run_differential": 1.4, "streak": 3
}]
```

## 통계 (Stats)

### GET /stats/teams?league=MLB
팀 통계 목록 (ELO 내림차순)

### GET /stats/pitchers?league=MLB&team=NYY
투수 목록 (ERA 오름차순)

## 구독 (Subscription)

### GET /subscription/status
### POST /subscription/create-checkout (데모: 바로 active 처리)
### POST /subscription/cancel

## 관리자 (Admin)

### GET /admin/dashboard
### GET /admin/users
### POST /admin/refresh-mlb (MLB 데이터 수동 갱신)
