/**
 * PixStep — Etapa de pagamento via Pix Dinâmico.
 *
 * Responsabilidades:
 * - Exibir QR code (imagem Base64) e chave copia-e-cola (payload EMV)
 * - Countdown regressivo de 30 minutos
 * - Polling a cada 5 s via usePaymentStatus — avança para sucesso automaticamente
 * - Botão "Gerar novo QR code" ao expirar
 * - SEM botão "Já paguei" — confirmação é automática via webhook + polling
 */

import { useEffect, useState, useCallback } from 'react'
import { usePaymentStatus } from '@/hooks/usePayment'
import type { CreatePaymentResponse } from '@/types/payment'
import * as S from './styles'

interface PixStepProps {
  paymentData: CreatePaymentResponse
  giftTitle: string
  giftPrice: number
  onSuccess: () => void
  onBack: () => void
  onRegenerateQr: () => void
}

const formatBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function PixStep({
  paymentData,
  giftTitle,
  giftPrice,
  onSuccess,
  onBack,
  onRegenerateQr,
}: PixStepProps) {
  const [copied, setCopied] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    if (!paymentData.expires_at) return 30 * 60
    const diff = Math.floor(
      (new Date(paymentData.expires_at).getTime() - Date.now()) / 1000,
    )
    return Math.max(diff, 0)
  })
  const isExpired = secondsLeft <= 0

  // Polling de status — encerra quando pago ou expirado
  const { data: statusData } = usePaymentStatus(
    paymentData.payment_id,
    !isExpired,
  )

  // Avança para sucesso automaticamente ao aprovar
  useEffect(() => {
    if (statusData?.paid) {
      onSuccess()
    }
  }, [statusData?.paid, onSuccess])

  // Countdown regressivo
  useEffect(() => {
    if (secondsLeft <= 0) return
    const id = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [secondsLeft])

  const handleCopy = useCallback(async () => {
    if (!paymentData.qr_code) return
    try {
      await navigator.clipboard.writeText(paymentData.qr_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // fallback silencioso
    }
  }, [paymentData.qr_code])

  return (
    <>
      {/* Preview do presente */}
      <S.GiftPreview>
        <S.GiftPreviewInfo>
          <S.GiftPreviewName>{giftTitle}</S.GiftPreviewName>
          <S.GiftPreviewPrice>{formatBRL(giftPrice)}</S.GiftPreviewPrice>
        </S.GiftPreviewInfo>
      </S.GiftPreview>

      <S.PaymentBox>
        <S.PaymentTitle>
          {isExpired
            ? 'QR Code expirado'
            : <>Escaneie o QR Code para pagar <strong>{formatBRL(giftPrice)}</strong></>
          }
        </S.PaymentTitle>

        {/* QR Code */}
        <S.QrWrapper>
          {paymentData.qr_code_base64 ? (
            <img
              src={`data:image/png;base64,${paymentData.qr_code_base64}`}
              alt="QR Code Pix"
              style={{ opacity: isExpired ? 0.3 : 1, transition: 'opacity 300ms' }}
            />
          ) : (
            <S.QrPlaceholder>📲</S.QrPlaceholder>
          )}
        </S.QrWrapper>

        {/* Countdown */}
        {!isExpired && (
          <S.PixCountdown $warning={secondsLeft < 120}>
            ⏱ Expira em {formatCountdown(secondsLeft)}
          </S.PixCountdown>
        )}

        {/* Chave copia-e-cola */}
        {!isExpired && paymentData.qr_code && (
          <S.PixKeyBox>
            <S.PixKeyLabel>Copia e cola</S.PixKeyLabel>
            <S.PixKeyValue>{paymentData.qr_code.slice(0, 48)}…</S.PixKeyValue>
            <S.CopyButton
              type="button"
              $copied={copied}
              onClick={handleCopy}
              aria-label="Copiar código Pix"
            >
              {copied ? '✓ Copiado' : 'Copiar'}
            </S.CopyButton>
          </S.PixKeyBox>
        )}

        {/* Polling indicator */}
        {!isExpired && (
          <S.PaymentHint>
            Aguardando confirmação do pagamento…
            <br />
            A tela avança automaticamente após o pagamento ser detectado.
          </S.PaymentHint>
        )}
      </S.PaymentBox>

      {/* Expirado: botão regenerar */}
      {isExpired && (
        <>
          <S.ErrorBanner role="alert">
            O QR Code expirou. Gere um novo para continuar.
          </S.ErrorBanner>
          <S.ConfirmButton type="button" onClick={onRegenerateQr}>
            Gerar novo QR Code
          </S.ConfirmButton>
        </>
      )}

      <S.BackButton type="button" onClick={onBack}>
        ← Voltar e editar dados
      </S.BackButton>
    </>
  )
}
