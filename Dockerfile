# ==================================
# Stage 1: Dependencies (依存関係のインストール)
# ==================================
FROM node:22-alpine AS dependencies
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

# ==================================
# Stage 2: Builder (アプリケーションのビルド)
# ==================================
FROM node:22-alpine AS builder
WORKDIR /app

# 前のステージから、インストール済みのnode_modulesをコピーする
COPY --from=dependencies /app/node_modules ./node_modules
# ソースコード全体をコピーする
COPY . .

# Next.jsアプリケーションを本番用にビルドする
RUN npm run build

# ==================================
# Stage 3: Runner (本番実行)
# ==================================
FROM node:22-alpine AS runner
WORKDIR /app

# 本番実行に必要なファイルのみを前のステージからコピーする
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# (セキュリティ向上) 非rootユーザーを作成し、切り替える
RUN addgroup --system --gid 1001 nextjs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# アプリケーションが使用するポートを公開する
EXPOSE 3000

# コンテナ起動時に実行されるコマンド (本番サーバーの起動)
CMD ["npm", "start"]