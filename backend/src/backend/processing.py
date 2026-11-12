import logging

from google.genai.errors import APIError
from pypdf.errors import PdfReadError
from sqlalchemy.orm import Session, sessionmaker

from backend.chunking import chunk_text
from backend.embeddings import embed_texts
from backend.models import Chunk, Document, DocumentStatus
from backend.pdf import extract_pages

logger = logging.getLogger(__name__)


def mark_failed(db: Session, document: Document, message: str) -> None:
    document.status = DocumentStatus.FAILED
    document.error_message = message
    db.commit()


def process_document(db: Session, document: Document) -> None:
    """Extract the PDF's text, store it as chunks and embed each chunk."""
    try:
        pages = extract_pages(document.path)
    except PdfReadError:
        mark_failed(db, document, "The PDF could not be read.")
        return

    chunk_index = 0
    chunks: list[Chunk] = []
    for page_number, text in pages:
        for content in chunk_text(text):
            chunk = Chunk(
                document_id=document.id,
                chunk_index=chunk_index,
                page_number=page_number,
                content=content,
            )
            db.add(chunk)
            chunks.append(chunk)
            chunk_index += 1

    if not chunks:
        mark_failed(db, document, "No text found. Scanned PDFs are not supported yet.")
        return

    texts = [chunk.content for chunk in chunks]

    try:
        vectors = embed_texts(texts)
    except APIError:
        logger.exception("Embedding failed for document %s", document.id)
        mark_failed(db, document, "Embedding failed. Please try again later.")
        return

    for chunk, vector in zip(chunks, vectors, strict=True):
        chunk.embedding = vector

    document.status = DocumentStatus.READY
    db.commit()


def process_document_in_background(
    session_factory: sessionmaker[Session], document_id: int
) -> None:
    """Run after the upload response: own session, never leave it 'processing'."""
    with session_factory() as db:
        document = db.get(Document, document_id)
        if document is None:  # deleted before we started
            return
        try:
            process_document(db, document)
        except Exception:
            logger.exception("Processing crashed for document %s", document_id)
            db.rollback()
            mark_failed(db, document, "Processing failed. Please try again later.")
