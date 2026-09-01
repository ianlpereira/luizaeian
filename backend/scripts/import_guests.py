"""
Importa a lista de convidados da planilha dos noivos para a tabela `guest`.

Script de execução manual (não faz parte da cadeia de migrations). A planilha
não fica no repositório, então o caminho do CSV é sempre um argumento.

Cada execução substitui o conteúdo inteiro da tabela: apaga tudo e reinsere.
Como nenhuma outra tabela referencia `guest` e nada é escrito nela pela API,
isso é seguro e torna o script idempotente — rodar duas vezes deixa o mesmo
resultado.

Uso:
    cd backend && python -m scripts.import_guests --csv "../.localfiles/Lista.csv"
    cd backend && python -m scripts.import_guests --csv "..." --dry-run
"""

import argparse
import asyncio
import csv
from collections import Counter
from typing import Any

# `app.core.database` abre a engine no import e exige o driver asyncpg. Como a
# leitura e a validação da planilha não precisam de banco, o import fica dentro
# de `main` — assim `parse_row` e `assign_groups` podem ser importados e
# testados sozinhos.

# ── Mapas da planilha (pt-BR) para os valores do banco (inglês) ───────────────
#
# `Convite?` acumula dois papéis: diz o formato do convite E abre um grupo.
# Aqui só o formato é resolvido; o agrupamento fica em `assign_groups`.
# Célula vazia conta como convite digital.
INVITE_TYPE = {"X": "physical", "D": "digital", "": "digital"}
SIDE = {"Noiva": "bride", "Noivo": "groom"}
AGE_GROUP = {"Adulto": "adult", "Criança": "child"}
ATTENDANCE = {"": None, "Incerteza": "uncertain", "Não": "declined"}
SENT_STATUS = {"Enviado": "sent", "Pendente": "pending"}
# Save the Date aceita célula vazia (ninguém marcou ainda); o convite, não.
SAVE_THE_DATE_STATUS = {**SENT_STATUS, "": None}

# Marcas que abrem um grupo novo. Uma célula vazia continua o grupo anterior.
GROUP_HEAD_MARKS = ("X", "D")


class GuestCsvError(ValueError):
    """Erro de dados na planilha, sempre com o número da linha."""


def _lookup(table: dict[str, Any], value: str, column: str, line: int) -> Any:
    if value not in table:
        raise GuestCsvError(
            f"Linha {line}: valor '{value}' não reconhecido na coluna '{column}'. "
            f"Esperado um de: {', '.join(repr(k) for k in table)}."
        )
    return table[value]


def parse_row(row: dict[str, str], sort_order: int) -> dict[str, Any]:
    """
    Converte uma linha da planilha nos campos do model, menos os de grupo.

    Todo valor passa por `.strip()` antes do mapeamento: a planilha tem células
    como "Não " com espaço à direita, que sem isso viram valor desconhecido.
    `line` é a linha no arquivo contando o cabeçalho, para o erro apontar o
    lugar certo quando aberto no Excel.
    """
    line = sort_order + 1
    cell = {key: (value or "").strip() for key, value in row.items()}

    name = cell.get("Nome do convidado", "")
    if not name:
        raise GuestCsvError(f"Linha {line}: convidado sem nome.")

    return {
        "sort_order": sort_order,
        "full_name": name,
        "invite_mark": cell.get("Convite?", ""),
        "invite_type": _lookup(INVITE_TYPE, cell.get("Convite?", ""), "Convite?", line),
        "side": _lookup(SIDE, cell.get("Origem", ""), "Origem", line),
        "age_group": _lookup(AGE_GROUP, cell.get("Idade", ""), "Idade", line),
        "attendance": _lookup(
            ATTENDANCE, cell.get("Comparecimento", ""), "Comparecimento", line
        ),
        "save_the_date_status": _lookup(
            SAVE_THE_DATE_STATUS, cell.get("SVD - Status", ""), "SVD - Status", line
        ),
        "invite_sent_status": _lookup(
            SENT_STATUS, cell.get("Convite Digital", ""), "Convite Digital", line
        ),
    }


def assign_groups(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """
    Resolve o agrupamento por família a partir da ordem das linhas.

    Uma linha marcada com X ou D é o titular e abre um grupo; as linhas sem
    marca logo abaixo pertencem a ele. É esse encadeamento que dá sentido às
    linhas "Esposa" e "Namorado", que não trazem sobrenome.

    Preenche `group_index`, `group_label` e `is_group_head` na primeira passada
    e `group_size` na segunda — o tamanho só é conhecido no fim do bloco.
    Consome e descarta a chave auxiliar `invite_mark`.
    """
    if not rows:
        return []

    if rows[0]["invite_mark"] not in GROUP_HEAD_MARKS:
        raise GuestCsvError(
            "Linha 2: a primeira linha da planilha precisa ser um titular de convite "
            "(coluna 'Convite?' com X ou D), senão não há grupo a que associá-la."
        )

    group_index = 0
    label = ""
    for row in rows:
        if row.pop("invite_mark") in GROUP_HEAD_MARKS:
            group_index += 1
            label = row["full_name"]
            row["is_group_head"] = True
        else:
            row["is_group_head"] = False

        row["group_index"] = group_index
        row["group_label"] = label

    sizes = Counter(row["group_index"] for row in rows)
    for row in rows:
        row["group_size"] = sizes[row["group_index"]]

    return rows


def load_csv(path: str) -> list[dict[str, Any]]:
    """Lê a planilha e devolve as linhas já prontas para virar `Guest`."""
    # utf-8-sig porque o arquivo exportado do Google Sheets vem com BOM.
    with open(path, newline="", encoding="utf-8-sig") as handle:
        raw = list(csv.DictReader(handle))

    return assign_groups(
        [parse_row(row, sort_order) for sort_order, row in enumerate(raw, start=1)]
    )


def summarize(rows: list[dict[str, Any]]) -> str:
    invite_types = Counter(row["invite_type"] for row in rows)
    sides = Counter(row["side"] for row in rows)
    attendance = Counter(row["attendance"] for row in rows)
    invites = Counter(row["invite_sent_status"] for row in rows)

    return "\n".join(
        [
            f"Pessoas:            {len(rows)}",
            f"Grupos:             {sum(1 for row in rows if row['is_group_head'])}",
            f"Convite físico:     {invite_types['physical']}",
            f"Convite digital:    {invite_types['digital']}",
            f"Lado da noiva:      {sides['bride']}",
            f"Lado do noivo:      {sides['groom']}",
            f"Não comparecem:     {attendance['declined']}",
            f"Incertos:           {attendance['uncertain']}",
            f"Convites enviados:  {invites['sent']}",
            f"Convites pendentes: {invites['pending']}",
        ]
    )


async def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--csv", required=True, help="Caminho do CSV da lista")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Só lê e valida a planilha, sem tocar no banco",
    )
    args = parser.parse_args()

    rows = load_csv(args.csv)
    print(summarize(rows))

    if args.dry_run:
        print("\n(dry-run — nada foi gravado)")
        return

    from sqlalchemy import delete

    from app.core.database import AsyncSessionLocal
    from app.models.guest import Guest

    async with AsyncSessionLocal() as db:
        removed = await db.execute(delete(Guest))
        db.add_all(Guest(**row) for row in rows)
        await db.commit()

    print(f"\nRemovidos: {removed.rowcount} · Inseridos: {len(rows)}")


if __name__ == "__main__":
    asyncio.run(main())
