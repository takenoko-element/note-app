# 1. Node.jsの公式イメージをベースにする
FROM node:22-alpine

# 2. コンテナ内の作業ディレクトリを設定する
WORKDIR /app

# 3. 依存関係の定義ファイルだけを先にコピーする
COPY package*.json ./

# 4. 依存関係をインストールする
RUN npm install

# 5. 開発サーバーを起動するコマンドをデフォルトで設定
# (このコマンドはdocker-compose.ymlのcommandによって上書きされます)
CMD ["npm", "run", "dev"]