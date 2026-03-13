import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import confetti from 'canvas-confetti'
import { usePurchaseGift } from '@/hooks/useGifts'
import { checkoutSchema, type CheckoutFormValues } from './schema'
import { pixConfig } from '@/data/payment'
import * as S from './styles'
import type { Gift } from '@/types/gift'

interface CheckoutModalProps {
  gift: Gift
  onClose: () => void
}

type Step = 'form' | 'payment' | 'success'

const formatBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

/**
 * Modal de checkout de presente — fluxo em 2 etapas:
 *   Etapa 1 (form)     — Nome + mensagem para o casal
 *   Etapa 2 (payment)  — Instruções de pagamento via Pix (chave + QR code)
 *   Sucesso            — Confetes + confirmação
 *
 * A API é chamada apenas quando o usuário clica "Já paguei" na etapa 2,
 * registrando a compra somente após o pagamento ser realizado.
 */
export function CheckoutModal({ gift, onClose }: CheckoutModalProps) {
  const [step, setStep] = useState<Step>('form')
  const [copied, setCopied] = useState(false)
  const [formValues, setFormValues] = useState<CheckoutFormValues | null>(null)
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

  // Etapa 1 → 2: salva os dados do form e avança para o pagamento
  const onSubmitForm = (values: CheckoutFormValues) => {
    setFormValues(values)
    setStep('payment')
  }

  // Etapa 2: copia a chave Pix para a área de transferência
  const handleCopyKey = async () => {
    try {
      await navigator.clipboard.writeText(pixConfig.key)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback silencioso para browsers que bloqueiam clipboard
    }
  }

  // Etapa 2 → sucesso: chama a API e dispara confetes
  const handleConfirmPayment = () => {
    if (!formValues) return
    mutate(
      {
        gift_id: gift.id,
        buyer_name: formValues.buyer_name,
        message: formValues.message ?? undefined,
      },
      {
        onSuccess: () => {
          setStep('success')
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

  const stepIndex = step === 'form' ? 0 : step === 'payment' ? 1 : 2

  return (
    <S.Backdrop onClick={onClose} role="dialog" aria-modal="true" aria-label={`Presentear: ${gift.title}`}>
      <S.Dialog onClick={(e) => e.stopPropagation()}>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <S.Header>
          <div>
            <S.GiftName>{gift.title}</S.GiftName>
            <S.Price>{formatBRL(gift.price)}</S.Price>
          </div>
          <S.CloseButton onClick={onClose} aria-label="Fechar modal">×</S.CloseButton>
        </S.Header>

        {/* ── Progress dots ────────────────────────────────────────────── */}
        {step !== 'success' && (
          <S.ProgressDots aria-label={`Etapa ${stepIndex + 1} de 2`}>
            <S.Dot $active={step === 'form'} $done={stepIndex > 0} />
            <S.DotLine />
            <S.Dot $active={step === 'payment'} $done={stepIndex > 1} />
          </S.ProgressDots>
        )}

        {/* ── Etapa 1: Formulário ──────────────────────────────────────── */}
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
              Continuar para pagamento →
            </S.SubmitButton>
          </S.Form>
        )}

        {/* ── Etapa 2: Pagamento via Pix ───────────────────────────────── */}
        {step === 'payment' && (
          <>
            {/* Preview do presente escolhido */}
            <S.GiftPreview>
              <S.GiftPreviewImg
                src={gift.image_url ?? '/images/gift-placeholder.webp'}
                alt={gift.title}
                loading="lazy"
              />
              <S.GiftPreviewInfo>
                <S.GiftPreviewName>{gift.title}</S.GiftPreviewName>
                <S.GiftPreviewPrice>{formatBRL(gift.price)}</S.GiftPreviewPrice>
              </S.GiftPreviewInfo>
            </S.GiftPreview>

            <S.PaymentBox>
              <S.PaymentTitle>
                Faça um Pix no valor de <strong>{formatBRL(gift.price)}</strong>
              </S.PaymentTitle>

              {/* QR code ou placeholder */}
              <S.QrWrapper>
                {pixConfig.qrCodeUrl ? (
                  <img src={pixConfig.qrCodeUrl} alt="QR Code Pix" />
                ) : (
                  <S.QrPlaceholder>
                    📲
                  </S.QrPlaceholder>
                )}
              </S.QrWrapper>

              {/* Chave Pix copiável */}
              <S.PixKeyBox>
                <S.PixKeyLabel>Chave Pix</S.PixKeyLabel>
                <S.PixKeyValue>{pixConfig.key}</S.PixKeyValue>
                <S.CopyButton
                  type="button"
                  $copied={copied}
                  onClick={handleCopyKey}
                  aria-label="Copiar chave Pix"
                >
                  {copied ? '✓ Copiado' : 'Copiar'}
                </S.CopyButton>
              </S.PixKeyBox>

              <S.PaymentHint>
                Favorecido: <strong>{pixConfig.holderName}</strong>
                {pixConfig.bank ? ` · ${pixConfig.bank}` : ''}
                <br />
                Após pagar, clique em "Já paguei" para confirmar o presente.
              </S.PaymentHint>
            </S.PaymentBox>

            {error && (
              <S.ErrorBanner role="alert">
                Ops! Não foi possível registrar o presente. Tente novamente.
              </S.ErrorBanner>
            )}

            <S.ConfirmButton
              type="button"
              disabled={isPending}
              onClick={handleConfirmPayment}
            >
              {isPending ? 'Confirmando…' : 'Já paguei ✓'}
            </S.ConfirmButton>

            <S.BackButton type="button" onClick={() => setStep('form')}>
              ← Voltar e editar dados
            </S.BackButton>
          </>
        )}

        {/* ── Sucesso ──────────────────────────────────────────────────── */}
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
  )

    // Render dentro de um portal para evitar que transform/overflow de ancestrais
    // impeça o Backdrop de cobrir toda a viewport (problema comum em mobile).
    if (typeof document !== 'undefined') {
      return createPortal(
        (
          <S.Backdrop onClick={onClose} role="dialog" aria-modal="true" aria-label={`Presentear: ${gift.title}`}>
            <S.Dialog onClick={(e) => e.stopPropagation()}>
              {/* ── Header ──────────────────────────────────────────────────── */}
              <S.Header>
                <div>
                  <S.GiftName>{gift.title}</S.GiftName>
                  <S.Price>{formatBRL(gift.price)}</S.Price>
                </div>
                <S.CloseButton onClick={onClose} aria-label="Fechar modal">×</S.CloseButton>
              </S.Header>

              {/* ── Progress dots ────────────────────────────────────────────── */}
              {step !== 'success' && (
                <S.ProgressDots aria-label={`Etapa ${stepIndex + 1} de 2`}>
                  <S.Dot $active={step === 'form'} $done={stepIndex > 0} />
                  <S.DotLine />
                  <S.Dot $active={step === 'payment'} $done={stepIndex > 1} />
                </S.ProgressDots>
              )}

              {/* ── Etapa 1: Formulário ──────────────────────────────────────── */}
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
                    Continuar para pagamento →
                  </S.SubmitButton>
                </S.Form>
              )}

              {/* ── Etapa 2: Pagamento via Pix ───────────────────────────────── */}
              {step === 'payment' && (
                <>
                  {/* Preview do presente escolhido */}
                  <S.GiftPreview>
                    <S.GiftPreviewImg
                      src={gift.image_url ?? '/images/gift-placeholder.webp'}
                      alt={gift.title}
                      loading="lazy"
                    />
                    <S.GiftPreviewInfo>
                      <S.GiftPreviewName>{gift.title}</S.GiftPreviewName>
                      <S.GiftPreviewPrice>{formatBRL(gift.price)}</S.GiftPreviewPrice>
                    </S.GiftPreviewInfo>
                  </S.GiftPreview>

                  <S.PaymentBox>
                    <S.PaymentTitle>
                      Faça um Pix no valor de <strong>{formatBRL(gift.price)}</strong>
                    </S.PaymentTitle>

                    {/* QR code ou placeholder */}
                    <S.QrWrapper>
                      {pixConfig.qrCodeUrl ? (
                        <img src={pixConfig.qrCodeUrl} alt="QR Code Pix" />
                      ) : (
                        <S.QrPlaceholder>
                          📲
                        </S.QrPlaceholder>
                      )}
                    </S.QrWrapper>

                    {/* Chave Pix copiável */}
                    <S.PixKeyBox>
                      <S.PixKeyLabel>Chave Pix</S.PixKeyLabel>
                      <S.PixKeyValue>{pixConfig.key}</S.PixKeyValue>
                      <S.CopyButton
                        type="button"
                        $copied={copied}
                        onClick={handleCopyKey}
                        aria-label="Copiar chave Pix"
                      >
                        {copied ? '✓ Copiado' : 'Copiar'}
                      </S.CopyButton>
                    </S.PixKeyBox>

                    <S.PaymentHint>
                      Favorecido: <strong>{pixConfig.holderName}</strong>
                      {pixConfig.bank ? ` · ${pixConfig.bank}` : ''}
                      <br />
                      Após pagar, clique em "Já paguei" para confirmar o presente.
                    </S.PaymentHint>
                  </S.PaymentBox>

                  {error && (
                    <S.ErrorBanner role="alert">
                      Ops! Não foi possível registrar o presente. Tente novamente.
                    </S.ErrorBanner>
                  )}

                  <S.ConfirmButton
                    type="button"
                    disabled={isPending}
                    onClick={handleConfirmPayment}
                  >
                    {isPending ? 'Confirmando…' : 'Já paguei ✓'}
                  </S.ConfirmButton>

                  <S.BackButton type="button" onClick={() => setStep('form')}>
                    ← Voltar e editar dados
                  </S.BackButton>
                </>
              )}

              {/* ── Sucesso ──────────────────────────────────────────────────── */}
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

    return null
}
