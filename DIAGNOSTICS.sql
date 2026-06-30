-- ============================================================
-- V-Tuune: Diagnostic queries (read-only, safe to run anytime)
-- Run each section in Supabase SQL Editor to investigate issues.
-- ============================================================

-- ============================================================
-- 1. Table existence across schemas
--    Expected: every table in prod should also exist in dev
-- ============================================================
SELECT
  tablename,
  MAX(CASE WHEN schemaname = 'public' THEN '✓' ELSE '✗' END) AS in_public,
  MAX(CASE WHEN schemaname = 'dev'    THEN '✓' ELSE '✗' END) AS in_dev,
  MAX(CASE WHEN schemaname = 'prod'   THEN '✓' ELSE '✗' END) AS in_prod
FROM pg_tables
WHERE schemaname IN ('public', 'dev', 'prod')
GROUP BY tablename
ORDER BY tablename;

-- ============================================================
-- 2. Column differences across schemas for key tables
--    Look for missing columns (avatar_url, banner_url, visibility, etc.)
-- ============================================================
SELECT
  table_name,
  column_name,
  MAX(CASE WHEN table_schema = 'public' THEN data_type END) AS public_type,
  MAX(CASE WHEN table_schema = 'dev'    THEN data_type END) AS dev_type,
  MAX(CASE WHEN table_schema = 'prod'   THEN data_type END) AS prod_type
FROM information_schema.columns
WHERE table_schema IN ('public', 'dev', 'prod')
  AND table_name IN ('users', 'posts', 'likes', 'comments', 'messages',
                     'follows', 'playlists', 'playlist_items',
                     'notifications', 'notification_settings')
GROUP BY table_name, column_name
ORDER BY table_name, column_name;

-- ============================================================
-- 3. RLS enabled/disabled per table
-- ============================================================
SELECT
  schemaname,
  tablename,
  CASE WHEN rowsecurity THEN 'RLS ON' ELSE 'RLS OFF ⚠' END AS rls_status
FROM pg_tables
WHERE schemaname IN ('public', 'dev', 'prod')
ORDER BY tablename, schemaname;

-- ============================================================
-- 4. All RLS policies (check cross-table refs for schema issues)
-- ============================================================
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname IN ('public', 'dev', 'prod')
ORDER BY tablename, schemaname, cmd;

-- ============================================================
-- 5. Triggers per schema (check notification triggers exist)
-- ============================================================
SELECT
  trigger_schema,
  event_object_table,
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE trigger_schema IN ('dev', 'prod')
ORDER BY event_object_table, trigger_schema;

-- ============================================================
-- 6. User data consistency: same user across schemas
--    Rows with differing name / avatar / banner indicate
--    that schema sync failed at some point.
-- ============================================================
SELECT
  COALESCE(d.id, p.id) AS user_id,
  d.name  AS dev_name,
  p.name  AS prod_name,
  CASE WHEN d.name IS DISTINCT FROM p.name THEN '⚠ MISMATCH' ELSE 'OK' END AS name_status,
  d.avatar_url  AS dev_avatar,
  p.avatar_url  AS prod_avatar,
  CASE WHEN d.avatar_url IS DISTINCT FROM p.avatar_url THEN '⚠ MISMATCH' ELSE 'OK' END AS avatar_status
FROM dev.users d
FULL OUTER JOIN prod.users p ON d.id = p.id
ORDER BY name_status DESC, user_id;

-- ============================================================
-- 7. Row counts per schema for critical tables
--    If notifications/comments count is 0 in prod but >0 in dev,
--    the triggers were only applied to dev.
-- ============================================================
SELECT schema_table, row_count FROM (
  SELECT 'dev.notifications'        AS schema_table, COUNT(*) AS row_count FROM dev.notifications
  UNION ALL SELECT 'prod.notifications',   COUNT(*) FROM prod.notifications
  UNION ALL SELECT 'dev.comments',         COUNT(*) FROM dev.comments
  UNION ALL SELECT 'prod.comments',        COUNT(*) FROM prod.comments
  UNION ALL SELECT 'dev.messages',         COUNT(*) FROM dev.messages
  UNION ALL SELECT 'prod.messages',        COUNT(*) FROM prod.messages
  UNION ALL SELECT 'dev.follows',          COUNT(*) FROM dev.follows
  UNION ALL SELECT 'prod.follows',         COUNT(*) FROM prod.follows
  UNION ALL SELECT 'dev.playlists',        COUNT(*) FROM dev.playlists
  UNION ALL SELECT 'prod.playlists',       COUNT(*) FROM prod.playlists
  UNION ALL SELECT 'dev.playlist_items',   COUNT(*) FROM dev.playlist_items
  UNION ALL SELECT 'prod.playlist_items',  COUNT(*) FROM prod.playlist_items
  UNION ALL SELECT 'dev.notification_settings',  COUNT(*) FROM dev.notification_settings
  UNION ALL SELECT 'prod.notification_settings', COUNT(*) FROM prod.notification_settings
) t
ORDER BY schema_table;

-- ============================================================
-- 8. Recent notifications (verify triggers are firing)
--    If this returns 0 rows after you perform a like/comment/follow,
--    the triggers are not running.
-- ============================================================
-- Change 'prod' to 'dev' if app uses dev schema
SELECT
  n.id,
  n.type,
  n.created_at,
  u.name  AS recipient,
  a.name  AS actor,
  n.post_id,
  n.read_at
FROM prod.notifications n
LEFT JOIN prod.users u ON u.id = n.user_id
LEFT JOIN prod.users a ON a.id = n.actor_id
ORDER BY n.created_at DESC
LIMIT 20;

-- ============================================================
-- 9. Check playlist_items RLS policy bodies
--    The with_check column MUST contain 'prod.' or 'dev.' prefix.
--    If it says just 'playlists' without schema, that's the bug.
-- ============================================================
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  with_check
FROM pg_policies
WHERE tablename = 'playlist_items'
ORDER BY schemaname;

-- ============================================================
-- 10. Users missing from prod (exist in dev but not prod)
--     These users will have their names reset on prod login.
-- ============================================================
SELECT d.id, d.name, d.email
FROM dev.users d
LEFT JOIN prod.users p ON d.id = p.id
WHERE p.id IS NULL;

-- ============================================================
-- 11. ★ CRITICAL: Find triggers on auth.users that may
--     overwrite custom display names with Google OAuth data.
--
--     If any trigger here does INSERT ... ON CONFLICT DO UPDATE
--     or UPDATE ... SET name = ..., it is the cause of the
--     display name reverting on reload/login.
--
--     Fix: change ON CONFLICT DO UPDATE to ON CONFLICT DO NOTHING,
--     or remove the name column from the UPDATE clause.
-- ============================================================
SELECT
  n.nspname  AS schema,
  c.relname  AS table,
  t.tgname   AS trigger_name,
  CASE t.tgenabled
    WHEN 'O' THEN 'ENABLED'
    WHEN 'D' THEN 'DISABLED'
    ELSE t.tgenabled::text
  END AS status,
  pg_get_triggerdef(t.oid, true) AS definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relname = 'users'
  AND NOT t.tgisinternal
ORDER BY n.nspname, t.tgname;

-- ============================================================
-- 12. Find all functions called by the triggers above.
--     Look for UPSERT / ON CONFLICT DO UPDATE / UPDATE SET name
--     in the function body — that is the culprit.
-- ============================================================
SELECT
  n.nspname AS schema,
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS function_body
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE pg_get_functiondef(p.oid) ILIKE '%users%'
  AND pg_get_functiondef(p.oid) ILIKE '%name%'
  AND n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY n.nspname, p.proname;
