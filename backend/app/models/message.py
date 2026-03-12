from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import UUIDMixin, TimestampMixin
from app.core.database import Base


class Message(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "messages"

    author_name: Mapped[str] = mapped_column(String(100), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
