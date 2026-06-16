/*
# Ministry Content System - Posts, Comments, and Reactions

Creates the core content management system for posting Words of God (text and audio).

## 1. New Tables

### `posts`
- `id` (uuid, primary key) - Unique identifier
- `title` (text, not null) - Post title/subject
- `content` (text, nullable) - Text content for written posts
- `audio_url` (text, nullable) - URL for audio file uploads
- `author` (text, not null, default 'Admin') - Author name
- `created_at` (timestamptz, default now()) - Creation timestamp
- `updated_at` (timestamptz, default now()) - Last update timestamp
- `is_published` (boolean, default true) - Publish status (admin can draft)

### `comments`
- `id` (uuid, primary key) - Unique identifier
- `post_id` (uuid, foreign key to posts) - Associated post
- `author_name` (text, not null) - Name of commenter
- `content` (text, not null) - Comment text
- `created_at` (timestamptz, default now()) - Creation timestamp

### `reactions`
- `id` (uuid, primary key) - Unique identifier
- `post_id` (uuid, foreign key to posts) - Associated post
- `emoji` (text, not null) - The emoji character
- `created_at` (timestamptz, default now()) - Creation timestamp
- `session_id` (text, not null) - Browser session to prevent duplicate reactions

## 2. Security (RLS Policies)

- Posts: Public read (anon + authenticated), admin write (authenticated)
- Comments: Public read and write (anon + authenticated) - anyone can comment
- Reactions: Public read and write (anon + authenticated) - anyone can react

## 3. Indexes

- `idx_posts_created_at` - For date-ordered queries
- `idx_posts_title` - For keyword/title search
- `idx_comments_post_id` - For loading comments by post
- `idx_reactions_post_id` - For loading reactions by post
*/

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text,
  audio_url text,
  author text NOT NULL DEFAULT 'Admin',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_published boolean DEFAULT true
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Reactions table
CREATE TABLE IF NOT EXISTS reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  session_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, session_id, emoji)
);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- Posts policies
DROP POLICY IF EXISTS "posts_public_read" ON posts;
CREATE POLICY "posts_public_read" ON posts FOR SELECT
  TO anon, authenticated USING (is_published = true);

DROP POLICY IF EXISTS "posts_admin_write" ON posts;
CREATE POLICY "posts_admin_write" ON posts FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- Comments policies (public read/write)
DROP POLICY IF EXISTS "comments_public_read" ON comments;
CREATE POLICY "comments_public_read" ON comments FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "comments_public_insert" ON comments;
CREATE POLICY "comments_public_insert" ON comments FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Reactions policies (public read/write)
DROP POLICY IF EXISTS "reactions_public_read" ON reactions;
CREATE POLICY "reactions_public_read" ON reactions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "reactions_public_insert" ON reactions;
CREATE POLICY "reactions_public_insert" ON reactions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_title ON posts USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_posts_content ON posts USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON reactions(post_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for posts updated_at
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();