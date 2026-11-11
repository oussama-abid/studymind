from pypdf.errors import PdfReadError
from sqlalchemy.orm import Session

from backend.chunking import chunk_text
from backend.models import Chunk, Document, DocumentStatus
from backend.pdf import extract_pages


def mark_failed(db: Session, document: Document, message: str) -> None:
    document.status = DocumentStatus.FAILED
    document.error_message = message
    db.commit()


def process_document(db: Session, document: Document) -> None:
    """Extract the PDF's text and store it as chunks."""
    try:
        pages = extract_pages(document.path)
    except PdfReadError:
        mark_failed(db, document, "The PDF could not be read.")
        return

    chunk_index = 0
    for page_number, text in pages:
        for content in chunk_text(text):
            db.add(
                Chunk(
                    document_id=document.id,
                    chunk_index=chunk_index,
                    page_number=page_number,
                    content=content,
                )
            )
            chunk_index += 1

    if chunk_index == 0:
        mark_failed(db, document, "No text found. Scanned PDFs are not supported yet.")
        return

    db.commit()
