-- 初期ユーザーデータの投入
INSERT INTO roles (name) VALUES
    ('admin'),
    ('user');

INSERT INTO users (id, name, email, created_at) VALUES
    (gen_random_uuid(), 'Alice', 'alice@example.com', NOW()),
    (gen_random_uuid(), 'Bob', 'bob@example.com', NOW()),
    (gen_random_uuid(), 'Charlie', NULL, NOW());
