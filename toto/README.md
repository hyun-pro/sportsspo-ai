# BallPredict - 작업 기록

## 프로젝트 개요
MLB/NPB/KBO 야구 경기 AI 예측 SaaS 플랫폼

## 기술 스택
- **프론트엔드**: React 18 + Vite + TailwindCSS (port 5173)
- **백엔드**: Node.js + Express + better-sqlite3 (port 8000)
- **DB**: SQLite (server/ballpredict.db)
- **프록시**: Vite dev server -> localhost:8000 (/api)

## 실행 방법
```bash
# 서버 실행
cd server && npm start

# 프론트엔드 실행
cd frontend && npm run dev
```

## 테스트 계정
- Admin: admin@ballpredict.com / admin123
- Demo: demo@ballpredict.com / demo123 (프리미엄)
- Free: free@ballpredict.com / free123 (무료)

## 폴더 구조
```
hyun/
├── server/           # Node.js 백엔드 (메인)
│   ├── server.js     # Express API + 스크래핑 + 예측 엔진
│   └── ballpredict.db
├── frontend/         # React 프론트엔드
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/    # Dashboard, Home, GameDetail, Login, Register, etc.
│   │   ├── components/ # Navbar, GameRow, LeagueBadge, ConfidenceBadge, etc.
│   │   ├── services/api.js
│   │   └── utils/teamNames.js
│   └── vite.config.js
├── backend/          # Python FastAPI (미사용, Docker용)
├── toto/             # 작업 기록
└── docker-compose.yml
```
