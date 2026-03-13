/**
 * Carregamento lazy do SDK do Mercado Pago.
 *
 * O script só é injetado quando chamado pela primeira vez (ao abrir o modal),
 * garantindo que o bundle principal não carregue o JS do MP desnecessariamente.
 *
 * Uso:
 *   const mp = await loadMercadoPago(publicKey)
 *   const brick = mp.bricks()
 */

// Declaração mínima do tipo para uso sem @types/mercadopago
declare global {
  interface Window {
    MercadoPago: new (publicKey: string, options?: object) => MercadoPagoInstance
  }
}

export interface MercadoPagoInstance {
  bricks(): MercadoPagoBricks
  getInstallments(params: {
    amount: string
    bin: string
    locale?: string
  }): Promise<InstallmentsResult[]>
}

export interface MercadoPagoBricks {
  create(
    brick: 'cardPayment',
    containerId: string,
    settings: CardPaymentBrickSettings,
  ): Promise<CardPaymentBrickController>
}

export interface CardPaymentBrickSettings {
  initialization: {
    amount: number
    payer?: { email?: string }
  }
  customization?: {
    visual?: { style?: object; hideFormTitle?: boolean }
    paymentMethods?: { maxInstallments?: number; minInstallments?: number }
  }
  callbacks: {
    onReady?: () => void
    onError?: (error: unknown) => void
    onSubmit: (formData: CardPaymentFormData) => Promise<void>
  }
}

export interface CardPaymentFormData {
  token: string
  issuer_id: string
  payment_method_id: string
  transaction_amount: number
  installments: number
  payer: { email: string; identification?: { type: string; number: string } }
}

export interface CardPaymentBrickController {
  unmount(): void
}

// ── Parcelas ──────────────────────────────────────────────────────────────────

export interface InstallmentOption {
  installments: number
  installment_amount: number   // valor de cada parcela
  total_amount: number         // valor total com juros
  installment_rate: number     // percentual de juros (0 = sem juros)
  labels: string[]             // ex: ["recommended_installment", "installments_with_no_rate"]
}

export interface InstallmentsResult {
  payment_method_id: string
  payment_type_id: string
  payer_costs: InstallmentOption[]
}

// ── Loader ────────────────────────────────────────────────────────────────────

let _mpInstance: MercadoPagoInstance | null = null
let _loadPromise: Promise<MercadoPagoInstance> | null = null

export function loadMercadoPago(publicKey: string): Promise<MercadoPagoInstance> {
  if (_mpInstance) return Promise.resolve(_mpInstance)

  if (!_loadPromise) {
    _loadPromise = new Promise<MercadoPagoInstance>((resolve, reject) => {
      // SDK já carregado por outra instância
      if (window.MercadoPago) {
        _mpInstance = new window.MercadoPago(publicKey)
        resolve(_mpInstance)
        return
      }

      const script = document.createElement('script')
      script.src = 'https://sdk.mercadopago.com/js/v2'
      script.async = true
      script.onload = () => {
        try {
          _mpInstance = new window.MercadoPago(publicKey)
          resolve(_mpInstance)
        } catch (err) {
          reject(err)
        }
      }
      script.onerror = () => reject(new Error('Falha ao carregar o SDK do Mercado Pago.'))
      document.head.appendChild(script)
    })
  }

  return _loadPromise
}

/** Limpa a instância em cache (útil para testes ou troca de publicKey). */
export function resetMercadoPagoInstance(): void {
  _mpInstance = null
  _loadPromise = null
}
