# 🛡️ Épico 6 — Validação e Moderação de Conteúdo

## Status: 🔲 PLANEJADO

**User Stories:** US 5.1 (Deduplicação de RSVP por nome e e-mail) · US 5.2 (Filtro de palavrão no Mural)

---

## Contexto

Com os Épicos 4 e 5 entregues, o site está funcional. Porém, dois buracos de qualidade
permanecem abertos:

1. **RSVP duplicado por nome:** Hoje só o e-mail é indexado com `UNIQUE`. Um convidado
   pode confirmar presença duas vezes usando e-mails diferentes mas o mesmo nome —
   gerando entradas duplicadas na lista de convidados do casal.

2. **Mensagens inapropriadas no mural:** O mural é público e moderado apenas por
   sanitização XSS (`html.escape`). Não há nenhum filtro de palavrão, expondo o casal
   a conteúdo ofensivo visível para todos os visitantes — incluindo familiares e crianças.

Ambas as validações devem ser **transparentes para o convidado legítimo** e retornar
mensagens de erro claras e amigáveis quando acionadas.

---

## User Stories

### US 5.1 — Deduplicação de RSVP por nome e e-mail

**Como** casal organizador, **quero** que o sistema impeça o mesmo convidado de confirmar
presença mais de uma vez, **para** que a lista de convidados reflita a realidade sem
duplicatas.

**Requisitos:**
- Verificar duplicata por **e-mail** (já existe — `UNIQUE` no banco)
- Verificar duplicata por **nome normalizado** (sem acento, case-insensitive, trim)
  antes de persistir — no banco, não apenas na aplicação
- Retornar erro `422` com mensagem amigável para e-mail duplicado e para nome duplicado
  separadamente (para que o convidado entenda exatamente o que aconteceu)
- A verificação por nome deve ser **case-insensitive** e **accent-insensitive**:
  `"João Silva"`, `"joao silva"` e `"JOAO SILVA"` devem ser tratados como o mesmo nome

**Critérios de Aceite:**
- [ ] Segunda tentativa com mesmo e-mail retorna: *"Este e-mail já foi registrado."*
- [ ] Segunda tentativa com mesmo nome (variação de maiúsculas/acentos) retorna:
  *"Este nome já está na lista de convidados."*
- [ ] Primeira tentativa com nome e e-mail novos persiste normalmente
- [ ] Verificação de nome usa `unidecode` ou `pg_trgm` — sem dependência de locale do OS
- [ ] Ambas as checagens acontecem **antes** do INSERT (sem depender de exceção do banco)
- [ ] Frontend exibe a mensagem de erro recebida da API no `GlobalError` do `RsvpForm`

---

### US 5.2 — Filtro de palavrão no Mural de Recados

**Como** casal organizador, **quero** que mensagens com palavras de baixo calão sejam
barradas, **para** que o mural permaneça respeitoso para todos os convidados.

**Requisitos:**
- Lista de palavras proibidas em português mantida em arquivo de configuração
  (`backend/app/core/profanity.py`) — fácil de atualizar sem alterar lógica
- Verificação **case-insensitive** e **accent-insensitive** (ex: `"pût@"` detecta `"puta"`)
- Retornar erro `422` com mensagem genérica: *"Sua mensagem contém conteúdo inadequado."*
  — sem revelar qual palavra foi detectada
- Verificação aplicada a `author_name` **e** `content`
- Frontend exibe o erro no campo correto ou no `ErrorMsg` global do `MessageBoard`

**Critérios de Aceite:**
- [ ] Mensagem com palavrão em `content` é rejeitada com HTTP 422
- [ ] Mensagem com nome ofensivo em `author_name` é rejeitada com HTTP 422
- [ ] Variações com acentos, números substituindo letras (`@` → `a`, `3` → `e`) são detectadas
- [ ] Mensagem limpa é aceita normalmente
- [ ] Lista de palavras é configurável sem alterar código de rota

---

## Arquitetura da Solução

### Validação de RSVP (US 5.1)

#### Banco de dados — índice funcional no PostgreSQL

Adicionar um índice `UNIQUE` funcional usando `unaccent` + `lower` para garantir
unicidade de nome independentemente de acentuação e capitalização:

```sql
-- Requer extensão unaccent (nativa do PostgreSQL, sem instalação extra)
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Índice único funcional: normaliza o nome antes de comparar
CREATE UNIQUE INDEX ix_rsvp_full_name_normalized
  ON rsvp (lower(unaccent(full_name)));
```

Este índice é criado via **Alembic** usando `op.execute()` numa migration dedicada.

#### Verificação dupla no router (antes do INSERT)

```python
# backend/app/routers/rsvp.py — lógica adicional
from sqlalchemy import func, select

# Verificar e-mail (antes de tentar INSERT)
email_exists = await db.scalar(
    select(func.count()).where(Rsvp.email == email)
)
if email_exists:
    raise HTTPException(422, "Este e-mail já foi registrado.")

# Verificar nome normalizado (usando a mesma função do índice)
name_exists = await db.scalar(
    select(func.count()).where(
        func.lower(func.unaccent(Rsvp.full_name)) == func.lower(func.unaccent(full_name))
    )
)
if name_exists:
    raise HTTPException(422, "Este nome já está na lista de convidados.")
```

> **Decisão:** Checar antes do INSERT (em vez de capturar exceção do banco) dá controle
> granular sobre qual mensagem mostrar. O índice funcional ainda protege contra race
> conditions em caso de concorrência.

---

### Filtro de palavrão (US 5.2)

#### `backend/app/core/profanity.py`

```python
"""
Lista de palavras proibidas para o mural de recados.
Adicione ou remova palavras aqui sem alterar a lógica do router.

Estratégia de detecção:
  1. Normalizar o texto: remover acentos, lowercase, substituir leet-speak comum
  2. Verificar se qualquer palavra da lista aparece como substring no texto normalizado
  3. Retornar True se qualquer palavra for encontrada
"""
import re
import unicodedata

# Palavras proibidas em português (lista base — expandir conforme necessário)
_BLOCKED: list[str] = [
    # Esta lista deve ser preenchida com as palavras proibidas
    # durante a implementação, seguindo a política de moderação do casal.
    # Exemplos de categorias: palavrões, ofensas, termos discriminatórios.
]

def _normalize(text: str) -> str:
    """Remove acentos, lowercase, substitui leet-speak básico."""
    # Remove acentos via NFD + filtro de combining chars
    nfd = unicodedata.normalize("NFD", text.lower())
    no_accent = "".join(c for c in nfd if unicodedata.category(c) != "Mn")
    # Leet-speak básico: @ → a, 3 → e, 1 → i, 0 → o, 5 → s
    leet = no_accent.translate(str.maketrans("@310$5":"a3i0ss"))
    return leet

def contains_profanity(text: str) -> bool:
    """Retorna True se o texto contiver qualquer palavra proibida."""
    normalized = _normalize(text)
    return any(word in normalized for word in _BLOCKED)
```

#### Uso no router de messages

```python
# backend/app/routers/messages.py — adição
from app.core.profanity import contains_profanity

if contains_profanity(payload.author_name) or contains_profanity(payload.content):
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail="Sua mensagem contém conteúdo inadequado.",
    )
```

---

## Fases de Implementação

### Fase 6.1 — Extensão `unaccent` e migration

**Objetivo:** Ativar `unaccent` no PostgreSQL e adicionar índice único funcional em `rsvp.full_name`.

Tasks:
- [ ] Criar `backend/alembic/versions/XXXXXX_add_rsvp_name_unique_index.py`
  - `op.execute("CREATE EXTENSION IF NOT EXISTS unaccent")`
  - `op.execute("CREATE UNIQUE INDEX ix_rsvp_full_name_normalized ON rsvp (lower(unaccent(full_name)))")`
- [ ] Registrar o índice no modelo `Rsvp` via `__table_args__` (para `alembic check` não reclamar)
- [ ] Aplicar migration: `alembic upgrade head`

### Fase 6.2 — Validação dupla no router de RSVP

**Objetivo:** Checar e-mail **e** nome normalizado antes do INSERT.

Tasks:
- [ ] Atualizar `backend/app/routers/rsvp.py`:
  - Importar `func` do SQLAlchemy
  - Adicionar checagem de e-mail com `SELECT COUNT` antes do INSERT
  - Adicionar checagem de nome com `lower(unaccent(...))` antes do INSERT
  - Remover captura genérica de `IntegrityError` (substituída pelas checagens explícitas)
  - Manter `IntegrityError` como fallback para race conditions

### Fase 6.3 — Módulo de filtro de palavrão

**Objetivo:** Criar `profanity.py` com lista configurável e função de detecção robusta.

Tasks:
- [ ] Criar `backend/app/core/profanity.py`
  - Função `_normalize(text)`: NFD + remove combining + leet-speak (`@→a`, `3→e`, `1→i`, `0→o`, `5→s`)
  - Lista `_BLOCKED` com palavras em português (mínimo 20 palavras cobrindo categorias principais)
  - Função `contains_profanity(text) -> bool`
- [ ] Escrever testes unitários em `backend/tests/test_profanity.py`:
  - Texto limpo → `False`
  - Palavra direta → `True`
  - Variação com acento → `True`
  - Variação com leet-speak (`@`, `3`) → `True`
  - Substring embutida numa palavra maior (ex: `"assassinato"` não deve disparar) → discutir política

### Fase 6.4 — Integração no router de messages

**Objetivo:** Bloquear mensagens com conteúdo inadequado antes de persistir.

Tasks:
- [ ] Atualizar `backend/app/routers/messages.py`:
  - Importar `contains_profanity`
  - Checar `author_name` e `content` antes do INSERT
  - Retornar `422` com mensagem genérica (não revelar qual palavra)

### Fase 6.5 — Tratamento de erro no frontend

**Objetivo:** Exibir o erro da API no componente correto sem alteração de estrutura.

Tasks:
- [ ] `RsvpForm/index.tsx`: verificar se o `error` do `useMutation` já exibe a mensagem
  da API corretamente no `<S.GlobalError>` — ajustar se necessário
- [ ] `MessageBoard/index.tsx`: garantir que o `error` do `usePostMessage` exibe
  a mensagem da API no `<S.ErrorMsg>` do formulário

> **Nota:** Os componentes já renderizam `(error as Error).message` — a `ApiError`
> construída em `api.ts` usa o campo `detail` do JSON de resposta FastAPI como mensagem.
> Portanto, as mensagens amigáveis do backend aparecerão automaticamente no frontend
> sem alteração de código, apenas verificação.

---

## Schema do Banco (mudanças)

```sql
-- Nova extensão (idempotente)
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Novo índice único funcional em rsvp
CREATE UNIQUE INDEX ix_rsvp_full_name_normalized
  ON rsvp (lower(unaccent(full_name)));

-- Tabela rsvp: sem mudança de colunas
-- Tabela messages: sem mudança de colunas
```

---

## Estimativa de Tempo

| Fase | Tarefas | Tempo |
|---|---|---|
| 6.1 Migration `unaccent` | 3 tasks | 30–45 min |
| 6.2 Validação dupla RSVP | 5 tasks | 1–2h |
| 6.3 Módulo `profanity.py` | 4 tasks | 2–3h |
| 6.4 Integração messages | 3 tasks | 30–45 min |
| 6.5 Frontend (verificação) | 2 tasks | 30 min |
| **TOTAL ÉPICO 6** | **17 tasks** | **~5–7h** |

---

## Checklist de Conclusão

- [ ] RSVP com e-mail duplicado → erro `"Este e-mail já foi registrado."`
- [ ] RSVP com nome duplicado (variações de acento/case) → erro `"Este nome já está na lista de convidados."`
- [ ] Índice funcional `ix_rsvp_full_name_normalized` existe no banco
- [ ] Mensagem com palavrão em português → erro `"Sua mensagem contém conteúdo inadequado."`
- [ ] Variação com leet-speak (`@`, `3`) detectada
- [ ] Texto limpo aceito normalmente
- [ ] Frontend exibe os erros corretamente nos componentes existentes
- [ ] Testes unitários de `profanity.py` passando
- [ ] Nenhum vazamento de informação (qual palavra foi detectada não é revelado)

---

## NFRs Cobertos neste Épico

| Tag | Requisito | Implementação |
|---|---|---|
| SEC-02 | Prevenção de abuso de formulário | Deduplicação de RSVP por e-mail + nome normalizado |
| SEC-03 | Moderação de conteúdo UGC | Filtro de palavrão em `author_name` e `content` |
| RESP-01 | Mensagens de erro amigáveis | HTTP 422 com `detail` legível, sem expor detalhes internos |

---

## Dependências

- Épico 5 concluído ✅ (`RsvpForm` e `MessageBoard` funcionais)
- PostgreSQL com extensão `unaccent` disponível (nativa em `postgres:16-alpine` ✅)
- Sem dependências externas novas no backend (usa `unicodedata` da stdlib Python)
- Sem dependências novas no frontend

---

## Próximos Passos

Com o Épico 6 concluído, todos os épicos do backlog original + moderação estarão entregues.

Melhorias possíveis pós-lançamento:
- Painel administrativo para o casal visualizar RSVPs, mensagens e deletar conteúdo impróprio
- Rate limiting por IP nos endpoints de RSVP e mensagens (`slowapi`)
- Lista de palavras proibidas configurável via variável de ambiente (sem rebuild)

---

**Status:** Aguardando início da implementação  
**Prioridade:** MÉDIA — proteção de qualidade antes do go-live  
**Dependências:** Épico 5 ✅
