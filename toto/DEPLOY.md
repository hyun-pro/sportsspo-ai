# BallPredict 배포 아키텍처

## 전체 구조

```
┌─────────────────┐     HTTPS     ┌──────────────────────┐
│   사용자 브라우저  │ ──────────▶ │  프론트엔드 (Vercel)    │
│                 │              │  React + Vite 빌드     │
└─────────────────┘              │  정적 파일 CDN 서빙      │
                                 └──────────┬─────────────┘
                                            │ API 호출
                                            ▼
                                 ┌──────────────────────┐
                                 │  백엔드 API (Railway)   │
                                 │  Express.js + SQLite   │
                                 │  Port 8000             │
                                 └──────────┬─────────────┘
                                            │ 같은 DB
                                            ▼
                                 ┌──────────────────────┐
                                 │  Data Worker (Railway) │
                                 │  30분 주기 스크래핑      │
                                 │  MLB API + KBO + NPB  │
                                 └────────────────────────┘
```

---

## 1. 프론트엔드 배포 (Vercel)

### 왜 Vercel?
- React/Vite 프로젝트 무료 배포
- 자동 HTTPS, CDN, 글로벌 엣지
- Git push → 자동 빌드 & 배포

### 설정 방법
1. [vercel.com](https://vercel.com) 가입 → GitHub 연결
2. 프로젝트 Import → **Root Directory**: `frontend`
3. 환경변수 설정:
   - `VITE_API_URL` = `https://your-backend.railway.app/api`
4. 배포 완료 → `https://ballpredict.vercel.app`

### 파일 구조
```
frontend/
├── vercel.json          # Vercel 배포 설정 (SPA rewrite, 캐시)
├── .env.development     # 로컬 개발용 (/api → Vite proxy)
├── .env.production      # 프로덕션 빌드용 (백엔드 URL)
└── .env.example         # 환경변수 템플릿
```

### 수정 반영 흐름
```
코드 수정 → git push → Vercel 자동 빌드 → 배포 완료 (약 1분)
```

---

## 2. 백엔드 배포 (Railway)

### 왜 Railway?
- Docker 기반 배포 지원
- 무료 플랜에서 SQLite 사용 가능 (Persistent Volume)
- Health check + 자동 재시작
- Git push 자동 배포

### 설정 방법
1. [railway.app](https://railway.app) 가입 → GitHub 연결
2. New Project → `server/` 디렉토리 선택
3. 환경변수 설정:
   ```
   PORT=8000
   NODE_ENV=production
   JWT_SECRET=<강력한-비밀키-생성>
   CORS_ORIGINS=https://ballpredict.vercel.app
   SYNC_INTERVAL_MS=1800000
   ```
4. Persistent Volume 연결: `/data` 경로
5. 배포 → `https://ballpredict-api.railway.app`

### 대안: Render
- [render.com](https://render.com) → Web Service → Docker 배포
- Persistent Disk 지원 (유료)
- 무료 플랜: 15분 비활성 시 sleep → 유료 권장

### 파일 구조
```
server/
├── Dockerfile           # API 서버 컨테이너
├── Dockerfile.worker    # Worker 전용 컨테이너
├── railway.json         # Railway 배포 설정
├── .env                 # 로컬 개발용 (git 미포함)
├── .env.example         # 환경변수 템플릿
├── server.js            # API 서버 (Express)
└── worker.js            # 데이터 동기화 워커
```

---

## 3. 실시간 데이터 처리

### 데이터 동기화 주기
| 데이터 | 소스 | 주기 | 방식 |
|--------|------|------|------|
| MLB 경기/순위 | statsapi.mlb.com | 30분 | REST API |
| KBO 순위 | koreabaseball.com | 30분 | 웹 스크래핑 |
| KBO 경기 | mykbostats.com | 30분 | 웹 스크래핑 |
| NPB 순위/경기 | npb.jp | 30분 | 웹 스크래핑 |
| 예측 재계산 | 내부 엔진 | 동기화 후 즉시 | 알고리즘 |

### 동기화 흐름
```
setInterval (30분)
  ├─ syncKBOData()   → KBO 순위 + 경기 → 예측 생성
  ├─ syncNPBData()   → NPB 순위 + 경기 → 예측 생성
  └─ syncMLBData()   → MLB 순위 + 경기 + 투수 → 예측 생성
```

---

## 4. Worker 분리 구조

### 옵션 A: 단일 프로세스 (현재 기본)
- `server.js` 내부 `setInterval`로 동기화
- 작은 규모에서 충분함
- 서버 재시작 시 데이터도 자동 재동기화

### 옵션 B: 별도 Worker 프로세스 (권장)
- `worker.js --loop` 별도 실행
- API 서버 부하와 분리
- 스크래핑 실패가 API에 영향 없음

```bash
# Docker로 분리 실행
docker compose up -d api worker

# 수동 1회 실행
node worker.js
node worker.js --league mlb   # 특정 리그만
```

---

## 5. 환경변수 구조

### 프론트엔드
| 변수 | 개발 | 프로덕션 | 설명 |
|------|------|----------|------|
| `VITE_API_URL` | `/api` | `https://api.도메인/api` | 백엔드 API URL |

### 백엔드
| 변수 | 필수 | 기본값 | 설명 |
|------|------|--------|------|
| `PORT` | N | 8000 | 서버 포트 |
| `NODE_ENV` | N | development | 환경 (development/production) |
| `JWT_SECRET` | Y | (dev용 기본값) | JWT 서명 키 |
| `CORS_ORIGINS` | N | localhost | 허용 오리진 (콤마 구분) |
| `SYNC_INTERVAL_MS` | N | 1800000 | 동기화 주기 (ms) |
| `DB_PATH` | N | ./ballpredict.db | DB 파일 경로 |
| `STRIPE_SECRET_KEY` | N | - | Stripe 결제 |
| `STRIPE_WEBHOOK_SECRET` | N | - | Stripe 웹훅 |

---

## 6. 장애 방지 & 안정성

### 서버 자동 재시작
- Docker: `restart: unless-stopped`
- Railway: `restartPolicyType: ON_FAILURE` (최대 5회 재시도)

### Graceful Shutdown
- SIGTERM/SIGINT 수신 → 진행 중인 요청 완료 → DB 정상 종료
- 10초 타임아웃 후 강제 종료

### Health Check
- 엔드포인트: `GET /api/health`
- 응답: `{ status, version, env, uptime }`
- Docker/Railway에서 30초 간격 체크 → 실패 시 자동 재시작

### 데이터 보호
- SQLite WAL 모드 (읽기/쓰기 동시 가능)
- Docker Volume으로 DB 파일 영속화
- 스크래핑 실패 시 기존 데이터 유지 (try-catch)

### 모니터링
```bash
# 서버 상태 확인
curl https://your-api.railway.app/api/health

# 로그 확인
railway logs
docker compose logs -f api worker
```

---

## 빠른 시작 가이드

### 로컬 개발
```bash
# 백엔드
cd server && npm install && npm run dev

# 프론트엔드 (별도 터미널)
cd frontend && npm install && npm run dev
```

### Docker 로컬 실행
```bash
docker compose up -d
# 프론트: http://localhost:3000
# API:   http://localhost:8000
```

### 프로덕션 배포
```bash
# 1. GitHub에 push
git add . && git commit -m "deploy" && git push

# 2. Vercel: frontend/ 자동 빌드 (환경변수 설정 필요)
# 3. Railway: server/ 자동 빌드 (환경변수 설정 필요)
```
