# 작업 변경 이력

## 2026-04-09 - 세션 1: 초기 세팅 + 대시보드

### 완료된 작업

#### 1. SQLite 로컬 실행 환경 구성
- backend/app/config.py: DB URL을 SQLite로 변경
- backend/app/database.py: SQLite용 엔진 설정 분기
- backend/requirements.txt: aiosqlite 추가

#### 2. 실제 데이터 시딩 (seed_data.py 재작성)
- MLB/NPB/KBO 2025 시즌 기준 팀 데이터 하드코딩
- 실제 투수 스탯 (ERA, WHIP, 승, 패, 이닝, 탈삼진, 최근폼)
- 과거 7일 + 미래 7일 경기 생성
- 예측 엔진으로 모든 경기 예측 생성

#### 3. 대시보드 백엔드 API (server.js에 추가)
- `GET /api/dashboard/summary` - 전체 통계 (적중률, 리그별 적중률, 오늘 경기수)
- `GET /api/dashboard/today` - 오늘의 경기 + 예측
- `GET /api/dashboard/top-picks` - 신뢰도 60%+ 추천 경기
- `GET /api/dashboard/recent-results` - 최근 결과 (HIT/MISS)
- `GET /api/dashboard/league-standings` - 리그 순위표

#### 4. 대시보드 프론트엔드 (Dashboard.jsx 신규)
- 요약 카드 (오늘 경기, 적중률, 강력추천 적중률, 총 예측)
- 리그별 적중률 바 차트
- TOP 추천 경기 리스트
- 최근 예측 결과 (HIT/MISS 배지)
- 오늘의 경기 테이블
- 리그 순위표 (KBO/MLB/NPB 탭 전환)

#### 5. 네비게이션 업데이트
- `/` -> Dashboard (메인)
- `/games` -> 경기 예측 (기존 Home)
- Navbar에 대시보드/경기예측 링크 추가

#### 6. MLB 실제 데이터 연동 (이미 server.js에 구현되어 있었음)
- statsapi.mlb.com에서 실시간 순위, 일정, 투수 스탯 수집
- 30팀 순위, 144경기, 145명 투수 스탯

### 수정된 파일 목록
```
server/server.js          - 대시보드 API 5개 추가
frontend/src/App.jsx      - Dashboard 라우트 추가, Home을 /games로 이동
frontend/src/pages/Dashboard.jsx  - 신규 생성
frontend/src/components/Navbar.jsx - 대시보드/경기예측 메뉴 추가
frontend/src/services/api.js      - 대시보드 API 함수 5개 추가
frontend/src/pages/UserDashboard.jsx - 바로가기 링크 수정
backend/app/config.py     - SQLite URL
backend/app/database.py   - SQLite 엔진 설정
backend/app/main.py       - dashboard 라우터 등록
backend/app/routers/dashboard.py  - 신규 (Python용, 미사용)
backend/seed_data.py      - 실제 데이터로 재작성
backend/requirements.txt  - aiosqlite 추가
```

---

## 2026-04-09 - 세션 2: 스크래핑 + UI 개선 (진행중)

### 진행중인 작업

#### 1. KBO/NPB 웹 스크래핑 실제 데이터 수집
- cheerio 설치 완료
- 데이터 소스 조사 완료:
  - KBO 순위: koreabaseball.com/Record/TeamRank/TeamRankDaily.aspx (table.tData)
  - KBO 경기: mykbostats.com (a.game-line)
  - NPB 순위: npb.jp/bis/2026/stats/ (table.ranking_table)
  - NPB 경기: npb.jp/games/2026/schedule_MM.html

#### 2. 예측 엔진 정확도 개선
- 가중치 조정 예정
- 최근 폼 반영 강화 예정

#### 3. 대시보드 정렬 기능 추가
- 시간순 기본 정렬
- 신뢰도순/리그별/추천순 정렬 옵션

#### 4. 팀 로고/아이콘 추가
- MLB/KBO/NPB 팀별 컬러 배지
