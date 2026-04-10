# 실시간 진행 상황 추적

## 현재 세션: 세션 3 (2026-04-09)
**시작 시간**: 19:10 KST
**상태**: 진행중

---

## [완료] 배포 기준 구조 전환
- [x] 프론트엔드: Vercel 배포 설정 (vercel.json, 환경변수 분리)
- [x] 백엔드: Railway/Docker 배포 설정 (Dockerfile, railway.json, graceful shutdown)
- [x] Worker 분리: worker.js 독립 실행 가능 (--loop, --league)
- [x] docker-compose: API + Worker + Frontend 분리 구성
- [x] 환경변수: dotenv + .env.example 구조화
- [x] CORS: 프로덕션 origin 제한
- [x] Health check: uptime 포함
- [x] 배포 문서: toto/DEPLOY.md 작성

## 세션 2 잔여 작업 (이어서 진행)

### [완료] 1. KBO/NPB 웹 스크래핑
- server.js에 syncKBOData(), syncNPBData() 구현 완료
- KBO: koreabaseball.com 순위 + mykbostats.com 경기
- NPB: npb.jp 순위 + 경기 일정
- MLB: statsapi.mlb.com (기존)

### [완료] 2. 예측 엔진 정확도 개선
- [x] 가중치 조정: 홈어드밴티지 8%→14%, 최근성적 12%→14%, ELO 18%→15%
- [x] 최근 폼 반영 강화: 연승/연패 모멘텀 반영, KBO/NPB streak 기반 win_rate_last5 보정
- [x] 홈어드밴티지 반영: 홈성적/원정약점 계수 강화, 범위 확대 (0.30~0.70)
- [x] 투수 ERA 기반 폼 보정, ERA/WHIP 가중치 상향
- [x] NPB 홈/원정 성적 근사 개선

### [완료] 3. 대시보드 정렬 기능
- [x] 시간순 기본 정렬
- [x] 신뢰도순/리그별/추천순 정렬 옵션 (추천순 버튼 추가)

### [완료] 4. 팀 로고/아이콘
- [x] MLB/KBO/NPB 팀별 컬러 배지 (TeamBadge 컴포넌트)
- [x] GameRow에 TeamBadge 통합 적용
- [x] 팀 로고: 팀 공식 컬러 원형 이니셜 로고 (TeamLogo 컴포넌트)
- [x] 팀명 표기: 한글 앞 + 영문 줄임 뒤 (예: 삼성 SS, LA 다저스 LAD, 요미우리 G)
- [x] GameDetail 페이지에도 로고+한글명 적용

### [완료] 5. 실시간 경기 (LIVE) 섹션 + 전광판
- [x] 서버: /api/dashboard/live 엔드포인트 (live_data JSON 포함)
- [x] 서버: MLB 라이브 스코어 2분마다 자동 동기화 (BSO, 주자, 이닝별 점수)
- [x] 서버: games 테이블에 current_inning, inning_half, outs, live_data 컬럼
- [x] 프론트: LiveGames 컴포넌트 (30초 자동갱신, 카드에 이닝/아웃 표시)
- [x] 프론트: Scoreboard 전광판 (이닝별 점수, R/H/E, 다이아몬드, BSO)
- [x] 프론트: 라이브 카드 클릭 시 전광판 확대 표시

### [완료] 6. 브랜딩 + 공식 로고 + 모바일 UI
- [x] 앱 이름: BallPredict → 스포츠스포AI
- [x] 로고: SVG 로고 (야구 스티칭 + AI), favicon 교체
- [x] 팀 로고: MLB(mlbstatic.com), KBO(KBO CDN), NPB(npb.jp) 공식 로고
- [x] 팀명 표기: 한글 앞 + 영문 줄임 뒤 (삼성 SS, LA 다저스 LAD 등)
- [x] 모바일 UI: 전체 반응형 재설계 (padding, font-size, grid, truncate)
- [x] Navbar: 모바일 메뉴 개선, 로고 축소
- [x] GameRow: 모바일에서 짧은 팀명 표시
- [x] GameDetail: 모바일 최적화
- [x] Dashboard: 요약카드/리그적중률/정렬버튼 모바일 대응

---

## 서버 정보
- 로컬 API: http://localhost:8000
- 로컬 Frontend: http://localhost:5173
- 프로덕션 API: (Railway 배포 후 설정)
- 프로덕션 Frontend: (Vercel 배포 후 설정)
- 테스트 계정: admin@ballpredict.com / admin123

## 마지막 업데이트
2026-04-10 - 전체 QA 완료 + 33개 요청사항 코드 검증 통과 + Render 라이브 배포

## 최신 커밋 히스토리
- 6cb0c68 캐시 방지: HTML no-cache 헤더 + 메타태그
- 6f704fc ESPN배당추가+DB스키마수정+모바일overflow수정
- c1a1fb7 모바일 좌우스크롤방지 + fetchJSON User-Agent
- 974fe59 서버 크래시 방지: 전역에러핸들러+fetch타임아웃15초
- 6362e91 포트 먼저 열기 (Render 타임아웃 해결)
- c3e2691 SofaScore API 연동
- 50b6ce4 배트맨 자동수집+발매중게임API
- c514d1b 실시간 업데이트 30초/10초
- 3aa45f9 홈페이지 완전 재설계: 프리미엄 베팅보드
- 4ad528e 실시간+예정경기에 AI예측정보 표시
- afdbd77 실시간 채팅+문자중계 통합
- a3f72e6 배당계산기(플로팅+저장)+배트맨API연동
- 8dfcb95 MLB 팀명 한국식 표기
