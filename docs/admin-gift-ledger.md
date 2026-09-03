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

## Lançamentos manuais

Nem todo presente passa pelo site. Alguns convidados mandam transferência
bancária, outros compram pela Camicado, outros entregam dinheiro. Esse dinheiro
entra de verdade e precisa aparecer na mesma lista, com o mesmo vínculo de
convidado e nos mesmos totais.

O botão **"Adicionar lançamento"** abre um drawer com nome, valor, método, data,
presente e convidado. Só o nome, o valor, o método e a data são obrigatórios.

### Grava o mesmo par de linhas

Um lançamento não tem tabela própria. Ele escreve exatamente o que um pagamento
aprovado do Mercado Pago escreveria:

- `payments` com `status='approved'`, `mp_payment_id=NULL` e o método manual;
- `gift_purchases` apontando para ele por `payment_id`, com o `guest_id`.

Por isso o relatório não ganhou nenhum ramo novo: a linha já cai no formato
"compra com pagamento". O `created_at` é gravado explicitamente, sobrepondo o
`server_default`, para uma transferência da semana passada ordenar no lugar dela.

### Presente e convidado são opcionais

`payments.gift_id` e `gift_purchases.gift_id` passaram a aceitar NULL. Uma
transferência quase nunca corresponde a um item do catálogo, e uma compra na
Camicado aponta para o catálogo *deles*.

Junto, as duas FKs trocaram `ON DELETE CASCADE` por `SET NULL`. Antes, apagar um
presente apagava os pagamentos dele — dinheiro recebido sumia de
`approved_amount` sem aviso. Com a coluna anulável isso deixou de ter qualquer
justificativa.

### Métodos

`bank_transfer`, `camicado`, `cash`, `other`. Não entram em `PaymentMethod`, que
descreve o corpo do checkout público: um valor a mais lá viraria na hora uma
requisição anônima válida. Ficam em `ManualMethod`, e o relatório usa a união
`LedgerMethod`. `payments.method` é `String(20)` sem CHECK, então nada disso
precisou de migration.

### Só o que foi lançado à mão é editável

`AdminGiftLedgerRow.is_manual` diz se a linha nasceu aqui — o backend calcula
comparando o método com `MANUAL_METHODS`. Na tabela, só essas linhas respondem
ao clique, e ganham uma etiqueta "manual" na coluna Método.

O serviço recusa com 422 qualquer edição ou remoção de linha do Mercado Pago:
ela espelha um sistema externo, e mexer nela aqui faria o painel divergir da
verdade que está lá. Compra do endpoint público também não é editável — não há
valor a corrigir, e o vínculo com convidado já tem a tela de conciliação.

Remover apaga o par inteiro: deixar o pagamento órfão o traria de volta ao
relatório como linha sem compra.

| Método | Rota | Devolve |
|---|---|---|
| POST | `/api/admin/manual-transactions` | `AdminGiftLedgerRow`, 201 |
| PATCH | `/api/admin/manual-transactions/{purchase_id}` | `AdminGiftLedgerRow` |
| DELETE | `/api/admin/manual-transactions/{purchase_id}` | 204 |

---

## Frontend

- `pages/Admin/components/GiftLedgerTable/` — a aba. Nove colunas, filtros de
  status/método/vínculo, ordenação por data e valor, export CSV e os botões
  "Conciliar convidados" e "Adicionar lançamento".
- `pages/Admin/components/ManualTransactionDrawer/` — o formulário de
  lançamento, no mesmo desenho do `GuestDrawer` (AntD `Form`, `row === null`
  para criar, "Remover" com `modal.confirm`).
- `pages/Admin/components/GiftPicker/` — seleção opcional de presente, irmão do
  `GuestPicker`.
- `hooks/useManualTransactionMutations.ts` — as três escritas. Invalidam
  `['admin']` inteiro: um lançamento mexe no relatório, nos totais por presente
  e nas sugestões de conciliação.
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
- `tests/test_manual_transactions.py` — os lançamentos: criação com e sem
  presente, a data mandando na ordenação, o valor entrando no total aprovado, a
  recusa de editar linha do Mercado Pago e a prova de que apagar um presente
  preserva o dinheiro.
