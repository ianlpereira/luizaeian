# 💳 Épico 7 — Gateway de Pagamento Real (Cartão de Crédito & Pix)

## Status: ✅ COMPLETO

**User Stories:** US 6.1 (Integração com Gateway de Pagamento) · US 6.2 (Checkout com Cartão de Crédito) · US 6.3 (Checkout com Pix Dinâmico via API)

---

## Contexto

Atualmente o fluxo de presente funciona com **Pix manual e não verificado**: o convidado
copia a chave Pix, realiza o pagamento fora do site e clica "Já paguei" — sem nenhuma
confirmação real de que o pagamento foi efetuado. O sistema simplesmente registra a
intenção de compra, não o pagamento em si.

Esse modelo tem duas fragilidades:

1. **Segurança zero:** qualquer convidado pode clicar "Já paguei" sem ter pago, marcando
   o presente como comprado indevidamente.
2. **Experiência degradada:** para Pix manual, o convidado precisa alternar entre app
   do banco e o site. Não há como pagar com cartão de crédito.

O Épico 7 resolve ambos os problemas integrando um **gateway de pagamento real**
(Mercado Pago), que oferece:

- **Pix dinâmico** com QR code gerado por transação (expiração, rastreamento, webhook de confirmação)
- **Cartão de crédito** com tokenização segura no frontend (sem tráfego de dados do cartão pelo servidor)
- **Webhook de confirmação** para atualizar o status do presente apenas após pagamento aprovado
- **Ambiente sandbox** para testes sem dinheiro real

> **Decisão de gateway:** Mercado Pago foi escolhido por:
> - SDK oficial para Python e JavaScript/TypeScript
> - Sandbox gratuito com cartões e CPFs de teste
> - Pix dinâmico nativo (sem integração BACEN manual)
> - Suporte amplo no Brasil e documentação em português
> - Plano gratuito sem mensalidade (taxa por transação)

---

## User Stories

### US 6.1 — Integração Base com o Gateway de Pagamento

**Como** desenvolvedor, **quero** que o backend tenha uma camada de integração com o
Mercado Pago, **para** que os endpoints de pagamento possam criar e consultar transações
de forma segura e testável.

**Requisitos:**
- Configuração de credenciais via variáveis de ambiente (`MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`)
- Cliente MP instanciado uma única vez (singleton) via `app/core/payment.py`
- Nenhuma credencial hardcoded ou exposta em código
- Suporte a modo **sandbox** (variável `MP_SANDBOX=true`) para testes sem cobrar
- Endpoint `POST /api/payments/create` que aceita `payment_method` (`pix` | `credit_card`) e `gift_id`
- Endpoint `POST /api/payments/webhook` que processa notificações do Mercado Pago
- Endpoint `GET /api/payments/{payment_id}/status` para polling de status no frontend

**Critérios de Aceite:**
- [x] `MP_ACCESS_TOKEN` e `MP_PUBLIC_KEY` carregados via `Settings` (Pydantic BaseSettings)
- [x] Ausência das variáveis lança erro descritivo na inicialização do app
- [x] `POST /api/payments/create` retorna `payment_id`, `status` e dados específicos por método
  (`qr_code` + `qr_code_base64` para Pix; `payment_id` para cartão)
- [x] `POST /api/payments/webhook` valida assinatura HMAC do Mercado Pago antes de processar
- [x] `GET /api/payments/{payment_id}/status` retorna `{ status, paid }` sem expor dados sensíveis
- [x] Tabela `payments` criada via Alembic com campos: `id`, `gift_id`, `mp_payment_id`,
  `method`, `status`, `amount`, `created_at`
- [x] Em sandbox, pagamentos podem ser simulados com cartões e CPFs de teste do MP

---

### US 6.2 — Checkout com Cartão de Crédito

**Como** convidado, **quero** pagar o presente com meu cartão de crédito diretamente no
site, **para** ter uma experiência de pagamento segura sem sair da página.

**Requisitos:**
- Formulário de cartão usando o **Brick de Card Payment** do Mercado Pago JS (tokenização no cliente)
- Dados do cartão **nunca** trafegam pelo backend (apenas o `cardToken` gerado pelo MP SDK)
- Suporte a parcelamento (1–12x) configurável
- Exibir bandeiras detectadas automaticamente (Visa, Mastercard, Elo, etc.)
- Validação client-side pelo próprio Brick do MP (número, CVV, validade, nome)
- Feedback em tempo real: "Processando…", "Aprovado ✓", "Recusado — tente outro cartão"
- Em caso de recusa, permitir nova tentativa sem recarregar o modal

**Critérios de Aceite:**
- [x] `@mercadopago/sdk-js` carregado dinamicamente (lazy) apenas quando o modal abre
- [x] Brick de cartão renderizado dentro do modal (não redireciona para outra página)
- [x] Submit envia apenas `{ cardToken, installments, issuer_id, payment_method_id }` ao backend
- [x] Backend cria pagamento via `mp.payment().create(...)` com `token` e `capture: true`
- [x] Pagamento aprovado → webhook atualiza `payments.status = 'approved'` → presente marcado como comprado
- [x] Pagamento recusado → exibe `detail` do erro do MP (ex: "Saldo insuficiente")
- [x] Botão "Confirmar pagamento" desabilitado durante o processamento (previne dupla submissão)
- [x] Em sandbox, cartão `4509 9535 6623 3704` (Visa teste) deve aprovar com CVV `123`

---

### US 6.3 — Checkout com Pix Dinâmico via API

**Como** convidado, **quero** pagar via Pix com um QR code gerado especificamente para
o meu pedido, **para** ter confirmação automática de pagamento sem intervenção manual.

**Requisitos:**
- QR code gerado dinamicamente pela API do Mercado Pago (vinculado ao `gift_id` e `buyer_name`)
- QR code expira em **30 minutos** (configurável via `MP_PIX_EXPIRATION_MINUTES`)
- Exibir QR code como imagem (Base64) e a chave `copia-e-cola` (EMV payload)
- Polling de status a cada **5 segundos** até aprovação ou expiração
- Ao aprovar: avança para tela de sucesso automaticamente (sem clicar "Já paguei")
- Ao expirar: exibe mensagem clara com botão "Gerar novo QR code"
- Remover botão "Já paguei" — confirmação agora é automática via webhook + polling

**Critérios de Aceite:**
- [x] QR code gerado com `payment_method_id: "pix"` e `date_of_expiration` calculada
- [x] Imagem do QR code renderizada a partir do `qr_code_base64` retornado pelo MP
- [x] Texto `copia-e-cola` (campo `qr_code`) exibido com botão "Copiar"
- [x] Polling de `GET /api/payments/{payment_id}/status` a cada 5 s (via `setInterval`)
- [x] Polling encerrado automaticamente ao receber `paid: true` ou `status: 'cancelled'`
- [x] Em sandbox, pagamento simulado via requisição MP (sem app bancário)
- [x] Timer visual regressivo de 30 minutos exibido no modal
- [x] Presente marcado como comprado **apenas** após webhook confirmar `status: approved`

---

## Fluxo de Dados Completo

### Pix Dinâmico

```
Convidado              Frontend               Backend               Mercado Pago
    │                      │                      │                      │
    │── Preenche form ─────▶│                      │                      │
    │                      │── POST /payments/create ──────────────────▶ │
    │                      │   { gift_id, method: 'pix', buyer_name }    │
    │                      │                      │◀── { qr_code, id } ──│
    │                      │◀── { payment_id,     │                      │
    │                      │     qr_code_base64,  │                      │
    │                      │     qr_code,         │                      │
    │                      │     expires_at }      │                      │
    │◀─ Exibe QR code ─────│                      │                      │
    │── Paga no app ───────────────────────────────────────────────────▶ │
    │                      │                      │◀── Webhook POST ─────│
    │                      │                      │   { status: approved }│
    │                      │                      │── Atualiza DB ───────▶│
    │                      │── polling status ───▶│                      │
    │                      │◀── { paid: true } ───│                      │
    │◀─ Tela de sucesso ───│                      │                      │
```

### Cartão de Crédito

```
Convidado              Frontend (MP Brick)    Backend               Mercado Pago
    │                      │                      │                      │
    │── Preenche cartão ──▶│                      │                      │
    │                      │── tokenize ──────────────────────────────▶ │
    │                      │◀── { cardToken } ────────────────────────── │
    │                      │── POST /payments/create ──────────────────▶ │
    │                      │   { gift_id, method: 'credit_card',         │
    │                      │     cardToken, installments }               │
    │                      │                      │── payment.create() ▶ │
    │                      │                      │◀── { status, id } ───│
    │                      │◀── { status, payment_id } ───────────────── │
    │◀─ Aprovado / Erro ───│                      │                      │
```

---

## Arquitetura da Solução

### Backend

#### Novos arquivos

| Arquivo | Responsabilidade |
|---|---|
| `app/core/payment.py` | Singleton do cliente Mercado Pago + helpers |
| `app/models/payment.py` | Model SQLAlchemy da tabela `payments` |
| `app/schemas/payment.py` | Schemas Pydantic de request/response |
| `app/routers/payments.py` | Endpoints de criação, webhook e status |
| `app/services/payment_service.py` | Lógica de negócio: criar pagamento, processar webhook |
| `alembic/versions/XXXXXX_create_payments_table.py` | Migration da tabela `payments` |

#### `app/core/payment.py`

```python
import mercadopago
from app.core.config import settings

_sdk: mercadopago.SDK | None = None

def get_mp_sdk() -> mercadopago.SDK:
    """Retorna o singleton do cliente Mercado Pago."""
    global _sdk
    if _sdk is None:
        _sdk = mercadopago.SDK(settings.MP_ACCESS_TOKEN)
    return _sdk
```

#### `app/core/config.py` — adições

```python
# Novas variáveis de ambiente (Pydantic BaseSettings)
MP_ACCESS_TOKEN: str          # Token de acesso (sandbox ou produção)
MP_PUBLIC_KEY: str            # Chave pública (usada pelo frontend via endpoint)
MP_SANDBOX: bool = True       # True = sandbox, False = produção
MP_PIX_EXPIRATION_MINUTES: int = 30
MP_WEBHOOK_SECRET: str = ""   # Segredo para validação HMAC do webhook
```

#### Schema do banco de dados

```sql
CREATE TABLE payments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_id       UUID NOT NULL REFERENCES gifts(id),
  mp_payment_id BIGINT UNIQUE,           -- ID retornado pelo Mercado Pago
  method        TEXT NOT NULL            -- 'pix' | 'credit_card'
                CHECK (method IN ('pix', 'credit_card')),
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'expired')),
  amount        NUMERIC(10, 2) NOT NULL,
  buyer_name    TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Índice para lookup rápido por mp_payment_id (webhook)
CREATE INDEX ix_payments_mp_payment_id ON payments (mp_payment_id);

-- Índice para lookup por gift_id (evitar presentes com pagamento pendente duplicado)
CREATE INDEX ix_payments_gift_id ON payments (gift_id);
```

#### `POST /api/payments/create` — Payload de entrada

```python
class PaymentCreateIn(BaseModel):
    gift_id: UUID
    buyer_name: str = Field(..., min_length=2, max_length=100)
    message: str | None = Field(None, max_length=300)
    method: Literal["pix", "credit_card"]

    # Apenas para cartão de crédito
    card_token: str | None = None
    installments: int | None = Field(None, ge=1, le=12)
    payment_method_id: str | None = None  # ex: "visa", "master"
    issuer_id: str | None = None

    @model_validator(mode="after")
    def validate_card_fields(self) -> "PaymentCreateIn":
        if self.method == "credit_card":
            if not self.card_token:
                raise ValueError("card_token é obrigatório para cartão de crédito")
            if not self.installments:
                raise ValueError("installments é obrigatório para cartão de crédito")
        return self
```

#### `POST /api/payments/create` — Resposta

```python
class PaymentCreateOut(BaseModel):
    payment_id: str
    status: str          # pending | approved | rejected
    method: str

    # Apenas Pix
    qr_code: str | None = None          # Payload copia-e-cola
    qr_code_base64: str | None = None   # Imagem do QR code em Base64
    expires_at: datetime | None = None

    # Apenas cartão
    detail: str | None = None           # Mensagem do MP em caso de erro
```

#### `POST /api/payments/webhook` — Validação de assinatura

```python
import hmac, hashlib

def validate_mp_signature(
    x_signature: str,
    x_request_id: str,
    raw_body: bytes,
    secret: str,
) -> bool:
    """
    Valida a assinatura HMAC-SHA256 enviada pelo Mercado Pago.
    Docs: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
    """
    ts = ""
    v1 = ""
    for part in x_signature.split(","):
        k, _, v = part.strip().partition("=")
        if k == "ts":
            ts = v
        elif k == "v1":
            v1 = v

    manifest = f"id:{x_request_id};request-id:{x_request_id};ts:{ts};"
    expected = hmac.new(
        secret.encode(), manifest.encode(), hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, v1)
```

#### Lógica de webhook

```python
# Ao receber webhook com action = "payment.updated":
# 1. Valida assinatura HMAC
# 2. Consulta status do pagamento no MP via payment().get(mp_payment_id)
# 3. Atualiza payments.status no banco
# 4. Se status == 'approved':
#    - Chama purchase_gift() para decrementar stock e marcar presente
#    - Registra em gift_purchases (buyer_name + message)
# 5. Se status == 'cancelled' ou 'expired': apenas atualiza payments.status
```

> **Segurança:** O webhook **não confia** no payload recebido para determinar o status.
> Ele sempre re-consulta o status via API do MP (`payment().get()`) após validar a
> assinatura. Isso previne manipulação do payload.

---

### Frontend

#### Novos arquivos / modificações

| Arquivo | O que muda |
|---|---|
| `src/components/CheckoutModal/index.tsx` | Adiciona aba de método + integração MP Brick (cartão) + polling (Pix) |
| `src/components/CheckoutModal/PaymentStep.tsx` | **Novo** — step de pagamento (Pix ou Cartão) extraído do modal |
| `src/components/CheckoutModal/PixStep.tsx` | **Novo** — QR code dinâmico + countdown + polling |
| `src/components/CheckoutModal/CardStep.tsx` | **Novo** — Brick de cartão + submit |
| `src/components/CheckoutModal/schema.ts` | Adiciona `payment_method: 'pix' | 'credit_card'` |
| `src/hooks/usePayment.ts` | **Novo** — `useCreatePayment`, `usePaymentStatus` |
| `src/lib/api.ts` | Adiciona `createPayment()`, `getPaymentStatus()` |
| `src/data/payment.ts` | Adiciona `mpPublicKey` (lido do backend) |
| `src/types/payment.ts` | **Novo** — interfaces TypeScript para pagamento |

#### Fluxo do modal atualizado (4 etapas)

```
┌──────────────────────────────────────────────────────────────┐
│  Etapa 1: Formulário (nome + mensagem)                       │
│  ──────────────────────────────────────────────────────────  │
│  Etapa 2: Escolha do método                                  │
│    [ 💳 Cartão de Crédito ]   [ 📲 Pix ]                    │
│  ──────────────────────────────────────────────────────────  │
│  Etapa 3a (Pix):       │  Etapa 3b (Cartão):                │
│  QR code dinâmico      │  Brick do MP                        │
│  Timer 30 min          │  Parcelamento                       │
│  Polling a cada 5s     │  Botão "Pagar"                      │
│  ──────────────────────────────────────────────────────────  │
│  Etapa 4: Sucesso (confetes 🎉)                              │
└──────────────────────────────────────────────────────────────┘
```

#### `src/types/payment.ts`

```typescript
export type PaymentMethod = 'pix' | 'credit_card'
export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired'

export interface CreatePaymentPayload {
  gift_id: string
  buyer_name: string
  message?: string
  method: PaymentMethod
  // Cartão
  card_token?: string
  installments?: number
  payment_method_id?: string
  issuer_id?: string
}

export interface CreatePaymentResponse {
  payment_id: string
  status: PaymentStatus
  method: PaymentMethod
  // Pix
  qr_code?: string
  qr_code_base64?: string
  expires_at?: string
  // Cartão
  detail?: string
}

export interface PaymentStatusResponse {
  payment_id: string
  status: PaymentStatus
  paid: boolean
}
```

#### `src/hooks/usePayment.ts`

```typescript
import { useMutation, useQuery } from '@tanstack/react-query'
import { createPayment, getPaymentStatus } from '@/lib/api'
import type { CreatePaymentPayload } from '@/types/payment'

export function useCreatePayment() {
  return useMutation({
    mutationFn: (payload: CreatePaymentPayload) => createPayment(payload),
  })
}

export function usePaymentStatus(paymentId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['payment-status', paymentId],
    queryFn: () => getPaymentStatus(paymentId!),
    enabled: !!paymentId && enabled,
    refetchInterval: (query) => {
      // Para o polling quando pago ou cancelado
      const data = query.state.data
      if (data?.paid || data?.status === 'cancelled' || data?.status === 'expired') {
        return false
      }
      return 5_000 // 5 segundos
    },
  })
}
```

#### Carregamento lazy do SDK do Mercado Pago

```typescript
// src/lib/loadMercadoPago.ts
let mpPromise: Promise<typeof window.MercadoPago> | null = null

export function loadMercadoPago(publicKey: string): Promise<typeof window.MercadoPago> {
  if (!mpPromise) {
    mpPromise = new Promise((resolve, reject) => {
      if (window.MercadoPago) {
        resolve(window.MercadoPago)
        return
      }
      const script = document.createElement('script')
      script.src = 'https://sdk.mercadopago.com/js/v2'
      script.onload = () => resolve(new window.MercadoPago(publicKey))
      script.onerror = reject
      document.head.appendChild(script)
    })
  }
  return mpPromise
}
```

---

## Variáveis de Ambiente

### Backend (`.env` / Render Environment Variables)

```env
# Mercado Pago
MP_ACCESS_TOKEN=TEST-xxxxxxxxxxxxxxxxxxxx   # Sandbox: começa com TEST-
MP_PUBLIC_KEY=TEST-xxxxxxxxxxxxxxxxxxxx    # Sandbox: começa com TEST-
MP_SANDBOX=true
MP_PIX_EXPIRATION_MINUTES=30
MP_WEBHOOK_SECRET=seu_segredo_webhook_aqui

# Webhook URL (configurar no painel MP)
# https://seu-backend.onrender.com/api/payments/webhook
```

### Frontend (`.env.local` / Render)

```env
# A chave pública é exposta no frontend (não é segredo)
# Recomendado: servir via endpoint GET /api/payments/public-key
# para não precisar de variável de ambiente no frontend
VITE_MP_PUBLIC_KEY=TEST-xxxxxxxxxxxxxxxxxxxx
```

> **Nota de segurança:** `MP_ACCESS_TOKEN` **jamais** deve ser exposto no frontend.
> Apenas `MP_PUBLIC_KEY` é público por design (usada para tokenização no browser).

---

## Fases de Implementação

### Fase 7.1 — Credenciais e configuração base

**Objetivo:** Configurar credenciais sandbox do Mercado Pago e garantir que o backend
inicializa corretamente com as novas variáveis.

Tasks:
- [x] Criar conta de teste no [Mercado Pago Developers](https://www.mercadopago.com.br/developers)
- [x] Obter `MP_ACCESS_TOKEN` e `MP_PUBLIC_KEY` do ambiente **sandbox**
- [x] Adicionar variáveis ao `.env` local e ao painel do Render
- [x] Atualizar `app/core/config.py` com as novas Settings
- [x] Criar `app/core/payment.py` com singleton do SDK
- [x] Instalar dependência: `pip install mercadopago`
- [x] Atualizar `requirements.txt`

### Fase 7.2 — Tabela `payments` e migration

**Objetivo:** Criar o modelo e a migration para rastrear pagamentos.

Tasks:
- [x] Criar `app/models/payment.py` com o model `Payment`
- [x] Criar `app/schemas/payment.py` com schemas Pydantic de entrada e saída
- [x] Gerar migration com Alembic: `alembic revision --autogenerate -m "create_payments_table"`
- [x] Revisar e aplicar: `alembic upgrade head`
- [x] Registrar o novo model em `app/models/__init__.py`

### Fase 7.3 — Endpoint `POST /api/payments/create`

**Objetivo:** Criar o endpoint que gera pagamentos no Mercado Pago.

Tasks:
- [x] Criar `app/services/payment_service.py`:
  - `create_pix_payment(gift, buyer_name, message, db)` → chama MP e persiste em `payments`
  - `create_card_payment(gift, buyer_name, card_token, installments, ...)` → idem
- [x] Criar `app/routers/payments.py` com `POST /api/payments/create`
- [x] Registrar o router em `app/main.py` com prefix `/api/payments`
- [x] Testar manualmente no Swagger UI com credenciais sandbox
- [x] Validar que Pix retorna `qr_code` e `qr_code_base64`
- [x] Validar que cartão sandbox aprova com `4509 9535 6623 3704`

### Fase 7.4 — Endpoint `POST /api/payments/webhook`

**Objetivo:** Processar notificações do Mercado Pago e atualizar status do presente.

Tasks:
- [x] Implementar validação HMAC em `app/core/payment.py`
- [x] Criar `POST /api/payments/webhook` em `app/routers/payments.py`
- [x] Lógica: validar assinatura → consultar status no MP → atualizar `payments` → se aprovado, chamar `purchase_gift_service()`
- [x] Configurar URL do webhook no painel do Mercado Pago (apontar para o endpoint)
- [x] Testar com [MP Webhook Tester](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks) no sandbox

### Fase 7.5 — Endpoint `GET /api/payments/{payment_id}/status`

**Objetivo:** Expor um endpoint de polling para o frontend verificar o status.

Tasks:
- [x] Criar `GET /api/payments/{payment_id}/status` que retorna `{ payment_id, status, paid }`
- [x] Retornar `404` se `payment_id` não existe
- [x] Não expor dados sensíveis (sem dados do cartão, sem dados pessoais além do status)

### Fase 7.6 — Frontend: Escolha de método e integração Pix Dinâmico

**Objetivo:** Substituir o Pix manual pelo Pix dinâmico com QR code gerado pela API.

Tasks:
- [x] Criar `src/types/payment.ts` com as interfaces
- [x] Criar `src/lib/loadMercadoPago.ts` para carregamento lazy do SDK
- [x] Criar `src/hooks/usePayment.ts` com `useCreatePayment` e `usePaymentStatus`
- [x] Adicionar `createPayment()` e `getPaymentStatus()` em `src/lib/api.ts`
- [x] Atualizar `CheckoutModal/schema.ts` com campo `payment_method`
- [x] Adicionar **Etapa 2** no modal: seleção de método (Pix ou Cartão)
- [x] Criar `src/components/CheckoutModal/PixStep.tsx`:
  - Renderiza `qr_code_base64` como `<img>`
  - Exibe `qr_code` (copia-e-cola) com botão "Copiar"
  - Timer regressivo de 30 minutos
  - Inicia polling via `usePaymentStatus`
  - Ao `paid: true` → avança para sucesso automaticamente
  - Ao expirar → exibe botão "Gerar novo QR code"
- [x] Remover botão "Já paguei" do fluxo de Pix

### Fase 7.7 — Frontend: Cartão de Crédito com MP Brick

**Objetivo:** Integrar o Brick de pagamento do Mercado Pago para cartão de crédito.

Tasks:
- [x] Criar `src/components/CheckoutModal/CardStep.tsx`:
  - Carrega MP SDK via `loadMercadoPago(publicKey)` ao montar
  - Instancia `mp.bricks().create("cardPayment", ...)` no `<div id="cardPaymentBrick_container">`
  - Configura `initialization.amount` com o valor do presente
  - Configura `callbacks.onSubmit` para chamar `createPayment()` com o `formData` do Brick
  - Destrói o Brick ao desmontar (cleanup)
- [x] Endpoint `GET /api/payments/public-key` que retorna `{ public_key: settings.MP_PUBLIC_KEY }`
  para o frontend não depender de variável de ambiente
- [x] Testar com cartão sandbox `4509 9535 6623 3704` (aprovação) e `4000 0000 0000 0002` (recusa)
- [x] Exibir mensagem de erro específica em caso de recusa (ex: "Saldo insuficiente")

### Fase 7.8 — Testes e Segurança

**Objetivo:** Garantir cobertura de testes e sem vulnerabilidades.

Tasks:
- [x] Escrever testes para `payment_service.py` com mock do MP SDK
- [x] Testar endpoint de webhook com payload simulado (assinatura válida e inválida)
- [x] Testar polling de status com `payment_id` inválido (deve retornar 404)
- [x] Garantir que `MP_ACCESS_TOKEN` não aparece em nenhum log
- [x] Garantir que `card_token` não é persistido no banco (apenas `mp_payment_id`)
- [x] Testar fluxo completo end-to-end em sandbox (Pix e Cartão)

---

## Segurança

| Ameaça | Mitigação |
|---|---|
| Presente marcado como comprado sem pagamento | Atualização do presente **apenas no webhook**, após confirmação do MP |
| Replay attack no webhook | Validação HMAC-SHA256 com timestamp (`ts`) |
| Dados do cartão trafegando pelo servidor | Tokenização feita pelo MP Brick no browser |
| `MP_ACCESS_TOKEN` exposto | Apenas no backend via variável de ambiente; nunca logado |
| Double-spend (dois pagamentos para o mesmo presente) | Verificar `payments` por `gift_id` com `status IN ('pending', 'approved')` antes de criar novo pagamento |
| CSRF no webhook | Webhook valida assinatura HMAC — não há sessão ou cookie envolvidos |

---

## Estimativa de Tempo

| Fase | Tarefas | Tempo |
|---|---|---|
| 7.1 Credenciais e config | 6 tasks | 1–2h |
| 7.2 Model + migration | 4 tasks | 45 min |
| 7.3 Endpoint `create` | 6 tasks | 2–3h |
| 7.4 Webhook | 5 tasks | 2–3h |
| 7.5 Endpoint `status` | 3 tasks | 30 min |
| 7.6 Frontend Pix dinâmico | 8 tasks | 3–4h |
| 7.7 Frontend Cartão (Brick) | 6 tasks | 3–4h |
| 7.8 Testes e segurança | 8 tasks | 2–3h |
| **TOTAL ÉPICO 7** | **46 tasks** | **~15–20h** |

---

## Checklist de Conclusão

- [x] Credenciais sandbox configuradas e carregadas via variável de ambiente
- [x] Tabela `payments` criada com os campos corretos
- [x] `POST /api/payments/create` funciona para Pix e Cartão em sandbox
- [x] QR code Pix gerado dinamicamente e exibido no modal
- [x] Polling encerra automaticamente ao aprovar ou cancelar
- [x] Brick de cartão renderiza dentro do modal sem redirecionamento
- [x] Cartão sandbox `4509 9535 6623 3704` aprova o pagamento
- [x] Cartão sandbox `4000 0000 0000 0002` exibe mensagem de recusa
- [x] Webhook valida assinatura HMAC antes de processar
- [x] Webhook re-consulta status no MP (não confia no payload recebido)
- [x] Presente marcado como comprado **somente** após webhook confirmar aprovação
- [x] `MP_ACCESS_TOKEN` não aparece em nenhum log ou response
- [x] Dados do cartão não persistem no banco (somente `mp_payment_id`)
- [x] Botão "Já paguei" removido do fluxo de Pix
- [x] Confetes aparecem ao confirmar pagamento (Pix e Cartão)
- [x] Testes unitários do `payment_service` passando

---

## Melhorias de Qualidade MP (Checklist de Certificação)

Campos avaliados pelo Mercado Pago para aprovar os padrões de qualidade da integração.
Resultado obtido via `mcp_my-mcp-server_quality_checklist` em 13/03/2026.

### ✅ Campos Obrigatórios — implementados

| Campo (API Name) | Status | Onde |
|---|---|---|
| `items.quantity` | ✅ | `additional_info.items[0].quantity = 1` |
| `items.unit_price` | ✅ | `additional_info.items[0].unit_price` |
| `items.title` | ✅ | `additional_info.items[0].title` |
| `items.id` | ✅ | `additional_info.items[0].id = str(gift.id)` |
| `items.description` | ✅ | `additional_info.items[0].description` |
| `items.category_id` | ✅ | `additional_info.items[0].category_id = "gift"` |
| `statement_descriptor` | ✅ | `settings.MP_STATEMENT_DESCRIPTOR` (padrão: "LUIZA E IAN") |
| `notification_url` (webhooks) | ✅ | `settings.MP_BACK_URL + "/api/payments/webhook"` |
| `external_reference` | ✅ | `str(gift.id)` |
| `payer.email` | ✅ | `settings.MP_TEST_PAYER_EMAIL` |
| `payer.first_name` | ✅ | derivado de `buyer_name` (split no espaço) |
| `payer.last_name` | ✅ | derivado de `buyer_name` (split no espaço) |
| `back_end_sdk` | ✅ | `mercadopago>=2.2.0` |

### 💡 Boas Práticas — implementadas

| Campo (API Name) | Status | Onde |
|---|---|---|
| `binary_mode = True` | ✅ | cartão — aprovação instantânea (sem status "in_process") |
| `date_of_expiration` | ✅ | Pix — `MP_PIX_EXPIRATION_MINUTES` (padrão: 30 min) |
| `payer.identification` (CPF) | ✅ | campo opcional `payer_cpf` no `PaymentCreateIn` |
| `response_messages` | ✅ | `user_message` no `PaymentCreateOut` — 30+ mensagens amigáveis mapeadas de `status_detail` |
| `modal` | ✅ | checkout dentro do modal, sem redirecionamento |
| `back_end_sdk` JS v2 | ✅ | `loadMercadoPago()` carrega `@mercadopago/sdk-js` dinamicamente |

### 🔲 Boas Práticas — não implementadas (fora do escopo)

| Campo | Motivo |
|---|---|
| `back_urls` | Aplicável apenas ao Checkout Pro; esta integração usa Checkout Bricks (sem redirecionamento) |
| `binary_mode` no Pix | Pix não suporta `binary_mode` (fluxo é sempre assíncrono via webhook) |
| `excluded_payment_methods/types` | Irrelevante — esta integração já define exatamente os métodos aceitos (Pix e cartão) |
| `shipment_amount` | Lista de presentes — sem frete |
| `max_installments` | Controlado pelo MP Brick via configuração do componente frontend |
| `expiration` (vigência preferência) | Pix já usa `date_of_expiration`; cartão com `binary_mode=true` não expira |
| `cancellation_api` | Futuro — cancelar pagamentos pendentes via API |
| `refunds_api` | Futuro — processar estornos via API |
| `chargebacks_api` | Futuro — gerenciar contestações via API |
| `settlement / release reports` | Futuro — painel administrativo |
| `marketing_information` | Fora de escopo — sem campanhas de Ads |
| `logos` | Futuro — adicionar logo MP no modal de checkout |

### Novas Variáveis de Ambiente

```env
# Texto na fatura do cartão (máx. 22 chars) — reduz contestações
MP_STATEMENT_DESCRIPTOR=LUIZA E IAN

# URL base do site para notification_url do webhook
MP_BACK_URL=https://luizaeian.com
```

### Novos Campos no Schema `PaymentCreateIn`

```python
payer_last_name: str | None    # sobrenome do comprador (opcional — derivado do buyer_name por padrão)
payer_cpf: str | None          # CPF para payer.identification (opcional — melhora aprovação)
```

### Novo Campo no Schema `PaymentCreateOut`

```python
user_message: str | None       # mensagem amigável traduzida do status_detail do MP
```

---

## NFRs Cobertos neste Épico

| Tag | Requisito | Implementação |
|---|---|---|
| SEC-04 | Pagamentos verificados por terceiro confiável | Webhook do Mercado Pago com validação HMAC |
| SEC-05 | Dados de cartão nunca no servidor | Tokenização pelo MP Brick no browser |
| SEC-06 | Sem chaves secretas no frontend | `MP_ACCESS_TOKEN` restrito ao backend |
| UX-01 | Confirmação automática sem ação manual | Polling + webhook eliminam "Já paguei" manual |
| UX-02 | Suporte a múltiplos métodos de pagamento | Pix e Cartão de Crédito (parcelado) |
| PERF-04 | SDK do MP carregado de forma lazy | `loadMercadoPago()` carrega o script apenas ao abrir o modal |

---

## Dependências

- Épico 4 concluído ✅ (`GiftList`, `CheckoutModal`, `usePurchaseGift` funcionais)
- Conta de desenvolvedor no Mercado Pago (gratuita)
- Backend com acesso à internet (para chamar API do MP)
- URL pública do backend para configurar webhook (Render deploy ativo)

### Pacotes novos

#### Backend
```
mercadopago>=2.2.0
```

#### Frontend
```
# Sem novo pacote npm — o SDK do MP é carregado via <script> dinâmico
# O @types/mercadopago pode ser adicionado se necessário para TypeScript
```

---

## Próximos Passos Após Épico 7

- **Painel administrativo:** visualizar RSVPs, mensagens e histórico de pagamentos
- **Rate limiting:** `slowapi` nos endpoints de pagamento (previne spam)
- **E-mail de confirmação:** enviar comprovante ao comprador após pagamento aprovado (`SendGrid` / `Resend`)
- **Upgrade para produção:** trocar credenciais sandbox pelas de produção antes do go-live

---

**Status:** Aguardando início da implementação
**Prioridade:** 🔴 ALTA — segurança dos pagamentos antes do go-live
**Dependências:** Épico 4 ✅ · Conta MP Developers ⬜ · Render deploy ativo ✅
