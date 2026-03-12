from pydantic import BaseModel, field_validator
import uuid
from datetime import datetime


class MessageIn(BaseModel):
    author_name: str
    content: str

    @field_validator("author_name")
    @classmethod
    def author_min(cls, v: str) -> str:
        if len(v.strip()) < 2:
            raise ValueError("Informe seu nome (mín. 2 caracteres)")
        return v.strip()

    @field_validator("content")
    @classmethod
    def content_range(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Mensagem muito curta (mín. 3 caracteres)")
        if len(v) > 500:
            raise ValueError("Mensagem muito longa (máx. 500 caracteres)")
        return v


class MessageOut(BaseModel):
    id: uuid.UUID
    author_name: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}
