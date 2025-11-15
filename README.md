# 今の気分ソングシェア — PJ仕様書

構成：Next.js + Vercel + Cloudflare + Supabase + YouTube Data API +（開発用）Docker/Dev Container  
開発期間：11月 〜 12月 ※場合によっては1月, 2月まで延長  
ターゲット：若い世代向け（日本）  
概要：YouTube動画を「今の気分」でシェアできるSNS

---

# 1. （インフラ担当への共有用）環境準備

※ **開発を行っていただく際は、基本、`git clone` → `.env.local`を設定 → `docker compose up --build`を行うのみでOK**

## 1.1 Next.js プロジェクト作成

```bash
npx create-next-app mood-song-share
cd mood-song-share
npm install
```

---

## 1.2 Tailwind CSS 設定

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

`tailwind.config.js` に以下を追加：

```js
/** @type {import('tailwindcss').Config} */
const config = {
    content: [
      "./src/**/*.{js,ts,jsx,tsx}",
      "./app/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {},
    },
    plugins: [],
  };
  
  export default config;
```

`globals.css` に Tailwind 基本設定を追加。  
（`@import "tailwindcss";`を一行目に記載。）

---

## 1.3 Supabase プロジェクト作成

- Supabase にサインアップ  
- 新規プロジェクト作成  
- データベース URL と API キーをメモ

例：  
- Project URL：`https://xxxxx.supabase.co`  
- anon public key：`xxxxx`  
- service_role key：`xxxxx`

---

## 1.4 YouTube Data API キー取得

- Google Cloud Console  
- 「YouTube Data API」を有効化  
- APIキーを取得

---

## 1.5 GitHub リポジトリ作成

```bash
git init
git remote add origin <URL>
git add .
git commit -m "Initial commit"
git push -u origin main
```

---

## 1.6 Vercel デプロイ準備

- Vercel アカウント作成  
- GitHub 連携してデプロイ  
- 環境変数設定  
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `YOUTUBE_API_KEY`

**Vercel の本番デプロイは誰のローカル環境にも依存しない（クラウドでビルド）**

---

## 1.7 （複数人開発向け）：Docker / Dev Container 導入

目的：**全員のローカル環境を統一するため**

※ **以下、一旦田中の想定で書いているので、試した後に上手くいった内容で更新する可能性ありです。**

### Dockerfile

```Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

CMD ["npm", "run", "dev"]
```
※ Node 22はLTSだが、Next.jsではまだ不安定であるため、今回はNode 20を採用。

### docker-compose.yml

```yaml
version: "3.9"
services:
  web:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    env_file:
      - .env.local
```

### Dev Container（VSCode 拡張機能）

`.devcontainer/devcontainer.json`

```json
{
  "name": "mood-song-share",
  "dockerComposeFile": "../docker-compose.yml",
  "service": "web",
  "workspaceFolder": "/app",
  "settings": {
    "editor.formatOnSave": true
  },
  "extensions": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode"
  ]
}
```

---

# 2. DB 設計（Supabase）

## 2.1 users テーブル

| カラム名    | 型        | 備考            |
|------------|----------|----------------|
| id         | uuid     | primary key     |
| name       | text     | ユーザー名       |
| email      | text     | optional        |
| created_at | timestamp | default now() |

---

## 2.2 posts テーブル

| カラム名     | 型        | 備考                  |
|-------------|----------|----------------------|
| id          | uuid     | primary key           |
| user_id     | uuid     | FK → users.id         |
| mood        | text     | 今日の気分            |
| video_id    | text     | YouTube動画ID         |
| video_title | text     | タイトル              |
| video_url   | text     | フルURL               |
| created_at  | timestamp | default now()        |

---

## 2.3 likes テーブル

| カラム名    | 型        | 備考                  |
|------------|----------|----------------------|
| id         | uuid     | primary key           |
| post_id    | uuid     | FK → posts.id         |
| user_id    | uuid     | FK → users.id         |
| created_at | timestamp | default now()        |

---

# 3. ページ構成 / ルーティング

- `/` → トップページ（投稿一覧）  
- `/login` → ログイン（Supabase Auth）  
- `/search` → YouTube検索ページ  
- `/post` → 投稿作成ページ  
- `/profile/[id]` → プロフィールページ  

---

# 4. （全員向け）やることメモ

## 4.1 YouTube動画検索

- `/search` 作成  
- 検索フォーム  
- YouTube Data API で動画取得  
- カード表示  

---

## 4.2 投稿作成

- `/post` 作成  
- 気分選択（セレクトボックス）  
- 選択動画を Supabase に保存  

---

## 4.3 投稿一覧表示

- `/` で posts を取得  
- YouTube の embed  
- 投稿者・気分を表示  

---

## 4.4 いいね機能（任意）

- likes に insert/delete  
- いいね数カウント  

---

## 4.5 認証（Supabase Auth）

- Google OAuth  
- users テーブルに保存  
- ログイン必須ページは redirect  

---

# 5. デザイン / UI

- Tailwind CSS  
- shadcn/ui（カード・ボタン・フォーム）  
- レスポンシブ対応  
- 気分に応じてテーマ変更（例：晴れ→黄色）

---

# 6. デプロイ手順

1. GitHub に push  
2. Vercel が自動デプロイ  
3. 環境変数設定  
4. Cloudflare で独自ドメイン  

---

# 7. テスト & 公開

- 投稿作成・一覧・検索・embed 動作  
- スマホ/PC レスポンシブ確認  
- OGP画像設定  
- Pチームの他メンバーや友人に共有してフィードバック取得  