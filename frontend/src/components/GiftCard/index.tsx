import type { Gift } from '@/types/gift'
import * as S from './styles'

interface GiftCardProps {
  gift: Gift
  onSelect: (gift: Gift) => void
}

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

/**
 * Card individual de presente.
 * Quando `purchased || stock_limit === 0`, exibe badge "Esgotado"
 * e desabilita o botão de compra.
 */
export function GiftCard({ gift, onSelect }: GiftCardProps) {
  const isUnavailable = gift.purchased || gift.stock_limit === 0

  return (
    <S.Card aria-disabled={isUnavailable}>
      <S.ImageWrapper>
        <img
          src={gift.image_url ?? '/images/gift-placeholder.webp'}
          alt={gift.title}
          loading="lazy"
          decoding="async"
        />
        {isUnavailable && <S.SoldOutBadge>Esgotado</S.SoldOutBadge>}
      </S.ImageWrapper>

      <S.Body>
        <S.Category>{gift.category}</S.Category>
        <S.Title>{gift.title}</S.Title>
        <S.Price>{formatBRL(gift.price)}</S.Price>

        <S.Button
          type="button"
          disabled={isUnavailable}
          onClick={() => !isUnavailable && onSelect(gift)}
          aria-label={isUnavailable ? `${gift.title} — esgotado` : `Presentear com ${gift.title}`}
        >
          {isUnavailable ? 'Esgotado' : 'Presentear 🎁'}
        </S.Button>
      </S.Body>
    </S.Card>
  )
}
