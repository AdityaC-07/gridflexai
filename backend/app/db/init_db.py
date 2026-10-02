from __future__ import annotations

from app.db.database import Base, engine
from app.models import building, retrofit, grid, simulation  # noqa: F401


def init_db() -> None:
    """Initialize database by creating all tables."""
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_db()
    print("Database tables created successfully.")
