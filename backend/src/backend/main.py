from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.database import check_database
from backend.routers import courses

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(courses.router)


@app.get("/health")
def health():
    db_status = "ok" if check_database() else "error"
    return {"status": "ok", "db": db_status}
