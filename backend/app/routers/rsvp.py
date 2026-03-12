import html

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.core.database import get_db
from app.models.rsvp import Rsvp
from app.schemas.rsvp import RsvpIn, RsvpOut

router = APIRouter()


@router.post("", response_model=RsvpOut, status_code=status.HTTP_201_CREATED)
async def submit_rsvp(
    payload: RsvpIn,
    db: AsyncSession = Depends(get_db),
) -> Rsvp:
    """
    Registra a confirmação (ou recusa) de presença de um convidado.
    Previne duplicatas pelo e-mail (constraint UNIQUE no banco).
    SEC-01: inputs sanitizados via html.escape antes de persistir.
    """
    # SEC-01: sanitizar todos os campos de texto
    full_name = html.escape(payload.full_name.strip())
    email = payload.email.lower().strip()
    companions = [
        {"name": html.escape(c.name.strip())}
        for c in payload.companions
    ]

    rsvp = Rsvp(
        full_name=full_name,
        email=email,
        status=payload.status,
        companions=companions,
    )
    db.add(rsvp)

    try:
        await db.commit()
        await db.refresh(rsvp)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Este e-mail já foi registrado.",
        )

    return rsvp
