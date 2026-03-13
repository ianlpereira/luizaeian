import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import confetti from 'canvas-confetti'
import { useCreatePayment } from '@/hooks/usePayment'
import { checkoutSchema, type CheckoutFormValues, type PaymentMethodChoice } from './schema'
import { PixStep } from './PixStep'
import { CardStep } from './CardStep'
import * as S from './styles'
import type { Gift } from '@/types/gift'
import type { CreatePaymentResponse } from '@/types/payment'

interface CheckoutModalProps {
  gift: Gift
  onClose: () => void
}

type Step = 'form' | 'method' | 'pix' | 'card' | 'success'

const formatBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

/**
 * Modal de checkout — fluxo em 4 etapas:
 *   1. form    — Nome + mensagem para o casal
 *   2. method  — Escolha do método: Pix ou Cartão de Crédito
 *   3a. pix    — QR code dinâmico + polling automático (sem "Já paguei")
 *   3b. card   — MP Brick de cartão de crédito (tokenização no browser)
 *   4. success — Confetes + confirmação
 *
 * Segurança:
 * - Cartão: dados tokenizados pelo MP Brick — servidor recebe apenas o card_token
 * - Pix: QR code gerado por transação com expiração de 30 min
 * - Presente marcado como comprado SOMENTE após webhook do MP confirmar
 */
export function CheckoutModal({ gift, onClose }: CheckoutModalProps) {
  const [step, setStep] = useState<Step>('form')
  const [formValues, setFormValues] = useState<CheckoutFormValues | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodChoice>('pix')
  const [paymentData, setPaymentData] = useState<CreatePaymentResponse | null>(null)
  const [cardError, setCardError] = useState<string | null>(null)

  const { mutate: createPayment, isPending } = useCreatePayment()

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

  // Dispara confetes e fecha o modal após sucesso
  const handleSuccess = () => {
    setStep('success')
    confetti({
      particleCount: 140,
      spread: 80,
      origin: { y: 0.55 },
      colors: ['#c9a96e', '#e8b4b8', '#f5f0e8', '#ffffff'],
    })
    setTimeout(onClose, 2500)
  }

  // Etapa 1 → 2
  const onSubmitForm = (values: CheckoutFormValues) => {
    setFormValues(values)
    setStep('method')
  }

  // Etapa 2 → 3 (Pix): cria o pagamento Pix e avança
  const handleConfirmMethod = () => {
    if (!formValues) return
    if (selectedMethod === 'pix') {
      createPayment(
        {
          gift_id: gift.id,
          buyer_name: formValues.buyer_name,
          payer_email: formValues.payer_email,
          message: formValues.message || undefined,
          method: 'pix',
        },
        {
          onSuccess: (data) => {
            setPaymentData(data)
            setStep('pix')
          },
        },
      )
    } else {
      setStep('card')
    }
  }

  // Etapa card → API (chamado pelo CardStep via onPay)
  const handleCardPay = (payload: Parameters<typeof createPayment>[0]) => {
    setCardError(null)
    createPayment(payload, {
      onSuccess: (data) => {
        if (data.status === 'approved') {
          handleSuccess()
        } else if (data.status === 'rejected') {
          setCardError(data.detail ?? 'Pagamento recusado. Tente outro cartão.')
        }
        // pending/in_process: aguarda webhook (raro para cartão)
      },
      onError: (err) => {
        setCardError((err as Error).message ?? 'Erro ao processar pagamento.')
      },
    })
  }

  // Regenerar QR code: volta para método e recria
  const handleRegenerateQr = () => {
    setPaymentData(null)
    setStep('method')
  }

  // Cálculo do índice de progresso para os dots (etapas visíveis: form → method → payment)
  const stepIndex = step === 'form' ? 0 : step === 'method' ? 1 : step === 'success' ? 3 : 2

  if (typeof document === 'undefined') return null

  return createPortal(
    (
      <S.Backdrop onClick={onClose} role="dialog" aria-modal="true" aria-label={`Presentear: ${gift.title}`}>
        <S.Dialog onClick={(e) => e.stopPropagation()}>

          {/* ── Header ────────────────────────────────────────────────── */}
          <S.Header>
            <div>
              <S.GiftName>{gift.title}</S.GiftName>
              <S.Price>{formatBRL(gift.price)}</S.Price>
            </div>
            <S.CloseButton onClick={onClose} aria-label="Fechar modal">×</S.CloseButton>
          </S.Header>

          {/* ── Progress dots (3 etapas visíveis) ─────────────────────── */}
          {step !== 'success' && (
            <S.ProgressDots aria-label={`Etapa ${stepIndex + 1} de 3`}>
              <S.Dot $active={step === 'form'} $done={stepIndex > 0} />
              <S.DotLine />
              <S.Dot $active={step === 'method'} $done={stepIndex > 1} />
              <S.DotLine />
              <S.Dot $active={step === 'pix' || step === 'card'} $done={stepIndex > 2} />
            </S.ProgressDots>
          )}

          {/* ── Etapa 1: Formulário ────────────────────────────────────── */}
          {step === 'form' && (
            <S.Form onSubmit={handleSubmit(onSubmitForm)} noValidate>
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
                <label htmlFor="payer_email">Seu e-mail *</label>
                <input
                  id="payer_email"
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  {...register('payer_email')}
                />
                {errors.payer_email && (
                  <S.ErrorMsg role="alert">{errors.payer_email.message}</S.ErrorMsg>
                )}
              </S.Field>

              <S.Field>
                <label htmlFor="message">Mensagem para o casal</label>
                <textarea
                  id="message"
                  placeholder="Escreva uma mensagem carinhosa… (opcional)"
                  {...register('message')}
                />
                {errors.message && (
                  <S.ErrorMsg role="alert">{errors.message.message}</S.ErrorMsg>
                )}
              </S.Field>

              <S.SubmitButton type="submit">
                Continuar →
              </S.SubmitButton>
            </S.Form>
          )}

          {/* ── Etapa 2: Escolha do método de pagamento ─────────────────── */}
          {step === 'method' && (
            <>
              <S.MethodGrid>
                <S.MethodCard
                  type="button"
                  $selected={selectedMethod === 'pix'}
                  onClick={() => setSelectedMethod('pix')}
                  aria-pressed={selectedMethod === 'pix'}
                >
                  <S.MethodIcon>📲</S.MethodIcon>
                  <S.MethodLabel>Pix</S.MethodLabel>
                  <S.MethodSub>Instantâneo · gratuito</S.MethodSub>
                </S.MethodCard>

                <S.MethodCard
                  type="button"
                  $selected={selectedMethod === 'credit_card'}
                  onClick={() => setSelectedMethod('credit_card')}
                  aria-pressed={selectedMethod === 'credit_card'}
                >
                  <S.MethodIcon>💳</S.MethodIcon>
                  <S.MethodLabel>Cartão</S.MethodLabel>
                  <S.MethodSub>Crédito · até 12x</S.MethodSub>
                </S.MethodCard>
              </S.MethodGrid>

              <S.MethodContinueButton
                type="button"
                disabled={isPending}
                onClick={handleConfirmMethod}
              >
                {isPending ? 'Gerando pagamento…' : `Pagar com ${selectedMethod === 'pix' ? 'Pix' : 'Cartão'} →`}
              </S.MethodContinueButton>

              <S.BackButton type="button" onClick={() => setStep('form')}>
                ← Voltar e editar dados
              </S.BackButton>
            </>
          )}

          {/* ── Etapa 3a: Pix Dinâmico ────────────────────────────────── */}
          {step === 'pix' && paymentData && (
            <PixStep
              paymentData={paymentData}
              giftTitle={gift.title}
              giftPrice={gift.price}
              onSuccess={handleSuccess}
              onBack={() => setStep('method')}
              onRegenerateQr={handleRegenerateQr}
            />
          )}

          {/* ── Etapa 3b: Cartão (MP Brick) ───────────────────────────── */}
          {step === 'card' && formValues && (
            <CardStep
              giftId={gift.id}
              giftTitle={gift.title}
              giftPrice={gift.price}
              buyerName={formValues.buyer_name}
              message={formValues.message || undefined}
              onPay={handleCardPay}
              onBack={() => setStep('method')}
              isPending={isPending}
              errorMsg={cardError}
            />
          )}

          {/* ── Sucesso ───────────────────────────────────────────────── */}
          {step === 'success' && (
            <S.SuccessBox>
              <S.SuccessIcon>🎉</S.SuccessIcon>
              <S.SuccessText>Presente confirmado!</S.SuccessText>
              <S.SuccessSubtext>
                Luiza &amp; Ian agradecem seu carinho 💍
              </S.SuccessSubtext>
            </S.SuccessBox>
          )}

        </S.Dialog>
      </S.Backdrop>
    ),
    document.body,
  )
}
