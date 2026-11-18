

import base64
import calendar
from hashlib import sha256
import hashlib
import json
import time
import traceback
import feedparser

from .db import active_feeds, connect, save_article, save_summary
from .llm import classify, summarize
from .log_utils import log_message, log_header
from .web import fetch_page
from .notifier import notify, notify_worker_status
from .config import settings

def process_feed(feed):
    log_header(f"🤖 Processing feed: {feed['url']}")
    parsed = feedparser.parse(feed["url"])
    if parsed.bozo:
        log_message(f"Feed warning {feed['url']}: {parsed.bozo_exception}")
    items = []
    for entry in parsed.entries:

        digest = hashlib.sha256(entry.get("id", "").encode()).digest()
        short_id = base64.b32encode(digest).decode('utf-8').rstrip('=')[:10]
        pub_struct = entry.get("published_parsed") or entry.get("updated_parsed")
        published_at = calendar.timegm(pub_struct) if pub_struct else None
        item = {
            "id": entry.get("id"),
            "url": entry.get("link"),            
            "title": entry.get("title"),            
            "updated": entry.get("updated"),
            "published": entry.get("published"),
            "published_at": published_at,
            "content": entry.get("summary"),
            "short-id": short_id
        }
        items.append(item)

    items = items[:20]
    if not items:
        log_message(f"No items found for feed: {feed['url']}")
        return
    
    log_message(f"Selected the first {len(items)} items in feed: {feed['url']}")
    user_prompt = "\n\n".join(
        [f"id: {item['short-id']}\ntitle: {item['title']}" for item in items]
    )
    
    try:
        response, model = classify(user_prompt)
        if response:
            try:
                classification = json.loads(response)
                classification_items = classification.get("items", [])
                log_message(f"🤖 Classification for feed {feed['url']}: {len(classification_items)} items")
                with connect() as conn:
                    conn.execute("UPDATE feeds SET last_fetched_at=NOW() WHERE id=%s", (feed["id"],))

                map = { item["id"]: item for item in classification.get("items", []) }

                for item in items:
                    matched = map.get(item['short-id'])
                    # save the article with the classification data
                    if matched is not None:
                        item["content"] = json.dumps(
                            {
                                "sentiment": matched.get("sentiment", ""),
                                "confidence": matched.get("confidence", 0),
                                "categories": matched.get("categories", []),
                                "model": model
                            },
                            indent=2
                        )

                        article = save_article(feed["id"], item)
                        if article:
                            log_header("Resolve article content")
                            article_id = article["id"]
                            content = fetch_page(item["url"])
                            if content:
                                text = content.get("text-content", "")[:400]
                                log_message(f"Resolve summary for article {item['short-id']}: {text}")
                                time.sleep(10)
                                text, model = summarize(text)
                                if text:
                                    log_message(f"🤖 Summary for article {item['short-id']}: {text}")
                                    save_summary(article_id, text, model)
                                    log_message(f"Saved summary for article {item['short-id']}")
                                    article["summary"] = text
                                    article["content"] = item["content"]
                                    notify(article)

            except json.JSONDecodeError:
                log_message(f"Failed to parse classification response for feed {feed['url']}: {response}")
    except Exception as e:
        log_message(f"Error classifying feed {feed['url']}: {e}")
        traceback.print_exc()

def main():
    interval = max(settings.POLL_INTERVAL_SECONDS, 60 * 10)
    log_message(f"Worker started; polling every {interval} seconds")
    if not settings.GOOGLE_API_KEY:
        log_message("GOOGLE_API_KEY is not set; new articles will not be classified or saved")
    count = 0
    while True:
        notify_worker_status("scan")
        count += 1
        try:
            log_header(f"Starting polling cycle {count}")
            for feed in active_feeds():
                try:
                    process_feed(feed)
                except Exception as e:
                    log_message(f"⚠️Feed failed: {feed['url']} | Error: {e}")
                    # traceback.print_exc() 
        except Exception as e:
            log_message(f"⚠️ Polling cycle failed: {e}")
            # traceback.print_exc()
        log_message(f"⌚ Sleeping for {interval} seconds before next polling cycle")
        notify_worker_status("sleep")
        time.sleep(interval)

if __name__ == "__main__":
    main()
