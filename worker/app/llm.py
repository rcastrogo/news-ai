

from google import genai
from google.genai import types

from .config import settings
from .log_utils import log_message

CLASSIFY_PROMPT = """You are a news classifier. You can read spanish news articles. Return ONLY valid JSON (no markdown, no extra text): 

{
  "items": [
    {
      "id": "<original id>",
      "sentiment": "optimistic" | "pessimistic" | "neutral",
      "confidence": <0..1>,
      "categories": ["<category>", ...]
    }
  ]
}

Valid categories (use exactly these strings):
- "ciencia": scientific news, discoveries, or research updates.
- "tech_news": product launches, updates, or changes to tech products/services. NOT layoffs, financials, or corporate news without a product.
- "ai_security": vulnerabilities, attacks, leaks, or incidents affecting AI models/systems, including AI companies whose systems are compromised.

Rules:
1. Assign all applicable categories; prefer the most specific one.
2. Exclude items that match no category.
3. sentiment = impact on the main actor/ecosystem, not the reader.
4. confidence: 1 = unambiguous, 0.5 = interpretive, 0 = edge case.
5. If empty, return {"items": []}."""

SUMMARIZE_PROMPT = """You are a news summarizer. You must summarize the article concisely in spanish. Return ONLY text (no markdown, no invented content):

Rules:
1. Provide a concise summary of the article. No more than a five sentences.
2. You can simulate paragraphs with line breaks ("\n").
3. If the article is empty or cannot be summarized, return {"summary": ""}."""

def classify(text):
    model = settings.GOOGLE_MODEL
    api_key = settings.GOOGLE_API_KEY
    if not api_key:
        return None, None
    log_message("LLM -> Calling classify...")
    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model=model,
        contents=text,
        config=types.GenerateContentConfig(
            system_instruction=CLASSIFY_PROMPT,
            temperature=0.3,
        )
    )
    log_message("LLM -> Classification response received.")
    return (response.text or "").strip(), model

def summarize(text):
    model = settings.GOOGLE_MODEL
    api_key = settings.GOOGLE_API_KEY
    if not api_key:
        return None, None
    log_message("LLM -> Calling summarize...")
    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model=model,
        contents=text,
        config=types.GenerateContentConfig(
            system_instruction=SUMMARIZE_PROMPT,
            temperature=0.5,
        )
    )
    log_message("LLM -> Summarization response received.")
    return (response.text or "").strip(), model
