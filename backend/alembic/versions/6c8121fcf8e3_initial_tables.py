"""initial tables

Revision ID: 6c8121fcf8e3
Revises:
Create Date: 2026-08-05

"""
from alembic import op
import sqlalchemy as sa

revision = "6c8121fcf8e3"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("email", sa.String(), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("full_name", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "datasets",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("owner_id", sa.String(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("filename", sa.String(), nullable=False),
        sa.Column("file_path", sa.String(), nullable=False),
        sa.Column("rows", sa.Integer(), nullable=True),
        sa.Column("columns", sa.Integer(), nullable=True),
        sa.Column("health_score", sa.Float(), nullable=True),
        sa.Column("grade", sa.String(), nullable=True),
        sa.Column("analysis_result", sa.JSON(), nullable=True),
        sa.Column("report_path", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "chat_messages",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("dataset_id", sa.String(), sa.ForeignKey("datasets.id"), nullable=False),
        sa.Column("owner_id", sa.String(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("role", sa.String(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "training_runs",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("dataset_id", sa.String(), sa.ForeignKey("datasets.id"), nullable=False),
        sa.Column("owner_id", sa.String(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("target_column", sa.String(), nullable=False),
        sa.Column("problem_type", sa.String(), nullable=True),
        sa.Column("algorithm", sa.String(), nullable=True),
        sa.Column("metrics", sa.JSON(), nullable=True),
        sa.Column("feature_importance", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("training_runs")
    op.drop_table("chat_messages")
    op.drop_table("datasets")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
