"""
Ações do relatório unificado que valem para pagamentos do Mercado Pago — a
metade que `manual_transaction_service` recusa de propósito.

Não existe edição livre de status aqui: a única forma de corrigir um Pix que
foi pago mas ficou pendente no painel é reconciliar com a verdade que está no
Mercado Pago (`reconcile_payment`), igual ao polling do checkout já faz.
Apagar só vale para pagamento pendente que nunca virou compra — aprovado é
histórico financeiro, e a linha só existe órfã porque a compra ainda não
aconteceu.
"""

import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payment import Payment
from app.schemas.payment import MANUAL_METHODS
from app.services import payment_service

PENDING = "pending"


async def reconcile_payment(db: AsyncSession, payment_id: uuid.UUID) -> Payment:
    """
    Reconsulta o Mercado Pago pelo `mp_payment_id` e aplica o mesmo caminho do
    polling do checkout (`payment_service.get_payment_status`): sincroniza o
    status e, se aprovado, registra a compra que ainda não existir.

    Cobre o caso comum do Pix — o comprador paga pelo banco e nunca volta à
    tela de checkout, então nem o webhook nem o polling do comprador chegam a
    rodar de novo.
    """
    payment = await db.get(Payment, payment_id)
    if payment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Pagamento não encontrado."
        )
    if payment.method in MANUAL_METHODS or payment.mp_payment_id is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Lançamento manual não tem o que sincronizar com o Mercado Pago.",
        )

    await payment_service.get_payment_status(payment.id, db)
    await db.refresh(payment)
    return payment


async def delete_orphan_payment(db: AsyncSession, payment_id: uuid.UUID) -> None:
    """
    Apaga um pagamento pendente que nunca virou compra.

    Só pendente: aprovado, recusado, cancelado ou expirado já são fato
    consumado do Mercado Pago, e apagar aqui não desfaz nada lá.
    """
    payment = await db.get(Payment, payment_id)
    if payment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Pagamento não encontrado."
        )
    if payment.status != PENDING:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Só dá para apagar pagamentos pendentes.",
        )

    await db.delete(payment)
    await db.flush()
