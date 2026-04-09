FROM node:20-alpine

WORKDIR /app

# better-sqlite3 빌드에 필요
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json* ./
RUN npm ci --only=production

COPY . .

# 데이터베이스 파일은 volume으로 관리
RUN mkdir -p /data
ENV DB_PATH=/data/ballpredict.db

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:8000/api/health || exit 1

CMD ["node", "server.js"]
