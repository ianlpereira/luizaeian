"""
Script de execução única (não faz parte da cadeia de migrations do Alembic).

Gera o hash bcrypt da senha do administrador para ser colado em
ADMIN_PASSWORD_HASH (backend/.env em dev, painel do Render em produção).

A senha é lida via getpass — nunca por argumento de linha de comando, que
ficaria registrado no histórico do shell e visível em `ps`.

Uso:
    cd backend && python -m scripts.hash_admin_password
"""

import getpass
import sys

from passlib.context import CryptContext

# Mesmo contexto usado por app.core.security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

MIN_LENGTH = 12
# O bcrypt trunca silenciosamente a senha em 72 bytes. Sem esse limite, uma senha
# "errada" que compartilhe os 72 primeiros bytes conseguiria fazer login.
MAX_BYTES = 72


def main() -> None:
    password = getpass.getpass("Senha do administrador: ")
    confirmation = getpass.getpass("Confirme a senha: ")

    if password != confirmation:
        sys.exit("As senhas não conferem.")

    if len(password) < MIN_LENGTH:
        sys.exit(f"Senha muito curta (mínimo {MIN_LENGTH} caracteres).")

    if len(password.encode("utf-8")) > MAX_BYTES:
        sys.exit(f"Senha muito longa (máximo {MAX_BYTES} bytes).")

    print()
    print("Cole o valor abaixo em ADMIN_PASSWORD_HASH:")
    print()
    print(pwd_context.hash(password))
    print()
    print("Atenção: no docker-compose use env_file (backend/.env).")
    print("Na lista `environment:` os cifrões do hash seriam interpolados.")


if __name__ == "__main__":
    main()
