# 💳 Painel — Compras e pagamentos

Aba única do painel administrativo que lista todas as transações de presente.
Substitui as antigas abas **Pagamentos** e **Compras**.

---

## Por que unificar

As duas abas mostravam o mesmo acontecimento por ângulos diferentes:

| Aba antiga | Tabela | O que trazia | O que faltava |
|---|---|---|---|
| Pagamentos | `payments` | status, método, valor, ID do Mercado Pago | vínculo com convidado |
| Compras | `gift_purchases` | presente, comprador, convidado vinculado | qualquer valor |

Quatro colunas eram idênticas (Data, Presente, Comprador, Mensagem). E, pior:
um pagamento aprovado **gera** uma linha em `gift_purchases`
(`payment_service._fulfill_gift`), então o mesmo evento aparecia nas duas abas
sem nada indicando que era um só. Conferir o quanto entrou e de quem exigia
cruzar duas listas no olho.

A causa raiz era o modelo: nada ligava uma compra ao seu pagamento. A única
associação era a trinca `(gift_id, buyer_name, message)`, recalculada na mão —
duas pessoas com o mesmo nome dando o mesmo presente com a mesma mensagem
colidiam.

---

## O vínculo

`gift_purchases.payment_id` — FK opcional e única para `payments.id`,
`ON DELETE SET NULL`.

- **Preenchido:** a compra nasceu de um pagamento aprovado.
- **NULL:** a compra veio do endpoint público `POST /api/gifts/purchase`, que
  não tem dinheiro por trás.

`UNIQUE` porque um pagamento aprovado gera no máximo uma compra. `SET NULL` em
vez de `CASCADE` para não apagar o histórico da compra se o pagamento sumir.

Migration: `20260903_1400_c6d7e8f9a0b1_add_payment_id_to_gift_purchases.py`. O
backfill pareia 1:1 dentro de cada balde `(gift_id, buyer_name, message)` por
ordem de `created_at`, e a constraint `UNIQUE` só é criada depois — se o
pareamento errar, a migration falha ali em vez de deixar passar dado torto.

Efeito colateral bom: a reconciliação de `get_payment_status` virou uma busca
exata por `payment_id` no lugar da trinca.

---

## O relatório

`GET /api/admin/gift-ledger` → `admin_report_service.get_gift_ledger_report`.

Uma linha por transação, mais recentes primeiro. Três formatos, todos no mesmo
schema (`AdminGiftLedgerRow`):

| Origem | `status` | `purchase_id` | `payment_id` | Valor |
|---|---|---|---|---|
| Compra com pagamento | status do MP | ✅ | ✅ | ✅ |
| Compra sem pagamento | `no_payment` | ✅ | — | — |
| Pagamento sem compra | status do MP | — | ✅ | ✅ |

O terceiro caso são os pagamentos pendentes, recusados, cancelados e expirados:
nunca viraram presente, mas o painel precisa vê-los. Como não existe compra,
também não há o que vincular a um convidado.

`key` (`"c:<uuid>"` ou `"p:<uuid>"`) é o `rowKey` da tabela — as linhas vêm de
duas tabelas, então não dá para usar `id`.

O `summary` mantém os números financeiros vindos só de `payments`
(`approved_amount`, `pending_count`, …) e acrescenta as contagens de vínculo
(`purchases_total`, `linked`, `unlinked`). Linhas `no_payment` não entram em
nenhum número financeiro.

---

## Frontend

- `pages/Admin/components/GiftLedgerTable/` — a aba. Nove colunas, filtros de
  status/método/vínculo, ordenação por data e valor, export CSV e o botão
  "Conciliar convidados".
- `pages/Admin/paymentLabels.ts` — rótulos pt-BR de status e método, no mesmo
  espírito de `guestLabels.ts`.
- `hooks/useAdminReports.ts` — `useAdminGiftLedger`, chave
  `['admin', 'gift-ledger']`.

O drawer de conciliação (`GiftPurchaseMatchDrawer`) não mudou: continua
operando sobre compras, via `PATCH /api/admin/gift-purchases/{id}`. O contador
do badge conta só linhas que têm `purchase_id` e ainda não têm convidado.

As abas do painel passaram de cinco para quatro: Convidados, Confirmações,
Presentes, Compras e pagamentos.

---

## Testes

`RUN_DB_TESTS=1` é obrigatório para os que tocam o banco — os modelos usam
`postgresql.UUID` e `JSONB`, SQLite não serve.

- `tests/test_admin_reports.py` — os três formatos de linha, ordenação,
  unicidade das chaves, e o total aprovado ignorando pendentes/recusados.
- `tests/test_gift_fulfillment.py` — a FK sendo gravada, a reconciliação não
  duplicando, e a regressão dos compradores homônimos.
