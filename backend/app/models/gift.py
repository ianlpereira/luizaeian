import uuid
from decimal import Decimal

from sqlalchemy import String, Numeric, Integer, Boolean, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import UUIDMixin, TimestampMixin
from app.core.database import Base


class Gift(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "gifts"

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    stock_limit: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    purchased: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    hidden: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    purchases: Mapped[list["GiftPurchase"]] = relationship(
        "GiftPurchase", back_populates="gift", lazy="select"
    )


class GiftPurchase(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "gift_purchases"

    gift_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("gifts.id", ondelete="CASCADE"),
        nullable=False,
    )
    buyer_name: Mapped[str] = mapped_column(String(100), nullable=False)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)

    gift: Mapped["Gift"] = relationship("Gift", back_populates="purchases")
