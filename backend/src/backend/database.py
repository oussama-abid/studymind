from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

from backend.config import settings

engine = create_engine(settings.database_url)


def check_database() -> bool:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except SQLAlchemyError:
        return False
