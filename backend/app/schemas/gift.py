import uuid
from decimal import Decimal
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator


# ── Gift ──────────────────────────────────────────────────────────────────────

class GiftOut(BaseModel):
    id: uuid.UUID
    title: str
    price: Decimal
    image_url: str | None
    category: str
    stock_limit: int
    purchased: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Purchase ──────────────────────────────────────────────────────────────────

class GiftPurchaseIn(BaseModel):
    gift_id: uuid.UUID
    buyer_name: str = Field(..., min_length=2, max_length=100)
    message: str | None = Field(default=None, max_length=300)

    @field_validator("buyer_name", "message", mode="before")
    @classmethod
    def strip_whitespace(cls, v: str | None) -> str | None:
        return v.strip() if isinstance(v, str) else v


class GiftPurchaseOut(BaseModel):
    id: uuid.UUID
    gift_id: uuid.UUID
    buyer_name: str
    message: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Filters ───────────────────────────────────────────────────────────────────

SortOrder = Literal["asc", "desc"]
