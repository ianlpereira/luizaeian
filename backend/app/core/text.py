"""
Normalização de texto para comparar nomes de pessoas.

Espelha `normalizeText` de frontend/src/utils/format.ts, com um passo a mais que
só o backend precisa: desescapar entidades HTML.

Os nomes chegam ao banco por dois caminhos que gravam de formas diferentes:

- `guest.full_name` vem cru da planilha (`scripts/import_guests.py`)
- `rsvp.full_name` passa por `html.escape` antes do INSERT (`routers/rsvp.py`)

Então "Nájila D'Escórcio" está gravado como `Nájila D&#x27;Escórcio` de um lado e
literal do outro. Sem `html.unescape`, o casamento entre lista e confirmação
simplesmente não acontece para qualquer nome com apóstrofo, `&` ou aspas.
"""

import html
import re
import unicodedata

_WHITESPACE = re.compile(r"\s+")


def normalize_name(value: str) -> str:
    """
    Forma comparável de um nome: sem entidade HTML, sem acento, minúsculo.

    Colapsa espaços repetidos para que "Ana  Maria" case com "Ana Maria".
    """
    decoded = html.unescape(value)
    # NFD separa a letra do acento; descartar a categoria Mn (marca sem largura)
    # remove só o acento e preserva a letra.
    stripped = "".join(
        char
        for char in unicodedata.normalize("NFD", decoded)
        if unicodedata.category(char) != "Mn"
    )
    return _WHITESPACE.sub(" ", stripped).strip().lower()
