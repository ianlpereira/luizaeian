"""
Rotas da área administrativa (/api/admin).

Login com usuário único vindo do ambiente e relatórios somente leitura da lista
de convidados, RSVP, presentes e pagamentos. Todas as rotas de relatório exigem
o JWT emitido em POST /login, enviado no header `Authorization: Bearer <token>`.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import (
    admin_auth_configured,
    check_login_rate_limit,
    clear_login_attempts,
    create_admin_token,
    get_current_admin,
    register_failed_login,
    verify_admin_credentials,
)
from app.schemas.admin import (
    AdminGiftsOut,
    AdminGuestCreateIn,
    AdminGuestRow,
    AdminGuestsOut,
    AdminGuestUpdateIn,
    AdminLoginIn,
    AdminMeOut,
    AdminPaymentsOut,
    AdminRsvpMatchesOut,
    AdminRsvpsOut,
    AdminTokenOut,
)
from app.services import admin_report_service, guest_service

router = APIRouter()


@router.post("/login", response_model=AdminTokenOut)
async def login(
    payload: AdminLoginIn,
    request: Request,
    _: None = Depends(check_login_rate_limit),
) -> AdminTokenOut:
    """
    Autentica o administrador e devolve um JWT de curta duração.

    A mesma mensagem de erro é usada para usuário e senha inválidos, para não
    revelar qual dos dois estava errado.
    """
    if not admin_auth_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Área administrativa não configurada.",
        )

    if not verify_admin_credentials(payload.username, payload.password):
        register_failed_login(request)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário ou senha inválidos.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    clear_login_attempts(request)
    token, expires_in = create_admin_token()
    return AdminTokenOut(access_token=token, expires_in=expires_in)


@router.get("/me", response_model=AdminMeOut)
async def me(username: str = Depends(get_current_admin)) -> AdminMeOut:
    """Verificação barata de token — usada pelo frontend ao abrir a página."""
    return AdminMeOut(username=username)


@router.get("/guests", response_model=AdminGuestsOut)
async def guests_report(
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_admin),
) -> AdminGuestsOut:
    """Lista de convidados, com o RSVP de cada um quando já vinculado."""
    return await admin_report_service.get_guests_report(db)


# Precisa vir antes de qualquer rota com {guest_id}: declarada depois, o FastAPI
# tentaria ler "rsvp-matches" como UUID e devolveria 422.
@router.get("/guests/rsvp-matches", response_model=AdminRsvpMatchesOut)
async def rsvp_matches(
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_admin),
) -> AdminRsvpMatchesOut:
    """Sugestões de vínculo entre a lista de convidados e as confirmações."""
    return await guest_service.get_rsvp_matches(db)


@router.post("/guests", response_model=AdminGuestRow, status_code=status.HTTP_201_CREATED)
async def create_guest(
    payload: AdminGuestCreateIn,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_admin),
) -> AdminGuestRow:
    """Adiciona um convidado a um grupo existente ou abre um grupo novo."""
    guest = await guest_service.create_guest(db, payload)
    return await admin_report_service.get_guest_row(db, guest.id)


@router.patch("/guests/{guest_id}", response_model=AdminGuestRow)
async def update_guest(
    guest_id: uuid.UUID,
    payload: AdminGuestUpdateIn,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_admin),
) -> AdminGuestRow:
    """Atualiza os campos enviados de um convidado, inclusive o vínculo de RSVP."""
    await guest_service.update_guest(db, guest_id, payload)
    return await admin_report_service.get_guest_row(db, guest_id)


@router.delete("/guests/{guest_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_guest(
    guest_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_admin),
) -> None:
    """Remove um convidado; se era o titular, promove outro membro do grupo."""
    await guest_service.delete_guest(db, guest_id)


@router.get("/rsvps", response_model=AdminRsvpsOut)
async def rsvps_report(
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_admin),
) -> AdminRsvpsOut:
    """Relatório de confirmações de presença, com totais de convidados."""
    return await admin_report_service.get_rsvp_report(db)


@router.get("/gifts", response_model=AdminGiftsOut)
async def gifts_report(
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_admin),
) -> AdminGiftsOut:
    """Catálogo de presentes, incluindo os ocultos, com compras e valores aprovados."""
    return await admin_report_service.get_gifts_report(db)


@router.get("/payments", response_model=AdminPaymentsOut)
async def payments_report(
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_admin),
) -> AdminPaymentsOut:
    """Relatório de pagamentos do Mercado Pago, com totais por status."""
    return await admin_report_service.get_payments_report(db)
