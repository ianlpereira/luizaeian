# Project Instructions & Coding Standards

## 1. General Philosophy
- **KISS (Keep It Simple, Stupid):** Do not overengineer. We are building an internal tool focused on speed and data density.
- **Type Safety:** TypeScript strict mode is mandatory. Python type hints are mandatory.
- **English Codebase:** All variables, functions, and comments must be in English.
- **Portuguese UI:** All user-facing text (buttons, labels, toasts) must be in Portuguese (pt-BR).

## 2. Backend (FastAPI + Python)
- **Structure:** Use a layered architecture: `routers` -> `services` (business logic) -> `repositories` (DB access) -> `models` (SQLAlchemy).
- **Async:** Use `async/await` for all I/O operations (DB queries).
- **Pydantic:** Use Pydantic v2 `BaseModel` for all Schemas (Request/Response). Config: `from_attributes = True` (formerly `orm_mode`).
- **Error Handling:** Never return 500 for expected errors. Use `HTTPException` with clear detail messages.
- **Dependency Injection:** Use FastAPI `Depends` for Database sessions and Auth services.
- **Migrations:** ALWAYS use Alembic for database migrations:
  - **Auto-generate migration:** `docker compose exec backend alembic revision --autogenerate -m "description"`
  - **Apply migrations:** `docker compose exec backend alembic upgrade head`
  - **Rollback one migration:** `docker compose exec backend alembic downgrade -1`
  - **Check current version:** `docker compose exec backend alembic current`
  - Migrations are automatically created based on model changes.

## 3. Frontend (React + Styled Components)
- **Styling Authority:** - Use **Styled Components** for all custom layout and styling.
  - Use **Ant Design (AntD)** for complex logic components (DataGrid/Table, DatePicker, Select, Modals).
  - DO NOT use CSS modules or Tailwind classes.
- **Component Structure:**
  - Logic and View must be separated via Styled Components.
  - Example file structure:
    ```
    /MyComponent
      index.tsx  (React Logic + JSX)
      styles.ts  (Styled Components definitions only)
    ```
- **Import Style:** Import styles as an object namespace: `import * as S from './styles';`.
  - Usage: `<S.Container>...</S.Container>`
- **Theme:** Always use `${props => props.theme.colors...}`. Do not hardcode hex values in components.
- **State Management:** - Server State: Use `TanStack Query` (React Query). Avoid `useEffect` for data fetching.
  - Form State: Use `React Hook Form` controlled by `Zod` schemas.

## 4. Database (PostgreSQL)
- **Naming:** Snake_case for tables and columns.
- **Money:** Always use `DECIMAL` or `NUMERIC` types for currency. Never `FLOAT`.
- **Dates:** Store as UTC (or naive dates if purely explicit), handle timezone display on Frontend.

## 5. Docker & Environment
- The application must run via `docker-compose up`.
- Ensure hot-reload is active for both Frontend (Vite) and Backend (FastAPI reload) in the development environment.

## 6. Documentation
- All new features must be documented in the `docs/` folder with clear instructions and code snippets.
- Update `README.md` with any new setup instructions or architectural changes.
- All features and epics must have a corresponding summary and planning document in `docs/`.
- The status of the project must be updated in `STATUS.md` after each significant change or completion of an epic.