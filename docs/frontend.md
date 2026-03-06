# Frontend — Guia de Desenvolvimento

## Estrutura de Diretórios

```
frontend/src/
├── components/          # Componentes reutilizáveis
│   └── Layout/
│       └── MainLayout/
│           ├── index.tsx
│           └── styles.ts
├── pages/               # Componentes de rota (1 por rota)
│   ├── Home/
│   │   ├── index.tsx
│   │   └── styles.ts
│   └── NotFound/
│       ├── index.tsx
│       └── styles.ts
├── stores/              # Zustand state stores
│   └── authStore.ts
├── lib/
│   └── api.ts           # Axios client com interceptors
├── types/
│   └── api.ts           # Tipos TypeScript compartilhados
├── styles/
│   ├── theme.ts         # Design tokens
│   ├── global.ts        # GlobalStyles (Styled Components)
│   └── styled.d.ts      # Augmentação do DefaultTheme
├── App.tsx              # Definição de rotas
└── main.tsx             # Entry point
```

---

## Adicionando uma nova página

### 1. Criar a pasta da página

```
src/pages/Products/
  index.tsx
  styles.ts
```

### 2. Criar o componente

```tsx
// src/pages/Products/index.tsx
import * as S from './styles'

export function ProductsPage() {
  return (
    <S.Container>
      <S.Title>Produtos</S.Title>
    </S.Container>
  )
}
```

### 3. Criar os estilos

```ts
// src/pages/Products/styles.ts
import styled from 'styled-components'

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`

export const Title = styled.h1`
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
`
```

### 4. Registrar a rota em `App.tsx`

```tsx
import { ProductsPage } from '@/pages/Products'

<Route path="/products" element={<ProductsPage />} />
```

---

## Fazendo chamadas à API (TanStack Query)

### Criar um custom hook

```ts
// src/hooks/useProducts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface Product {
  id: string
  name: string
  price: number
}

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data } = await api.get<Product[]>('/products')
      return data
    },
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: { name: string; price: number }) => {
      const { data } = await api.post<Product>('/products', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
```

### Usar no componente

```tsx
import { useProducts } from '@/hooks/useProducts'
import { Table } from 'antd'

export function ProductsPage() {
  const { data, isLoading } = useProducts()

  return <Table dataSource={data} loading={isLoading} rowKey="id" />
}
```

---

## Gerenciamento de Formulários (React Hook Form + Zod)

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  price: z.number().positive('Preço deve ser positivo'),
})

type FormValues = z.infer<typeof schema>

export function CreateProductForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = (data: FormValues) => {
    console.log(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} placeholder="Nome" />
      {errors.name && <span>{errors.name.message}</span>}
      <button type="submit">Criar</button>
    </form>
  )
}
```

---

## Convenções

- **Texto da UI em pt-BR:** Todos os labels, botões, mensagens de erro, toasts.
- **Sem valores hex hardcoded:** Sempre usar `${({ theme }) => theme.colors.*}`.
- **Separação lógica/visual:** `index.tsx` para lógica, `styles.ts` para estilo.
- **Import de estilos como namespace:** `import * as S from './styles'`.
- **AntD para componentes complexos:** Tables, DatePickers, Selects, Modals.
- **Styled Components para o resto:** Wrappers, layouts, tipografia customizada.
- **Sem `useEffect` para data fetching:** Use TanStack Query.
