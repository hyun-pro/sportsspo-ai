FROM node:20-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

# 서버 먼저 (덜 바뀌니까 캐시 활용)
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --production

COPY server/ ./server/

# 프론트엔드 (자주 바뀌니까 뒤에)
COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN cd frontend && npm ci --production=false

# 캐시 무효화용 - 소스 복사 후 빌드
COPY frontend/ ./frontend/
RUN cd frontend && npm run build && rm -rf node_modules src

RUN apk del python3 make g++

EXPOSE 8000
WORKDIR /app/server
CMD ["node", "server.js"]
