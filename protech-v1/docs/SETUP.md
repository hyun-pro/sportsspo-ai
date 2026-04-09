# PROTECH V1 - 설정 및 실행 가이드

## 개요
PROTECH V1은 주식회사 프로브랜드의 상권분석 SaaS 플랫폼입니다.

## 기술 스택
- **Frontend**: Next.js 14, React 18, Tailwind CSS, Recharts, Zustand
- **Backend**: Express.js, TypeScript, Prisma ORM
- **Database**: PostgreSQL
- **Auth**: JWT (Access + Refresh Token)

---

## 사전 요구사항
- Node.js 18+
- PostgreSQL 14+
- npm 또는 yarn

---

## 1. 데이터베이스 설정

```bash
# PostgreSQL에서 데이터베이스 생성
createdb protech_v1
```

## 2. Backend 설정

```bash
cd backend

# 환경변수 파일 생성
cp .env.example .env
# .env 파일에서 DATABASE_URL을 실제 PostgreSQL 접속 정보로 수정

# 의존성 설치
npm install

# Prisma 클라이언트 생성 및 DB 마이그레이션
npx prisma generate
npx prisma migrate dev --name init

# 시드 데이터 생성 (관리자 + 데모 계정)
npx ts-node prisma/seed.ts

# 서버 실행 (개발)
npm run dev
```

서버가 http://localhost:4000 에서 실행됩니다.

## 3. Frontend 설정

```bash
cd frontend

# 환경변수 파일 생성
cp .env.example .env.local
# 필요시 API URL 수정

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

프론트엔드가 http://localhost:3000 에서 실행됩니다.

---

## 데모 계정

| 역할 | 이메일 | 비밀번호 |
|------|--------|----------|
| 관리자 | admin@protech.com | admin1234 |
| 데모 사용자 | demo@protech.com | user1234 |

---

## API 엔드포인트

### Auth
- `POST /api/auth/signup` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/refresh` - 토큰 갱신
- `GET /api/auth/me` - 내 정보

### Analysis
- `GET /api/analysis` - 분석 목록
- `GET /api/analysis/:id` - 분석 상세
- `POST /api/analysis` - 새 분석 생성
- `DELETE /api/analysis/:id` - 분석 삭제

### Reports
- `GET /api/reports` - 보고서 목록
- `POST /api/reports` - 보고서 생성
- `DELETE /api/reports/:id` - 보고서 삭제

### Subscription
- `GET /api/subscriptions` - 현재 구독 정보
- `POST /api/subscriptions/upgrade` - 플랜 변경
- `GET /api/subscriptions/plans` - 플랜 목록

### User
- `PUT /api/users/profile` - 프로필 수정
- `GET /api/users/favorites` - 즐겨찾기 목록
- `POST /api/users/favorites` - 즐겨찾기 추가
- `DELETE /api/users/favorites/:id` - 즐겨찾기 삭제

### Admin
- `GET /api/admin/stats` - 대시보드 통계
- `GET /api/admin/users` - 사용자 목록
- `PATCH /api/admin/users/:id/role` - 역할 변경

---

## 프로젝트 구조

```
protech-v1/
├── frontend/           # Next.js 프론트엔드
│   └── src/
│       ├── app/        # 페이지 (App Router)
│       ├── components/ # 재사용 컴포넌트
│       ├── lib/        # API, 상태관리, 유틸
│       └── styles/     # 글로벌 스타일
├── backend/            # Express API 서버
│   ├── src/
│   │   ├── routes/     # API 라우트
│   │   ├── controllers/ # 비즈니스 로직
│   │   ├── middleware/ # 인증, 에러처리
│   │   ├── services/   # 서비스 레이어
│   │   └── config/     # 설정
│   └── prisma/         # DB 스키마, 시드
├── shared/             # 공유 타입
└── docs/               # 문서
```

---

## 프로덕션 배포

### Frontend (Vercel)
```bash
cd frontend
vercel
```

### Backend (AWS / Railway / Render)
```bash
cd backend
npm run build
npm start
```

---

## 확장 계획 (향후)
1. 카카오맵 API 실제 연동
2. 공공데이터포털 API 연동 (소상공인진흥공단 상권정보)
3. Stripe / Toss Payments 결제 연동
4. 이메일 인증 (SendGrid / Nodemailer)
5. PDF 보고서 자동 생성 (Puppeteer)
6. 실시간 알림 (WebSocket)
7. 다중 지역 비교 분석
8. 히트맵 시각화
