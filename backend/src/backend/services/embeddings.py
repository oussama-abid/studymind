from typing import Literal

from google.genai import types

from backend.models import EMBEDDING_DIMENSIONS
from backend.services.gemini import PATIENT_RETRIES, QUICK_RETRIES, create_client

MODEL = "gemini-embedding-001"
BATCH_SIZE = 100

TaskType = Literal["RETRIEVAL_DOCUMENT", "RETRIEVAL_QUERY"]


def embed_texts(
    texts: list[str],
    task_type: TaskType = "RETRIEVAL_DOCUMENT",
) -> list[list[float]]:
    """Turn each text into a vector of 768 numbers, in the same order."""
    # Questions come from a waiting student; documents are embedded in the background
    retries = QUICK_RETRIES if task_type == "RETRIEVAL_QUERY" else PATIENT_RETRIES
    client = create_client(retries)
    vectors: list[list[float]] = []

    for start in range(0, len(texts), BATCH_SIZE):
        batch = texts[start : start + BATCH_SIZE]
        response = client.models.embed_content(
            model=MODEL,
            contents=batch,
            config=types.EmbedContentConfig(
                task_type=task_type,
                output_dimensionality=EMBEDDING_DIMENSIONS,
            ),
        )
        vectors.extend(embedding.values for embedding in response.embeddings)

    return vectors
