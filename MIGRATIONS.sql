-- ============================================================
-- Run this in Supabase SQL Editor for EACH schema (dev AND prod)
-- Step 1: SET search_path TO dev; -- then run ALL sections below
-- Step 2: SET search_path TO prod; -- then run ALL sections below again
-- ============================================================

-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (length(content) > 0 AND length(content) <= 500),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comments_select" ON comments;
DROP POLICY IF EXISTS "comments_insert" ON comments;
DROP POLICY IF EXISTS "comments_delete" ON comments;
CREATE POLICY "comments_select" ON comments FOR SELECT USING (true);
CREATE POLICY "comments_insert" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete" ON comments FOR DELETE USING (auth.uid() = user_id);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (length(content) > 0 AND length(content) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "messages_select" ON messages;
DROP POLICY IF EXISTS "messages_insert" ON messages;
DROP POLICY IF EXISTS "messages_update" ON messages;
CREATE POLICY "messages_select" ON messages FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "messages_update" ON messages FOR UPDATE USING (auth.uid() = receiver_id);

-- Playlists
CREATE TABLE IF NOT EXISTS playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(name) > 0 AND length(name) <= 100),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "playlists_select" ON playlists;
DROP POLICY IF EXISTS "playlists_insert" ON playlists;
DROP POLICY IF EXISTS "playlists_delete" ON playlists;
CREATE POLICY "playlists_select" ON playlists FOR SELECT USING (true);
CREATE POLICY "playlists_insert" ON playlists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "playlists_delete" ON playlists FOR DELETE USING (auth.uid() = user_id);

-- Playlist items
CREATE TABLE IF NOT EXISTS playlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id uuid NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(playlist_id, post_id)
);
ALTER TABLE playlist_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "playlist_items_select" ON playlist_items;
DROP POLICY IF EXISTS "playlist_items_insert" ON playlist_items;
DROP POLICY IF EXISTS "playlist_items_delete" ON playlist_items;
CREATE POLICY "playlist_items_select" ON playlist_items FOR SELECT USING (true);
CREATE POLICY "playlist_items_insert" ON playlist_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM playlists WHERE id = playlist_id AND user_id = auth.uid())
);
CREATE POLICY "playlist_items_delete" ON playlist_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM playlists WHERE id = playlist_id AND user_id = auth.uid())
);

-- Follows
CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "follows_select" ON follows;
DROP POLICY IF EXISTS "follows_insert" ON follows;
DROP POLICY IF EXISTS "follows_delete" ON follows;
CREATE POLICY "follows_select" ON follows FOR SELECT USING (true);
CREATE POLICY "follows_insert" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete" ON follows FOR DELETE USING (auth.uid() = follower_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON follows TO anon, authenticated;

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('like', 'comment', 'dm', 'follow')),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_select" ON notifications;
DROP POLICY IF EXISTS "notifications_update" ON notifications;
CREATE POLICY "notifications_select" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (auth.uid() = user_id);
-- Grants (triggers bypass RLS, so no INSERT policy needed for users)
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO anon, authenticated;

-- Notification settings
CREATE TABLE IF NOT EXISTS notification_settings (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  likes_enabled boolean NOT NULL DEFAULT true,
  comments_enabled boolean NOT NULL DEFAULT true,
  dms_enabled boolean NOT NULL DEFAULT true,
  follows_enabled boolean NOT NULL DEFAULT true,
  desktop_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notification_settings_select" ON notification_settings;
DROP POLICY IF EXISTS "notification_settings_insert" ON notification_settings;
DROP POLICY IF EXISTS "notification_settings_update" ON notification_settings;
CREATE POLICY "notification_settings_select" ON notification_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notification_settings_insert" ON notification_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notification_settings_update" ON notification_settings FOR UPDATE USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_settings TO anon, authenticated;

-- Trigger: like → notification
CREATE OR REPLACE FUNCTION notify_on_like()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_owner uuid;
BEGIN
  SELECT user_id INTO v_owner FROM posts WHERE id = NEW.post_id;
  IF v_owner IS NOT NULL AND v_owner <> NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, post_id)
    VALUES (v_owner, NEW.user_id, 'like', NEW.post_id)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_like ON likes;
CREATE TRIGGER trg_notify_like AFTER INSERT ON likes FOR EACH ROW EXECUTE FUNCTION notify_on_like();

-- Trigger: comment → notification
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_owner uuid;
BEGIN
  SELECT user_id INTO v_owner FROM posts WHERE id = NEW.post_id;
  IF v_owner IS NOT NULL AND v_owner <> NEW.user_id THEN
    INSERT INTO notifications (user_id, actor_id, type, post_id)
    VALUES (v_owner, NEW.user_id, 'comment', NEW.post_id);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_comment ON comments;
CREATE TRIGGER trg_notify_comment AFTER INSERT ON comments FOR EACH ROW EXECUTE FUNCTION notify_on_comment();

-- Trigger: follow → notification
CREATE OR REPLACE FUNCTION notify_on_follow()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO notifications (user_id, actor_id, type)
  VALUES (NEW.following_id, NEW.follower_id, 'follow')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_follow ON follows;
CREATE TRIGGER trg_notify_follow AFTER INSERT ON follows FOR EACH ROW EXECUTE FUNCTION notify_on_follow();

-- Trigger: message → notification
CREATE OR REPLACE FUNCTION notify_on_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO notifications (user_id, actor_id, type)
  VALUES (NEW.receiver_id, NEW.sender_id, 'dm');
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_message ON messages;
CREATE TRIGGER trg_notify_message AFTER INSERT ON messages FOR EACH ROW EXECUTE FUNCTION notify_on_message();

-- Enable Realtime for notifications (run once per schema)
-- In Supabase Dashboard: Database → Replication → Add table → notifications
