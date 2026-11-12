from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, HTTPException, UploadFile
from sqlalchemy import select

from backend.core.config import settings
from backend.core.database import SessionDep, SessionFactoryDep
from backend.models import Document
from backend.routers.courses import get_course_or_404
from backend.schemas.documents import DocumentRead
from backend.services.processing import process_document_in_background

MAX_UPLOAD_BYTES = 20 * 1024 * 1024  # 20 MB

router = APIRouter(prefix="/courses/{course_id}/documents", tags=["documents"])


def validate_pdf(content: bytes) -> None:
    if len(content) > MAX_UPLOAD_BYTES:
        max_mb = MAX_UPLOAD_BYTES // (1024 * 1024)
        raise HTTPException(
            status_code=400, detail=f"File is too big (max {max_mb} MB)"
        )
    if not content.startswith(b"%PDF-"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")


@router.post("", status_code=201, response_model=DocumentRead)
def upload_document(
    course_id: int,
    file: UploadFile,
    db: SessionDep,
    background_tasks: BackgroundTasks,
    session_factory: SessionFactoryDep,
):
    # 1. Check the course exists (404 otherwise)
    get_course_or_404(db, course_id)

    # 2. Read the file (at most one byte over the limit) and validate it
    content = file.file.read(MAX_UPLOAD_BYTES + 1)
    validate_pdf(content)

    # 3. Create the row; flush() makes the database assign an id
    document = Document(
        course_id=course_id,
        filename=file.filename or "document.pdf",
        path="",
    )
    db.add(document)
    db.flush()

    # 4. Save the file under a name we choose: <upload_dir>/<id>.pdf
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = upload_dir / f"{document.id}.pdf"
    file_path.write_bytes(content)

    # 5. Store the path and save everything
    document.path = str(file_path)
    db.commit()

    # 6. Process the PDF after the response is sent (chunks + embeddings)
    background_tasks.add_task(
        process_document_in_background, session_factory, document.id
    )

    db.refresh(document)
    return document


@router.get("", response_model=list[DocumentRead])
def list_documents(course_id: int, db: SessionDep):
    # 1. Check the course exists (404 otherwise)
    get_course_or_404(db, course_id)

    # 2. All documents of this course, newest first
    query = (
        select(Document)
        .where(Document.course_id == course_id)
        .order_by(Document.created_at.desc(), Document.id.desc())
    )
    return db.scalars(query).all()
