-- pgcrypto 拡張の有効化（UUID 用）
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- users テーブル作成
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),  -- UUID 自動生成
    name TEXT NOT NULL,                              -- ユーザー名
    email TEXT,                                     -- optional
    created_at TIMESTAMP DEFAULT NOW()             -- 作成日時
);
