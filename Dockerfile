FROM node:20-alpine

# better-sqlite3 빌드에 필요한 도구
RUN apk add --no-cache python3 make g++

WORKDIR /app

# 프론트엔드 빌드
COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN cd frontend && npm ci --production=false

COPY frontend/ ./frontend/
RUN cd frontend && npm run build && rm -rf node_modules

# 서버 설치
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --production

COPY server/ ./server/

# 빌드 도구 정리
RUN apk del python3 make g++

EXPOSE 8000

WORKDIR /app/server
CMD ["node", "server.js"]
