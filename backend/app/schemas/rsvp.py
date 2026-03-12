from pydantic import BaseModel, EmailStr, field_validator
import uuid
from datetime import datetime


class Companion(BaseModel):
    name: str


class RsvpIn(BaseModel):
    full_name: str
    email: EmailStr
    status: str  # 'confirmed' | 'declined'
    companions: list[Companion] = []

    @field_validator("full_name")
    @classmethod
    def full_name_min(cls, v: str) -> str:
        if len(v.strip()) < 2:
            raise ValueError("Nome completo obrigatório (mín. 2 caracteres)")
        return v.strip()

    @field_validator("status")
    @classmethod
    def status_valid(cls, v: str) -> str:
        if v not in ("confirmed", "declined"):
            raise ValueError("Status deve ser 'confirmed' ou 'declined'")
        return v

    @field_validator("companions")
    @classmethod
    def companions_names(cls, companions: list[Companion]) -> list[Companion]:
        for c in companions:
            if len(c.name.strip()) < 2:
                raise ValueError("Nome do acompanhante obrigatório (mín. 2 caracteres)")
        return companions


class RsvpOut(BaseModel):
    id: uuid.UUID
    full_name: str
    email: str
    status: str
    companions: list[Companion]
    created_at: datetime

    model_config = {"from_attributes": True}
