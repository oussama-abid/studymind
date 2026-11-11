from pathlib import Path

from pypdf import PdfReader


def extract_pages(path: str | Path) -> list[tuple[int, str]]:
    """Return (page number, text) for every page, starting at page 1."""
    reader = PdfReader(path)
    return [
        (number, page.extract_text() or "")
        for number, page in enumerate(reader.pages, start=1)
    ]
