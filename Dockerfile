FROM node:20-alpine

# better-sqlite3 빌드에 필요한 도구
RUN apk add --no-cache python3 make g++

WORKDIR /app

# 프론트엔드 빌드
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# 서버 설치
COPY server/package*.json ./server/
RUN cd server && npm install

COPY server/ ./server/

# 포트
EXPOSE 8000

WORKDIR /app/server
CMD ["node", "server.js"]
