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
    AdminGiftLedgerOut,
    AdminGiftLedgerRow,
    AdminGiftPurchaseMatchesOut,
    AdminGiftPurchaseRow,
    AdminGiftPurchaseUpdateIn,
    AdminGiftsOut,
    AdminGuestCreateIn,
    AdminGuestRow,
    AdminGuestsOut,
    AdminGuestUpdateIn,
    AdminLoginIn,
    AdminManualTransactionIn,
    AdminMeOut,
    AdminRsvpMatchesOut,
    AdminRsvpsOut,
    AdminTokenOut,
)
from app.services import (
    admin_report_service,
    gift_ledger_service,
    gift_purchase_service,
    guest_service,
    manual_transaction_service,
)

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


@router.get("/gift-ledger", response_model=AdminGiftLedgerOut)
async def gift_ledger_report(
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_admin),
) -> AdminGiftLedgerOut:
    """
    Compras e pagamentos numa lista só: uma linha por transação, com valor,
    status do Mercado Pago e o convidado vinculado quando existe.
    """
    return await admin_report_service.get_gift_ledger_report(db)


# Precisa vir antes de /gift-purchases/{purchase_id}, pelo mesmo motivo de
# /guests/rsvp-matches: "matches" seria lido como UUID e devolveria 422.
@router.get("/gift-purchases/matches", response_model=AdminGiftPurchaseMatchesOut)
async def gift_purchase_matches(
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_admin),
) -> AdminGiftPurchaseMatchesOut:
    """Sugestões de vínculo entre compras de presente e a lista de convidados."""
    return await gift_purchase_service.get_gift_purchase_matches(db)


# ── Lançamentos manuais ───────────────────────────────────────────────────────
#
# Dinheiro que entrou fora do Mercado Pago. Devolvem uma linha no formato do
# relatório unificado, para a tabela atualizar sem refazer a listagem inteira.

@router.post(
    "/manual-transactions",
    response_model=AdminGiftLedgerRow,
    status_code=status.HTTP_201_CREATED,
)
async def create_manual_transaction(
    payload: AdminManualTransactionIn,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_admin),
) -> AdminGiftLedgerRow:
    """Registra uma transferência, compra na Camicado ou entrega em dinheiro."""
    purchase = await manual_transaction_service.create_manual_transaction(db, payload)
    return await admin_report_service.get_gift_ledger_row(db, purchase.id)


@router.patch("/manual-transactions/{purchase_id}", response_model=AdminGiftLedgerRow)
async def update_manual_transaction(
    purchase_id: uuid.UUID,
    payload: AdminManualTransactionIn,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_admin),
) -> AdminGiftLedgerRow:
    """Corrige um lançamento manual. Recusa qualquer linha vinda do Mercado Pago."""
    await manual_transaction_service.update_manual_transaction(db, purchase_id, payload)
    return await admin_report_service.get_gift_ledger_row(db, purchase_id)


@router.delete("/manual-transactions/{purchase_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_manual_transaction(
    purchase_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_admin),
) -> None:
    """Apaga o lançamento inteiro — a compra e o pagamento que a acompanha."""
    await manual_transaction_service.delete_manual_transaction(db, purchase_id)


@router.post("/payments/{payment_id}/reconcile", response_model=AdminGiftLedgerRow)
async def reconcile_payment(
    payment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_admin),
) -> AdminGiftLedgerRow:
    """Reconsulta o Mercado Pago e sincroniza o status local — corrige Pix que ficou preso."""
    await gift_ledger_service.reconcile_payment(db, payment_id)
    return await admin_report_service.get_gift_ledger_row_for_payment(db, payment_id)


@router.delete("/payments/{payment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pending_payment(
    payment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_admin),
) -> None:
    """Apaga um pagamento do Mercado Pago ainda pendente que nunca virou compra."""
    await gift_ledger_service.delete_orphan_payment(db, payment_id)


@router.patch("/gift-purchases/{purchase_id}", response_model=AdminGiftPurchaseRow)
async def update_gift_purchase(
    purchase_id: uuid.UUID,
    payload: AdminGiftPurchaseUpdateIn,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_admin),
) -> AdminGiftPurchaseRow:
    """Vincula ou desvincula uma compra de presente a um convidado."""
    await gift_purchase_service.update_gift_purchase(db, purchase_id, payload)
    return await admin_report_service.get_gift_purchase_row(db, purchase_id)
