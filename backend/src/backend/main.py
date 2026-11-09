from fastapi import FastAPI

from backend.database import check_database

app = FastAPI()


@app.get("/health")
def health():
    db_status = "ok" if check_database() else "error"
    return {"status": "ok", "db": db_status}
