import html

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.message import Message
from app.schemas.message import MessageIn, MessageOut

router = APIRouter()


@router.get("", response_model=list[MessageOut])
async def list_messages(
    db: AsyncSession = Depends(get_db),
) -> list[Message]:
    """
    Retorna todas as mensagens do mural, ordenadas da mais recente para a mais antiga.
    O frontend faz polling a cada 10 s para exibir novas mensagens sem reload.
    """
    stmt = select(Message).order_by(Message.created_at.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.post("", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
async def post_message(
    payload: MessageIn,
    db: AsyncSession = Depends(get_db),
) -> Message:
    """
    Publica uma nova mensagem no mural.
    SEC-01: inputs sanitizados via html.escape antes de persistir.
    """
    message = Message(
        author_name=html.escape(payload.author_name),
        content=html.escape(payload.content),
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)
    return message
