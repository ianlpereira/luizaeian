import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import confetti from 'canvas-confetti'
import { usePurchaseGift } from '@/hooks/useGifts'
import { checkoutSchema, type CheckoutFormValues } from './schema'
import * as S from './styles'
import type { Gift } from '@/types/gift'

interface CheckoutModalProps {
  gift: Gift
  onClose: () => void
}

const formatBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

/**
 * Modal de checkout de presente.
 * - Formulário: nome (obrigatório) + mensagem (opcional) validados via Zod
 * - Sucesso: confetes + estado visual por 2.5s → fecha automaticamente
 * - Erro: banner vermelho com mensagem
 * - Bloqueia scroll do body enquanto aberto
 * - Fecha ao clicar no backdrop ou pressionar Esc
 */
export function CheckoutModal({ gift, onClose }: CheckoutModalProps) {
  const [succeeded, setSucceeded] = useState(false)
  const { mutate, isPending, error } = usePurchaseGift()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormValues>({ resolver: zodResolver(checkoutSchema) })

  // Bloqueia scroll do body enquanto o modal está aberto
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Fecha ao pressionar Esc
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const onSubmit = (values: CheckoutFormValues) => {
    mutate(
      { gift_id: gift.id, buyer_name: values.buyer_name, message: values.message ?? undefined },
      {
        onSuccess: () => {
          setSucceeded(true)
          confetti({
            particleCount: 140,
            spread: 80,
            origin: { y: 0.55 },
            colors: ['#c9a96e', '#e8b4b8', '#f5f0e8', '#ffffff'],
          })
          setTimeout(onClose, 2500)
        },
      },
    )
  }

  return (
    <S.Backdrop onClick={onClose} role="dialog" aria-modal="true" aria-label={`Presentear: ${gift.title}`}>
      {/* stopPropagation evita que clicar no diálogo feche o modal */}
      <S.Dialog onClick={(e) => e.stopPropagation()}>

        <S.Header>
          <div>
            <S.GiftName>{gift.title}</S.GiftName>
            <S.Price>{formatBRL(gift.price)}</S.Price>
          </div>
          <S.CloseButton onClick={onClose} aria-label="Fechar modal">×</S.CloseButton>
        </S.Header>

        {succeeded ? (
          <S.SuccessBox>
            <S.SuccessIcon>🎉</S.SuccessIcon>
            <S.SuccessText>Presente registrado!</S.SuccessText>
            <S.SuccessSubtext>
              Luiza &amp; Ian agradecem seu carinho 💍
            </S.SuccessSubtext>
          </S.SuccessBox>
        ) : (
          <S.Form onSubmit={handleSubmit(onSubmit)} noValidate>
            {error && (
              <S.ErrorBanner role="alert">
                Ops! Não foi possível registrar o presente. Tente novamente.
              </S.ErrorBanner>
            )}

            <S.Field>
              <label htmlFor="buyer_name">Seu nome *</label>
              <input
                id="buyer_name"
                type="text"
                placeholder="Nome completo"
                autoComplete="name"
                {...register('buyer_name')}
              />
              {errors.buyer_name && (
                <S.ErrorMsg role="alert">{errors.buyer_name.message}</S.ErrorMsg>
              )}
            </S.Field>

            <S.Field>
              <label htmlFor="message">Mensagem para o casal</label>
              <textarea
                id="message"
                placeholder="Escreva uma mensagem carinhosa... (opcional)"
                {...register('message')}
              />
              {errors.message && (
                <S.ErrorMsg role="alert">{errors.message.message}</S.ErrorMsg>
              )}
            </S.Field>

            <S.SubmitButton type="submit" disabled={isPending}>
              {isPending ? 'Enviando…' : 'Confirmar presente 🎁'}
            </S.SubmitButton>
          </S.Form>
        )}
      </S.Dialog>
    </S.Backdrop>
  )
}
