/**
 * useInstallments — busca as opções de parcelamento do Mercado Pago
 * para um determinado valor, usando o SDK do MP client-side.
 *
 * Usa o BIN de cartão de crédito genérico para obter as parcelas disponíveis
 * sem precisar do número do cartão completo. Isso serve para exibir
 * uma pré-visualização das parcelas antes do usuário digitar o cartão.
 *
 * Estratégia: usa BIN fictício de Visa (411111) que o MP aceita para
 * consultas de parcelamento em ambiente de preview.
 */

import { useEffect, useState } from 'react'
import { getMpPublicKey } from '@/lib/api'
import { loadMercadoPago, type InstallmentOption } from '@/lib/loadMercadoPago'

// BIN genérico de Visa usado apenas para buscar tabela de parcelas
const PREVIEW_BIN = '411111'

export interface UseInstallmentsResult {
  installments: InstallmentOption[]
  loading: boolean
  error: string | null
}

export function useInstallments(amount: number): UseInstallmentsResult {
  const [installments, setInstallments] = useState<InstallmentOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!amount || amount <= 0) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function fetchInstallments() {
      try {
        setLoading(true)
        setError(null)

        const { public_key } = await getMpPublicKey()
        const mp = await loadMercadoPago(public_key)

        const results = await mp.getInstallments({
          amount: String(amount),
          bin: PREVIEW_BIN,
          locale: 'pt-BR',
        })

        if (cancelled) return

        // Pega a primeira opção retornada (geralmente crédito)
        const payerCosts = results?.[0]?.payer_costs ?? []
        // Filtra parcelas de 1 a 12
        const filtered = payerCosts.filter((p) => p.installments >= 1 && p.installments <= 12)
        setInstallments(filtered)
      } catch (err) {
        if (!cancelled) {
          console.warn('[useInstallments] erro ao buscar parcelas:', err)
          setError('Não foi possível carregar as opções de parcelamento.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchInstallments()

    return () => {
      cancelled = true
    }
  }, [amount])

  return { installments, loading, error }
}
