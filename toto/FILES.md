# 주요 파일 상세 설명

## 서버 (server/)

### server.js
- **역할**: 메인 백엔드 API 서버
- **포트**: 8000
- **DB**: better-sqlite3 (ballpredict.db)
- **주요 기능**:
  - DB 테이블 생성 (users, team_stats, pitchers, games, predictions)
  - 한글 팀명 매핑 (TEAM_NAME_KR)
  - 예측 엔진 (sigmoid, normalize, predictGame)
  - MLB API 연동 (fetchMLBSchedule, fetchMLBStandings, fetchMLBPitcherStats)
  - KBO/NPB 샘플 데이터 생성 (seedKBONPB) -> 스크래핑으로 교체 예정
  - 인증 미들웨어 (JWT)
  - API 라우트:
    - POST /api/auth/register, login
    - GET /api/auth/me
    - GET /api/games, /api/games/:id
    - GET /api/stats/teams, /api/stats/pitchers
    - GET /api/subscription/status
    - POST /api/subscription/create-checkout, cancel
    - GET /api/admin/dashboard, /api/admin/users
    - POST /api/admin/refresh-mlb
    - GET /api/dashboard/summary, today, top-picks, recent-results, league-standings
    - GET /api/health

## 프론트엔드 (frontend/src/)

### App.jsx
- React Router 설정
- 라우트: /, /games, /game/:id, /login, /register, /subscription, /dashboard, /admin
- ProtectedRoute 컴포넌트 (로그인/관리자 체크)

### pages/Dashboard.jsx
- 메인 대시보드 (/ 경로)
- API: getDashboardSummary, getDashboardToday, getDashboardTopPicks, getDashboardRecentResults, getLeagueStandings
- 섹션: 요약카드, 리그별 적중률, TOP추천, 최근결과, 오늘의경기, 리그순위

### pages/Home.jsx
- 경기 목록 (/games 경로)
- 리그/날짜/신뢰도 필터
- 페이지네이션
- GameRow 컴포넌트로 테이블 렌더링

### pages/GameDetail.jsx
- 경기 상세 (/game/:id)
- 승부 예측 확률 바
- 팀 통계, 투수 통계

### pages/Login.jsx, Register.jsx
- 로그인/회원가입 폼
- AuthContext로 토큰 관리

### pages/Subscription.jsx
- 구독 플랜 비교
- Stripe 체크아웃 (현재 데모 모드)

### pages/UserDashboard.jsx
- 내 정보 (/dashboard)
- 계정 정보, 구독 상태

### pages/AdminDashboard.jsx
- 관리자 대시보드 (/admin)
- 전체 통계, 회원 목록

### components/Navbar.jsx
- 상단 네비게이션
- 대시보드/경기예측/내정보/관리자/구독 메뉴
- 로그인/로그아웃 버튼

### components/GameRow.jsx
- 경기 테이블 행
- 리그뱃지, 팀명, 배당, 예측, 신뢰도

### components/LeagueBadge.jsx
- MLB(파랑)/NPB(빨강)/KBO(초록) 색상 배지

### components/ConfidenceBadge.jsx
- 신뢰도 배지: 강력(70%+, 초록), 보통(40-70%, 노랑), 위험(40%-, 빨강)

### components/LeagueFilter.jsx
- 리그 선택 버튼 (전체/MLB/NPB/KBO)

### components/ProbabilityBar.jsx
- 홈/원정 확률 시각화 바

### services/api.js
- axios 인스턴스 (baseURL: /api)
- Bearer 토큰 인터셉터
- 401 자동 리다이렉트
- API 함수들 (register, login, getMe, getGames, getGameDetail, ...)

### utils/teamNames.js
- MLB/NPB/KBO 팀 영문명 -> 한글명 매핑
- getKoreanName(), displayTeamName() 함수

### context/AuthContext.jsx
- 인증 상태 관리 (user, token, isPremium)
- login, logout, register 함수

## 설정 파일

### frontend/vite.config.js
- 포트 5173, /api -> localhost:8000 프록시

### frontend/tailwind.config.js
- dark 컬러 팔레트 (dark-50 ~ dark-900)
- accent 컬러 (green, yellow, red, blue, purple)

### frontend/index.css
- TailwindCSS base/components/utilities
- 커스텀 컴포넌트: btn-primary, btn-secondary, card, input-field
