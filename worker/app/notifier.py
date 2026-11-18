
import json
import random
import requests
from .config import settings
from .log_utils import log_message

def notify(article):
    url = settings.BACKEND_INTERNAL_URL
    secret = settings.INTERNAL_WEBHOOK_SECRET
    if not url:
        return
    
    payload = article.copy()
    if hasattr(payload.get("published_at"), "isoformat"):
        payload["published_at"] = payload["published_at"].isoformat()

    response = requests.post(
        url,
        json={"type": "article.processed", "article": payload},
        headers={"x-internal-secret": secret},
        timeout=5
    )
    response.raise_for_status()
    log_message(f"Successfully notified backend for article {article['id']}")
    log_message(f"Payload sent: {json.dumps(payload)}")

def notify_worker_status(status: str):
    url = settings.BACKEND_INTERNAL_URL
    secret = settings.INTERNAL_WEBHOOK_SECRET
    if not url:
        return

    response = requests.post(
        url,
        json={"type": "worker.status", "status": status},
        headers={"x-internal-secret": secret},
        timeout=5
    )
    response.raise_for_status()
    log_message(f"Successfully notified backend of {status}")

if __name__ == "__main__":
    id = random.randint(1, 1000)
    test_article = {
        "id": id,
        "title": "Test Article " + str(id),
        "url": "https://example.com/test-article",
        "author": "Author",
        "published_at": "2024-06-01T00:00:00Z",
        "content": "This is a test article.",
        "summary": "This is a test summary."
    }
    notify(test_article)