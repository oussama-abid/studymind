from google import genai
from google.genai import types

from backend.config import settings
from backend.models import EMBEDDING_DIMENSIONS

MODEL = "gemini-embedding-001"
BATCH_SIZE = 100


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Turn each text into a vector of 768 numbers, in the same order."""
    client = genai.Client(
        api_key=settings.gemini_api_key,
        http_options=types.HttpOptions(
            retry_options=types.HttpRetryOptions(
                attempts=5,  # 1 try + 4 retries
                initial_delay=30,  # seconds before the first retry
                max_delay=60,  # the free-tier quota resets every minute
                http_status_codes=[429, 500, 503],
            ),
        ),
    )
    vectors: list[list[float]] = []

    for start in range(0, len(texts), BATCH_SIZE):
        batch = texts[start : start + BATCH_SIZE]
        response = client.models.embed_content(
            model=MODEL,
            contents=batch,
            config=types.EmbedContentConfig(
                task_type="RETRIEVAL_DOCUMENT",
                output_dimensionality=EMBEDDING_DIMENSIONS,
            ),
        )
        vectors.extend(embedding.values for embedding in response.embeddings)

    return vectors
