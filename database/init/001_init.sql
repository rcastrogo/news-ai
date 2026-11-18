
CREATE TABLE IF NOT EXISTS feeds (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_fetched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS articles (
  id BIGSERIAL PRIMARY KEY,
  feed_id BIGINT REFERENCES feeds(id) ON DELETE SET NULL,
  url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  author TEXT,
  published_at TIMESTAMPTZ,
  content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE TABLE IF NOT EXISTS summaries (
  id BIGSERIAL PRIMARY KEY,
  article_id BIGINT NOT NULL UNIQUE REFERENCES articles(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO feeds (name, url) VALUES ('Hacker News', 'https://hnrss.org/frontpage')
ON CONFLICT (url) DO NOTHING;
