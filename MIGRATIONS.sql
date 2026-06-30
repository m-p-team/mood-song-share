-- ============================================================
-- V-Tuune: Full schema migration for dev AND prod
-- Run this entire file once in Supabase SQL Editor (as-is, no search_path needed)
-- All schema references are explicit (dev.xxx / prod.xxx)
-- Safe to re-run: uses IF NOT EXISTS / DROP IF EXISTS / CREATE OR REPLACE
-- ============================================================

-- ============================================================
-- SECTION 1: DEV SCHEMA
-- ============================================================

-- Comments
CREATE TABLE IF NOT EXISTS dev.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES dev.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES dev.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (length(content) > 0 AND length(content) <= 500),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE dev.comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comments_select" ON dev.comments;
DROP POLICY IF EXISTS "comments_insert" ON dev.comments;
DROP POLICY IF EXISTS "comments_delete" ON dev.comments;
CREATE POLICY "comments_select" ON dev.comments FOR SELECT USING (true);
CREATE POLICY "comments_insert" ON dev.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete" ON dev.comments FOR DELETE USING (auth.uid() = user_id);
GRANT SELECT, INSERT, DELETE ON dev.comments TO anon, authenticated;

-- Messages
CREATE TABLE IF NOT EXISTS dev.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES dev.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES dev.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (length(content) > 0 AND length(content) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);
ALTER TABLE dev.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "messages_select" ON dev.messages;
DROP POLICY IF EXISTS "messages_insert" ON dev.messages;
DROP POLICY IF EXISTS "messages_update" ON dev.messages;
CREATE POLICY "messages_select" ON dev.messages FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);
CREATE POLICY "messages_insert" ON dev.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "messages_update" ON dev.messages FOR UPDATE USING (auth.uid() = receiver_id);
GRANT SELECT, INSERT, UPDATE ON dev.messages TO anon, authenticated;

-- Follows
CREATE TABLE IF NOT EXISTS dev.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES dev.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES dev.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);
ALTER TABLE dev.follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "follows_select" ON dev.follows;
DROP POLICY IF EXISTS "follows_insert" ON dev.follows;
DROP POLICY IF EXISTS "follows_delete" ON dev.follows;
CREATE POLICY "follows_select" ON dev.follows FOR SELECT USING (true);
CREATE POLICY "follows_insert" ON dev.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete" ON dev.follows FOR DELETE USING (auth.uid() = follower_id);
GRANT SELECT, INSERT, DELETE ON dev.follows TO anon, authenticated;

-- Playlists
CREATE TABLE IF NOT EXISTS dev.playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES dev.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(name) > 0 AND length(name) <= 100),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE dev.playlists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "playlists_select" ON dev.playlists;
DROP POLICY IF EXISTS "playlists_insert" ON dev.playlists;
DROP POLICY IF EXISTS "playlists_delete" ON dev.playlists;
CREATE POLICY "playlists_select" ON dev.playlists FOR SELECT USING (true);
CREATE POLICY "playlists_insert" ON dev.playlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "playlists_delete" ON dev.playlists FOR DELETE USING (auth.uid() = user_id);
GRANT SELECT, INSERT, DELETE ON dev.playlists TO anon, authenticated;

-- Playlist items
-- NOTE: INSERT/DELETE policies use explicit dev.playlists reference to avoid
-- the default search_path resolving to public.playlists at runtime.
CREATE TABLE IF NOT EXISTS dev.playlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id uuid NOT NULL REFERENCES dev.playlists(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES dev.posts(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(playlist_id, post_id)
);
ALTER TABLE dev.playlist_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "playlist_items_select" ON dev.playlist_items;
DROP POLICY IF EXISTS "playlist_items_insert" ON dev.playlist_items;
DROP POLICY IF EXISTS "playlist_items_delete" ON dev.playlist_items;
CREATE POLICY "playlist_items_select" ON dev.playlist_items FOR SELECT USING (true);
CREATE POLICY "playlist_items_insert" ON dev.playlist_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM dev.playlists WHERE id = playlist_id AND user_id = auth.uid())
);
CREATE POLICY "playlist_items_delete" ON dev.playlist_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM dev.playlists WHERE id = playlist_id AND user_id = auth.uid())
);
GRANT SELECT, INSERT, DELETE ON dev.playlist_items TO anon, authenticated;

-- Notifications
CREATE TABLE IF NOT EXISTS dev.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES dev.users(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES dev.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('like', 'comment', 'dm', 'follow')),
  post_id uuid REFERENCES dev.posts(id) ON DELETE CASCADE,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE dev.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_select" ON dev.notifications;
DROP POLICY IF EXISTS "notifications_update" ON dev.notifications;
CREATE POLICY "notifications_select" ON dev.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update" ON dev.notifications FOR UPDATE USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON dev.notifications TO anon, authenticated;

-- Notification settings
CREATE TABLE IF NOT EXISTS dev.notification_settings (
  user_id uuid PRIMARY KEY REFERENCES dev.users(id) ON DELETE CASCADE,
  likes_enabled boolean NOT NULL DEFAULT true,
  comments_enabled boolean NOT NULL DEFAULT true,
  dms_enabled boolean NOT NULL DEFAULT true,
  follows_enabled boolean NOT NULL DEFAULT true,
  desktop_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE dev.notification_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notification_settings_select" ON dev.notification_settings;
DROP POLICY IF EXISTS "notification_settings_insert" ON dev.notification_settings;
DROP POLICY IF EXISTS "notification_settings_update" ON dev.notification_settings;
CREATE POLICY "notification_settings_select" ON dev.notification_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notification_settings_insert" ON dev.notification_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notification_settings_update" ON dev.notification_settings FOR UPDATE USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE ON dev.notification_settings TO anon, authenticated;

-- posts visibility column (safe add)
ALTER TABLE dev.posts ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public'
  CHECK (visibility IN ('public', 'followers_only', 'private'));

-- users columns (safe add)
ALTER TABLE dev.users ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE dev.users ADD COLUMN IF NOT EXISTS banner_url text;

-- ============================================================
-- SECTION 2: PROD SCHEMA (identical structure, prod-qualified)
-- ============================================================

-- Comments
CREATE TABLE IF NOT EXISTS prod.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES prod.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES prod.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (length(content) > 0 AND length(content) <= 500),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE prod.comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comments_select" ON prod.comments;
DROP POLICY IF EXISTS "comments_insert" ON prod.comments;
DROP POLICY IF EXISTS "comments_delete" ON prod.comments;
CREATE POLICY "comments_select" ON prod.comments FOR SELECT USING (true);
CREATE POLICY "comments_insert" ON prod.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete" ON prod.comments FOR DELETE USING (auth.uid() = user_id);
GRANT SELECT, INSERT, DELETE ON prod.comments TO anon, authenticated;

-- Messages
CREATE TABLE IF NOT EXISTS prod.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES prod.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES prod.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (length(content) > 0 AND length(content) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);
ALTER TABLE prod.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "messages_select" ON prod.messages;
DROP POLICY IF EXISTS "messages_insert" ON prod.messages;
DROP POLICY IF EXISTS "messages_update" ON prod.messages;
CREATE POLICY "messages_select" ON prod.messages FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);
CREATE POLICY "messages_insert" ON prod.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "messages_update" ON prod.messages FOR UPDATE USING (auth.uid() = receiver_id);
GRANT SELECT, INSERT, UPDATE ON prod.messages TO anon, authenticated;

-- Follows
CREATE TABLE IF NOT EXISTS prod.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES prod.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES prod.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);
ALTER TABLE prod.follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "follows_select" ON prod.follows;
DROP POLICY IF EXISTS "follows_insert" ON prod.follows;
DROP POLICY IF EXISTS "follows_delete" ON prod.follows;
CREATE POLICY "follows_select" ON prod.follows FOR SELECT USING (true);
CREATE POLICY "follows_insert" ON prod.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete" ON prod.follows FOR DELETE USING (auth.uid() = follower_id);
GRANT SELECT, INSERT, DELETE ON prod.follows TO anon, authenticated;

-- Playlists
CREATE TABLE IF NOT EXISTS prod.playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES prod.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(name) > 0 AND length(name) <= 100),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE prod.playlists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "playlists_select" ON prod.playlists;
DROP POLICY IF EXISTS "playlists_insert" ON prod.playlists;
DROP POLICY IF EXISTS "playlists_delete" ON prod.playlists;
CREATE POLICY "playlists_select" ON prod.playlists FOR SELECT USING (true);
CREATE POLICY "playlists_insert" ON prod.playlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "playlists_delete" ON prod.playlists FOR DELETE USING (auth.uid() = user_id);
GRANT SELECT, INSERT, DELETE ON prod.playlists TO anon, authenticated;

-- Playlist items (explicit prod.playlists ref to avoid public-schema resolution bug)
CREATE TABLE IF NOT EXISTS prod.playlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id uuid NOT NULL REFERENCES prod.playlists(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES prod.posts(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(playlist_id, post_id)
);
ALTER TABLE prod.playlist_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "playlist_items_select" ON prod.playlist_items;
DROP POLICY IF EXISTS "playlist_items_insert" ON prod.playlist_items;
DROP POLICY IF EXISTS "playlist_items_delete" ON prod.playlist_items;
CREATE POLICY "playlist_items_select" ON prod.playlist_items FOR SELECT USING (true);
CREATE POLICY "playlist_items_insert" ON prod.playlist_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM prod.playlists WHERE id = playlist_id AND user_id = auth.uid())
);
CREATE POLICY "playlist_items_delete" ON prod.playlist_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM prod.playlists WHERE id = playlist_id AND user_id = auth.uid())
);
GRANT SELECT, INSERT, DELETE ON prod.playlist_items TO anon, authenticated;

-- Notifications
CREATE TABLE IF NOT EXISTS prod.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES prod.users(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES prod.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('like', 'comment', 'dm', 'follow')),
  post_id uuid REFERENCES prod.posts(id) ON DELETE CASCADE,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE prod.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_select" ON prod.notifications;
DROP POLICY IF EXISTS "notifications_update" ON prod.notifications;
CREATE POLICY "notifications_select" ON prod.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update" ON prod.notifications FOR UPDATE USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON prod.notifications TO anon, authenticated;

-- Notification settings
CREATE TABLE IF NOT EXISTS prod.notification_settings (
  user_id uuid PRIMARY KEY REFERENCES prod.users(id) ON DELETE CASCADE,
  likes_enabled boolean NOT NULL DEFAULT true,
  comments_enabled boolean NOT NULL DEFAULT true,
  dms_enabled boolean NOT NULL DEFAULT true,
  follows_enabled boolean NOT NULL DEFAULT true,
  desktop_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE prod.notification_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notification_settings_select" ON prod.notification_settings;
DROP POLICY IF EXISTS "notification_settings_insert" ON prod.notification_settings;
DROP POLICY IF EXISTS "notification_settings_update" ON prod.notification_settings;
CREATE POLICY "notification_settings_select" ON prod.notification_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notification_settings_insert" ON prod.notification_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notification_settings_update" ON prod.notification_settings FOR UPDATE USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE ON prod.notification_settings TO anon, authenticated;

-- posts visibility column (safe add)
ALTER TABLE prod.posts ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public'
  CHECK (visibility IN ('public', 'followers_only', 'private'));

-- users columns (safe add)
ALTER TABLE prod.users ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE prod.users ADD COLUMN IF NOT EXISTS banner_url text;

-- User profile read policy (anyone can read)
DROP POLICY IF EXISTS "Users can read own profile" ON dev.users;
DROP POLICY IF EXISTS "Anyone can read user profiles" ON dev.users;
CREATE POLICY "Anyone can read user profiles" ON dev.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can read own profile" ON prod.users;
DROP POLICY IF EXISTS "Anyone can read user profiles" ON prod.users;
CREATE POLICY "Anyone can read user profiles" ON prod.users FOR SELECT USING (true);

-- ============================================================
-- SECTION 3: TRIGGER FUNCTIONS (shared, use TG_TABLE_SCHEMA)
-- Each trigger is created per-table after its section above.
-- Functions use TG_TABLE_SCHEMA so one function serves dev+prod.
-- ============================================================

-- like → notification
CREATE OR REPLACE FUNCTION public.notify_on_like()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_owner uuid;
  v_schema text := TG_TABLE_SCHEMA;
BEGIN
  EXECUTE format('SELECT user_id FROM %I.posts WHERE id = $1', v_schema)
    INTO v_owner USING NEW.post_id;
  IF v_owner IS NOT NULL AND v_owner <> NEW.user_id THEN
    EXECUTE format(
      'INSERT INTO %I.notifications (user_id, actor_id, type, post_id)
       VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
      v_schema
    ) USING v_owner, NEW.user_id, 'like', NEW.post_id;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_like ON dev.likes;
CREATE TRIGGER trg_notify_like
  AFTER INSERT ON dev.likes FOR EACH ROW EXECUTE FUNCTION public.notify_on_like();
DROP TRIGGER IF EXISTS trg_notify_like ON prod.likes;
CREATE TRIGGER trg_notify_like
  AFTER INSERT ON prod.likes FOR EACH ROW EXECUTE FUNCTION public.notify_on_like();

-- comment → notification
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_owner uuid;
  v_schema text := TG_TABLE_SCHEMA;
BEGIN
  EXECUTE format('SELECT user_id FROM %I.posts WHERE id = $1', v_schema)
    INTO v_owner USING NEW.post_id;
  IF v_owner IS NOT NULL AND v_owner <> NEW.user_id THEN
    EXECUTE format(
      'INSERT INTO %I.notifications (user_id, actor_id, type, post_id) VALUES ($1, $2, $3, $4)',
      v_schema
    ) USING v_owner, NEW.user_id, 'comment', NEW.post_id;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_comment ON dev.comments;
CREATE TRIGGER trg_notify_comment
  AFTER INSERT ON dev.comments FOR EACH ROW EXECUTE FUNCTION public.notify_on_comment();
DROP TRIGGER IF EXISTS trg_notify_comment ON prod.comments;
CREATE TRIGGER trg_notify_comment
  AFTER INSERT ON prod.comments FOR EACH ROW EXECUTE FUNCTION public.notify_on_comment();

-- follow → notification
CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_schema text := TG_TABLE_SCHEMA;
BEGIN
  EXECUTE format(
    'INSERT INTO %I.notifications (user_id, actor_id, type) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
    v_schema
  ) USING NEW.following_id, NEW.follower_id, 'follow';
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_follow ON dev.follows;
CREATE TRIGGER trg_notify_follow
  AFTER INSERT ON dev.follows FOR EACH ROW EXECUTE FUNCTION public.notify_on_follow();
DROP TRIGGER IF EXISTS trg_notify_follow ON prod.follows;
CREATE TRIGGER trg_notify_follow
  AFTER INSERT ON prod.follows FOR EACH ROW EXECUTE FUNCTION public.notify_on_follow();

-- message → notification
CREATE OR REPLACE FUNCTION public.notify_on_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_schema text := TG_TABLE_SCHEMA;
BEGIN
  EXECUTE format(
    'INSERT INTO %I.notifications (user_id, actor_id, type) VALUES ($1, $2, $3)',
    v_schema
  ) USING NEW.receiver_id, NEW.sender_id, 'dm';
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_message ON dev.messages;
CREATE TRIGGER trg_notify_message
  AFTER INSERT ON dev.messages FOR EACH ROW EXECUTE FUNCTION public.notify_on_message();
DROP TRIGGER IF EXISTS trg_notify_message ON prod.messages;
CREATE TRIGGER trg_notify_message
  AFTER INSERT ON prod.messages FOR EACH ROW EXECUTE FUNCTION public.notify_on_message();

-- ============================================================
-- SECTION 4: REALTIME
-- After running this SQL, enable Realtime in Supabase Dashboard:
--   Database → Replication → Source → Add tables:
--     dev schema:  notifications, messages
--     prod schema: notifications, messages
-- Without this, push notifications won't arrive in the browser.
-- ============================================================
