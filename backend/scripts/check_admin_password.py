"""
Script de execução única (não faz parte da cadeia de migrations do Alembic).

Confere se um hash bcrypt e uma senha combinam, sem gastar tentativa nenhuma no
endpoint de login. Serve para diagnosticar 401 na área administrativa: cole o
valor de ADMIN_PASSWORD_HASH do painel do Render e digite a senha que você vem
tentando.

Nada é enviado para lugar nenhum — a verificação acontece localmente.

Uso:
    cd backend && python -m scripts.check_admin_password

Ou, sem Python local:
    docker compose run --rm --no-deps --entrypoint python backend \
        -m scripts.check_admin_password
"""

import getpass
import sys

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def main() -> None:
    stored_hash = input("Cole o ADMIN_PASSWORD_HASH do Render: ").strip()

    if not stored_hash:
        sys.exit("Nenhum hash informado.")

    # Espaço ou quebra de linha no fim é a causa mais comum de 401 depois de um
    # copiar-e-colar — por isso o strip acima e o aviso aqui.
    raw = stored_hash
    if raw != raw.strip():
        print("Aviso: o valor colado tinha espaços nas pontas.")

    if not stored_hash.startswith("$2"):
        sys.exit(
            "Isso não é um hash bcrypt (um hash começa com $2b$).\n"
            "Se o campo do Render contém a senha em texto puro, é essa a causa "
            "do 401: gere o hash com `python -m scripts.hash_admin_password` e "
            "coloque o hash no lugar."
        )

    print(f"Hash reconhecido ({len(stored_hash)} caracteres).")

    password = getpass.getpass("Digite a senha que você está tentando: ")

    try:
        ok = pwd_context.verify(password, stored_hash)
    except ValueError as exc:
        sys.exit(f"O hash está malformado: {exc}")

    print()
    if ok:
        print("A SENHA CONFERE com esse hash.")
        print("Então o 401 vem do usuário: confira ADMIN_USERNAME no Render,")
        print("inclusive espaços invisíveis no começo ou no fim do valor.")
    else:
        print("A SENHA NAO CONFERE com esse hash.")
        print("Gere um par novo com `python -m scripts.hash_admin_password`,")
        print("cole o hash no Render e use a senha que você digitou lá.")


if __name__ == "__main__":
    main()
