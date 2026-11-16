"""add course owner

Revision ID: b539cd7b58f3
Revises: 77f26cbc75e4
Create Date: 2026-11-16 12:59:38.987449

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b539cd7b58f3"
down_revision: str | Sequence[str] | None = "77f26cbc75e4"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    # No real users yet: old dev courses have no owner, so remove them
    op.execute("DELETE FROM courses")
    op.add_column("courses", sa.Column("owner_id", sa.Integer(), nullable=False))
    op.create_foreign_key(
        "courses_owner_id_fkey",
        "courses",
        "users",
        ["owner_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint("courses_owner_id_fkey", "courses", type_="foreignkey")
    op.drop_column("courses", "owner_id")
