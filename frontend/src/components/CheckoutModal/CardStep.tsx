/**
 * CardStep — Etapa de pagamento com Cartão de Crédito.
 *
 * Usa o Brick "cardPayment" do Mercado Pago para tokenizar o cartão
 * diretamente no browser. O servidor nunca recebe dados do cartão —
 * apenas o card_token gerado pelo SDK do MP.
 *
 * Fluxo:
 *  1. Carrega o SDK do MP via loadMercadoPago() (lazy, uma vez por sessão)
 *  2. Instancia o Brick no container #cardPaymentBrick_container
 *  3. O callback onSubmit recebe o formData tokenizado e chama onPay()
 *  4. Destrói o Brick ao desmontar para evitar leaks de memória
 */

import { useEffect, useRef, useState } from 'react'
import { getMpPublicKey } from '@/lib/api'
import { loadMercadoPago } from '@/lib/loadMercadoPago'
import type { CardPaymentBrickController, CardPaymentFormData } from '@/lib/loadMercadoPago'
import type { CreatePaymentPayload } from '@/types/payment'
import * as S from './styles'

const BRICK_CONTAINER_ID = 'cardPaymentBrick_container'

interface CardStepProps {
  giftId: string
  giftTitle: string
  giftPrice: number
  buyerName: string
  payerEmail: string
  message?: string
  onPay: (payload: CreatePaymentPayload) => void
  onBack: () => void
  isPending: boolean
  errorMsg?: string | null
}

export function CardStep({
  giftId,
  giftTitle,
  giftPrice,
  buyerName,
  payerEmail,
  message,
  onPay,
  onBack,
  isPending,
  errorMsg,
}: CardStepProps) {
  const brickRef = useRef<CardPaymentBrickController | null>(null)
  const [sdkError, setSdkError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function initBrick() {
      try {
        // 1. Busca a chave pública do backend
        const { public_key } = await getMpPublicKey()

        // 2. Carrega o SDK do MP (lazy — só baixa o script uma vez)
        const mp = await loadMercadoPago(public_key)

        if (cancelled) return

        // 3. Instancia o Brick de cartão
        const controller = await mp.bricks().create(
          'cardPayment',
          BRICK_CONTAINER_ID,
          {
            initialization: {
              amount: giftPrice,
              payer: { email: payerEmail },
            },
            customization: {
              visual: { hideFormTitle: true },
              paymentMethods: { maxInstallments: 12, minInstallments: 1 },
            },
            callbacks: {
              onReady: () => setLoading(false),
              onError: (err) => {
                console.error('[MP Brick] erro:', err)
                setSdkError('Erro ao carregar formulário de pagamento. Tente novamente.')
                setLoading(false)
              },
              onSubmit: async (formData: CardPaymentFormData) => {
                onPay({
                  gift_id: giftId,
                  buyer_name: buyerName,
                  payer_email: payerEmail,
                  message,
                  method: 'credit_card',
                  card_token: formData.token,
                  installments: formData.installments,
                  payment_method_id: formData.payment_method_id,
                  issuer_id: formData.issuer_id,
                })
              },
            },
          },
        )

        if (!cancelled) {
          brickRef.current = controller
        } else {
          controller.unmount()
        }
      } catch (err) {
        if (!cancelled) {
          setSdkError('Não foi possível carregar o pagamento com cartão. Tente o Pix.')
          setLoading(false)
          console.error('[MP Brick] falha na inicialização:', err)
        }
      }
    }

    initBrick()

    return () => {
      cancelled = true
      if (brickRef.current) {
        brickRef.current.unmount()
        brickRef.current = null
      }
    }
  }, [giftId, giftPrice, buyerName, payerEmail, message, onPay])

  return (
    <>
      {/* Preview do presente */}
      <S.GiftPreview>
        <S.GiftPreviewInfo>
          <S.GiftPreviewName>{giftTitle}</S.GiftPreviewName>
          <S.GiftPreviewPrice>
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
              giftPrice,
            )}
          </S.GiftPreviewPrice>
        </S.GiftPreviewInfo>
      </S.GiftPreview>

      {/* Erro de SDK */}
      {sdkError && (
        <S.ErrorBanner role="alert">{sdkError}</S.ErrorBanner>
      )}

      {/* Erro de pagamento recusado */}
      {errorMsg && !sdkError && (
        <S.ErrorBanner role="alert">
          {errorMsg === 'cc_rejected_bad_filled_security_code'
            ? 'CVV inválido. Verifique o código de segurança do cartão.'
            : errorMsg === 'cc_rejected_insufficient_amount'
              ? 'Saldo insuficiente. Tente outro cartão.'
              : errorMsg === 'cc_rejected_blacklist'
                ? 'Cartão não autorizado. Tente outro.'
                : `Pagamento não aprovado: ${errorMsg}`}
        </S.ErrorBanner>
      )}

      {/* Loading skeleton enquanto o Brick não carregou */}
      {loading && !sdkError && (
        <S.BrickSkeleton aria-busy="true" aria-label="Carregando formulário de pagamento…" />
      )}

      {/* Container do MP Brick com overlay durante processamento */}
      <div style={{ position: 'relative' }}>
        <div
          id={BRICK_CONTAINER_ID}
          style={{ minHeight: loading ? 0 : undefined }}
          aria-label="Formulário de pagamento com cartão"
        />
        {isPending && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(255,255,255,0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              zIndex: 10,
              fontSize: '0.95rem',
              color: '#555',
              gap: '8px',
            }}
            aria-live="polite"
          >
            ⏳ Processando pagamento…
          </div>
        )}
      </div>

      {/* Botão desabilitado durante processamento */}
      {isPending && (
        <S.ConfirmButton type="button" disabled>
          Processando pagamento…
        </S.ConfirmButton>
      )}

      <S.BackButton type="button" onClick={onBack} disabled={isPending}>
        ← Voltar e escolher outro método
      </S.BackButton>
    </>
  )
}
