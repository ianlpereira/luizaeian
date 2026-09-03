"""
Lançamentos manuais: dinheiro que entrou fora do Mercado Pago.

Transferência bancária, Camicado, dinheiro em mãos. Nada disso passa por
webhook, então é o painel que registra — e por isso é a única escrita de
pagamento que aceita um valor arbitrário, em vez de derivá-lo de `gift.price`.

Um lançamento grava o mesmo par de linhas que um pagamento aprovado do MP:
`payments` guarda o dinheiro, `gift_purchases` guarda o vínculo com o convidado.
Assim o relatório unificado renderiza os dois casos com o mesmo código.

Só lançamento manual pode ser editado ou apagado. As linhas do Mercado Pago
espelham um sistema externo: mexer nelas aqui faria o painel divergir da
verdade que está lá.
"""

import html
import uuid
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.gift import Gift, GiftPurchase
from app.models.guest import Guest
from app.models.payment import Payment
from app.schemas.admin import AdminManualTransactionIn
from app.schemas.payment import MANUAL_METHODS

APPROVED = "approved"


async def _load_pair(db: AsyncSession, purchase_id: uuid.UUID) -> tuple[GiftPurchase, Payment]:
    """
    Devolve a compra e o pagamento do lançamento, recusando o que não for manual.

    Uma compra sem pagamento veio do endpoint público e também não é editável:
    não há valor para corrigir, e o vínculo com convidado já tem a tela de
    conciliação.
    """
    purchase = await db.get(GiftPurchase, purchase_id)
    if purchase is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Lançamento não encontrado."
        )

    payment = await db.get(Payment, purchase.payment_id) if purchase.payment_id else None
    if payment is None or payment.method not in MANUAL_METHODS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Só dá para editar lançamentos manuais.",
        )

    return purchase, payment


async def _validate_links(
    db: AsyncSession, gift_id: uuid.UUID | None, guest_id: uuid.UUID | None
) -> None:
    """Os dois são opcionais, mas se vierem preenchidos precisam existir."""
    if gift_id is not None and await db.get(Gift, gift_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Presente não encontrado."
        )

    if guest_id is not None and await db.get(Guest, guest_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Convidado não encontrado."
        )


def _clean_message(message: str | None) -> str | None:
    """
    Escapa igual ao POST /api/gifts/purchase — é o mesmo tipo de texto livre.

    Nome de convidado é a exceção deliberada do projeto (guest_service), mas
    aqui o comprador pode ser qualquer pessoa de fora da lista.
    """
    return html.escape(message) if message else None


async def create_manual_transaction(
    db: AsyncSession, payload: AdminManualTransactionIn
) -> GiftPurchase:
    await _validate_links(db, payload.gift_id, payload.guest_id)

    payment = Payment(
        gift_id=payload.gift_id,
        mp_payment_id=None,
        method=payload.method,
        status=APPROVED,
        # Decimal a partir de str: o float veio da borda da API e converter
        # direto arrastaria o erro binário para dentro do NUMERIC.
        amount=Decimal(str(payload.amount)),
        buyer_name=html.escape(payload.buyer_name),
        message=_clean_message(payload.message),
        created_at=payload.created_at,
    )
    db.add(payment)
    # Flush antes da compra: payment.id só nasce aqui (default Python-side do
    # UUIDMixin), e a FK precisa dele.
    await db.flush()

    purchase = GiftPurchase(
        gift_id=payload.gift_id,
        buyer_name=payment.buyer_name,
        message=payment.message,
        guest_id=payload.guest_id,
        payment_id=payment.id,
        created_at=payload.created_at,
    )
    db.add(purchase)
    await db.flush()
    return purchase


async def update_manual_transaction(
    db: AsyncSession, purchase_id: uuid.UUID, payload: AdminManualTransactionIn
) -> GiftPurchase:
    purchase, payment = await _load_pair(db, purchase_id)
    await _validate_links(db, payload.gift_id, payload.guest_id)

    buyer_name = html.escape(payload.buyer_name)
    message = _clean_message(payload.message)

    payment.gift_id = payload.gift_id
    payment.method = payload.method
    payment.amount = Decimal(str(payload.amount))
    payment.buyer_name = buyer_name
    payment.message = message
    payment.created_at = payload.created_at

    purchase.gift_id = payload.gift_id
    purchase.buyer_name = buyer_name
    purchase.message = message
    purchase.guest_id = payload.guest_id
    purchase.created_at = payload.created_at

    db.add_all([payment, purchase])
    await db.flush()
    return purchase


async def delete_manual_transaction(db: AsyncSession, purchase_id: uuid.UUID) -> None:
    """Apaga o par inteiro — deixar o pagamento órfão reviveria a linha no relatório."""
    purchase, payment = await _load_pair(db, purchase_id)

    await db.delete(purchase)
    # A compra sai primeiro: payments.id ainda é referenciado por ela.
    await db.flush()
    await db.delete(payment)
    await db.flush()
