import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { useAdminLogin } from '@/hooks/useAdminAuth'
import { adminLoginSchema, type AdminLoginValues } from './schema'
import * as S from './styles'

/**
 * Tela de login da área administrativa.
 *
 * Usuário único, credenciais no ambiente do backend. A mensagem de erro vem
 * pronta do hook — nunca reexibimos o que foi digitado.
 */
export function AdminLogin() {
  const { mutate, isPending, errorMessage } = useAdminLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginValues>({ resolver: zodResolver(adminLoginSchema) })

  const onSubmit = (values: AdminLoginValues) => mutate(values)

  return (
    <S.Screen>
      <S.Card>
        <S.Title>Área administrativa</S.Title>
        <S.Subtitle>Luiza &amp; Ian</S.Subtitle>

        <S.Form onSubmit={handleSubmit(onSubmit)} noValidate>
          <S.Field>
            <label htmlFor="admin-username">Usuário</label>
            <input
              id="admin-username"
              type="text"
              autoComplete="username"
              autoFocus
              {...register('username')}
            />
            {errors.username && <S.ErrorMsg>{errors.username.message}</S.ErrorMsg>}
          </S.Field>

          <S.Field>
            <label htmlFor="admin-password">Senha</label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              {...register('password')}
            />
            {errors.password && <S.ErrorMsg>{errors.password.message}</S.ErrorMsg>}
          </S.Field>

          {errorMessage && <S.GlobalError role="alert">{errorMessage}</S.GlobalError>}

          <S.SubmitButton type="submit" disabled={isPending}>
            {isPending ? 'Entrando…' : 'Entrar'}
          </S.SubmitButton>
        </S.Form>
      </S.Card>
    </S.Screen>
  )
}
