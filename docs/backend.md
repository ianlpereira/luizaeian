# Backend — Guia de Desenvolvimento

## Estrutura de Diretórios

```
backend/
├── app/
│   ├── core/
│   │   ├── config.py       # Settings via pydantic-settings
│   │   └── database.py     # Engine, Session, Base
│   ├── models/
│   │   └── base.py         # TimestampMixin, UUIDMixin
│   ├── schemas/            # Pydantic v2 request/response schemas
│   ├── repositories/
│   │   └── base.py         # BaseRepository com CRUD genérico
│   ├── services/           # Lógica de negócio
│   ├── routers/
│   │   └── health.py       # Health check endpoint
│   └── main.py             # FastAPI app + middlewares
├── alembic/
│   ├── versions/           # Arquivos de migração gerados
│   ├── env.py
│   └── script.py.mako
├── tests/
│   └── test_health.py
├── alembic.ini
├── pyproject.toml
├── requirements.txt
└── requirements-dev.txt
```

---

## Adicionando um novo recurso

### 1. Criar o Model (SQLAlchemy)

```python
# app/models/product.py
from sqlalchemy import String, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin

class Product(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "products"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
```

### 2. Criar os Schemas (Pydantic v2)

```python
# app/schemas/product.py
from uuid import UUID
from decimal import Decimal
from pydantic import BaseModel

class ProductCreate(BaseModel):
    name: str
    price: Decimal

class ProductResponse(BaseModel):
    id: UUID
    name: str
    price: Decimal

    model_config = {"from_attributes": True}
```

### 3. Criar o Repository

```python
# app/repositories/product.py
from app.repositories.base import BaseRepository
from app.models.product import Product

class ProductRepository(BaseRepository[Product]):
    def __init__(self, session):
        super().__init__(Product, session)
```

### 4. Criar o Service

```python
# app/services/product.py
from uuid import UUID
from fastapi import HTTPException, status
from app.repositories.product import ProductRepository
from app.schemas.product import ProductCreate, ProductResponse
from app.models.product import Product

class ProductService:
    def __init__(self, repo: ProductRepository) -> None:
        self.repo = repo

    async def create(self, data: ProductCreate) -> ProductResponse:
        product = Product(**data.model_dump())
        created = await self.repo.create(product)
        return ProductResponse.model_validate(created)

    async def get_by_id(self, id: UUID) -> ProductResponse:
        product = await self.repo.get_by_id(id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Produto não encontrado",
            )
        return ProductResponse.model_validate(product)
```

### 5. Criar o Router

```python
# app/routers/products.py
from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.repositories.product import ProductRepository
from app.services.product import ProductService
from app.schemas.product import ProductCreate, ProductResponse

router = APIRouter(prefix="/products", tags=["products"])

def get_service(db: AsyncSession = Depends(get_db)) -> ProductService:
    return ProductService(ProductRepository(db))

@router.post("/", response_model=ProductResponse, status_code=201)
async def create_product(
    data: ProductCreate,
    service: ProductService = Depends(get_service),
) -> ProductResponse:
    return await service.create(data)
```

### 6. Registrar o router em `main.py`

```python
from app.routers import products
app.include_router(products.router, prefix="/api")
```

### 7. Gerar e aplicar a migração

```bash
docker compose exec backend alembic revision --autogenerate -m "add products table"
docker compose exec backend alembic upgrade head
```

---

## Convenções

- **Async em tudo:** Todos os endpoints e métodos de repositório devem ser `async`.
- **HTTPException:** Usar para erros esperados. Nunca deixar um `500` sair para o cliente.
- **Schemas separados:** `Create`, `Update`, `Response` como schemas distintos.
- **Valores monetários:** Sempre `NUMERIC(10, 2)` no banco e `Decimal` no Python.
- **Datas:** Armazenar em UTC usando `DateTime(timezone=True)`.
