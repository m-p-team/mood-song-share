# 今の気分ソングシェア — PJ 仕様書

構成：Next.js + Vercel + Cloudflare + Supabase + YouTube Data API +（開発用）Docker/Dev Container  
開発期間：11 月 〜 12 月 ※場合によっては 1 月, 2 月まで延長  
ターゲット：若い世代向け（日本）  
概要：YouTube 動画を「今の気分」でシェアできる SNS

---

# 1. （インフラ担当への共有用）環境準備

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
  content: ["./src/**/*.{js,ts,jsx,tsx}", "./app/**/*.{js,ts,jsx,tsx}"],
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
- API キーを取得

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

### Dockerfile

```Dockerfile
FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000
```

※ Node 22 は LTS だが、Next.js ではまだ不安定であるため、今回は Node 20 を採用。

### docker-compose.yml

```yaml
version: "3.9"
services:
  web:
    build: .
    ports:
      - "5173:3000"
    volumes:
      - ./:/app:cached
    env_file:
      - ./.env.local
```

### Dev Container（VSCode 拡張機能）

`.devcontainer/devcontainer.json`

```json
{
  "name": "mood-song-share",
  "dockerComposeFile": ["../docker-compose.yml"],
  "service": "web",
  "workspaceFolder": "/app",
  "remoteUser": "root",
  "overrideCommand": true,
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "ms-azuretools.vscode-docker",
        "bradlc.vscode-tailwindcss",
        "eamodio.gitlens"
      ],
      "settings": {
        "editor.formatOnSave": true,
        "editor.defaultFormatter": "esbenp.prettier-vscode",

        "eslint.format.enable": true,
        "eslint.lintTask.enable": true,

        "tailwindCSS.emmetCompletions": true
      }
    }
  }
}
```

---

# 2. DB 設計（Supabase）

## 2.1 users テーブル

| カラム名   | 型        | 備考          |
| ---------- | --------- | ------------- |
| id         | uuid      | primary key   |
| name       | text      | ユーザー名    |
| email      | text      | optional      |
| created_at | timestamp | default now() |

---

## 2.2 posts テーブル

| カラム名    | 型        | 備考            |
| ----------- | --------- | --------------- |
| id          | uuid      | primary key     |
| user_id     | uuid      | FK → users.id   |
| mood        | text      | 今日の気分      |
| video_id    | text      | YouTube 動画 ID |
| video_title | text      | タイトル        |
| video_url   | text      | フル URL        |
| created_at  | timestamp | default now()   |

---

## 2.3 likes テーブル

| カラム名   | 型        | 備考          |
| ---------- | --------- | ------------- |
| id         | uuid      | primary key   |
| post_id    | uuid      | FK → posts.id |
| user_id    | uuid      | FK → users.id |
| created_at | timestamp | default now() |

---

# 3. ページ構成 / ルーティング

- `/` → トップページ（投稿一覧）
- `/login` → ログイン（Supabase Auth）
- `/search` → YouTube 検索ページ
- `/post` → 投稿作成ページ
- `/profile/[id]` → プロフィールページ

---

# 4. 開発メンバー向け：セットアップ手順

**VSCode Dev Container（Docker）** を用いて、  
全員が同一の開発環境で作業できるようにしています。

---

## 4.1 事前にインストールするもの

開発メンバー全員が、以下の 3 つをインストールしてください：

### 必須インストール

- **Docker Desktop**  
  https://www.docker.com/

- **Visual Studio Code（VSCode）**  
  https://code.visualstudio.com/

- **Dev Containers 拡張（VSCode）**  
  VSCode → Extensions →「Dev Containers」で検索 → 特定のバージョンをインストール → v0.409.0 を選択してインストール

---

## 4.2 コマンド貼り付け＆実行

① 以下のコードを貼り付けて順番に実行してください。  
※ `.env.local` は git 管理外のため、各自が必ず作成してください。  
※ `.env.local` の内容は田中から共有します。

```bash
git clone https://github.com/git-private-tanaka/mood-song-share.git
cd mood-song-share
copy .example.env.local .env.local
```

② 「 command (Mac) / control (Windows)」 + Shift + P を押す → 「reopen in container」を入力 → Enter

③ ターミナルに `root@xxxxxxxxxxxx:/app#`と表示されるまで待つ。（※ 初回は少し時間がかかることがあります。）

④ 以下を実行

```bash
npm install
npm run dev
```

⑤ `http://0.0.0.0:5173/` に正常にアクセスできたらセットアップ完了です！

---

# 5. （全員向け）最低限これだけは作りたい機能メモ

## 5.1 YouTube 動画検索

- `/search` 作成
- 検索フォーム
- YouTube Data API で動画取得
- カード表示

---

## 5.2 投稿作成

- `/post` 作成
- 気分選択（セレクトボックス）
- 選択動画を Supabase に保存

---

## 5.3 投稿一覧表示

- `/` で posts を取得
- YouTube の embed
- 投稿者・気分を表示

---

## 5.4 いいね機能

- likes に insert/delete
- いいね数カウント

---

## 5.5 認証（Supabase Auth）

- Google OAuth
- users テーブルに保存
- ログイン必須ページは redirect

---

# 6. デザイン / UI

- Tailwind CSS
- shadcn/ui（カード・ボタン・フォーム）
- レスポンシブ対応
- 気分に応じてテーマ変更（例：晴れ → 黄色）

---

# 7. デプロイ手順

1. GitHub に push
2. Vercel が自動デプロイ
3. 環境変数設定
4. Cloudflare で独自ドメイン

---

# 8. テスト & 公開

- 投稿作成・一覧・検索・embed 動作
- スマホ/PC レスポンシブ確認
- OGP 画像設定
- P チームの他メンバーや友人に共有してフィードバック取得
