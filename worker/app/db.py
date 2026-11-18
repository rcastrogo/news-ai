
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
import psycopg
from psycopg.rows import dict_row
from .config import settings
from .log_utils import log_message

def parse_published(entry):
    # 1) epoch (int o str)
    ts = entry.get("published_at")
    if ts not in (None, ""):
        try:
            return datetime.fromtimestamp(int(float(ts)), tz=timezone.utc)
        except (ValueError, TypeError, OSError):
            pass
    # 2) fecha RFC 2822: "Mon, 16 Nov 2026 16:03:25 +0100"
    for key in ("published", "updated"):
        value = entry.get(key)
        if value:
            try:
                return parsedate_to_datetime(value)
            except (ValueError, TypeError):
                pass
    return datetime.now(timezone.utc)

def connect():
    return psycopg.connect(
        host=settings.POSTGRES_HOST,
        port=settings.POSTGRES_PORT,
        dbname=settings.POSTGRES_DB,
        user=settings.POSTGRES_USER,
        password=settings.POSTGRES_PASSWORD,
        row_factory=dict_row,
    )

def active_feeds():
    with connect() as conn:
        return conn.execute("SELECT id, name, url FROM feeds WHERE is_active = TRUE").fetchall()

def save_article(feed_id, entry):
    try:
        url, title = entry.get("url"), entry.get("title")
        if not url or not title:
            return None
        published_at = parse_published(entry)
        content = entry.get("content") or entry.get("summary") or "{}"
        with connect() as conn:
            return conn.execute(
                """INSERT INTO articles (feed_id, url, title, author, published_at, content)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (url) DO NOTHING
                RETURNING id, title, url, author, published_at""",
                (feed_id, url, title, entry.get("author"), published_at, content)
            ).fetchone()
    except Exception as e:
        log_message(f"Error processing entry: {e}")
        return None

def save_summary(article_id, summary, model):
     with connect() as conn:
        conn.execute(
            """INSERT INTO summaries (article_id, model, summary) VALUES (%s, %s, %s)
               ON CONFLICT (article_id) DO UPDATE SET model=EXCLUDED.model,
               summary=EXCLUDED.summary, created_at=NOW()""",
            (article_id, model, summary)
        )

if __name__ == "__main__":
    with connect() as conn:
        log_message(active_feeds())