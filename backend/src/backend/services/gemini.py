from google import genai
from google.genai import types

from backend.core.config import settings

# Background work (embedding a PDF): nobody is waiting, so wait as long as the
# free-tier quota needs (it resets every minute).
PATIENT_RETRIES = types.HttpRetryOptions(
    attempts=5,  # 1 try + 4 retries
    initial_delay=30,  # seconds before the first retry
    max_delay=60,
    http_status_codes=[429, 500, 503],
)

# A student is waiting on screen: one quick retry, then give up with a clear error.
QUICK_RETRIES = types.HttpRetryOptions(
    attempts=2,  # 1 try + 1 retry
    initial_delay=1,
    max_delay=2,
    http_status_codes=[429, 500, 503],
)


def create_client(
    retries: types.HttpRetryOptions, timeout_seconds: int = 60
) -> genai.Client:
    return genai.Client(
        api_key=settings.gemini_api_key,
        http_options=types.HttpOptions(
            retry_options=retries,
            timeout=timeout_seconds * 1000,  # the SDK expects milliseconds
        ),
    )
