import { Link } from 'react-router-dom'
import * as S from './styles'

export function NotFoundPage() {
  return (
    <S.Container>
      <S.Code>404</S.Code>
      <S.Title>Página não encontrada</S.Title>
      <S.Subtitle>O endereço que você acessou não existe.</S.Subtitle>
      <S.BackLink as={Link} to="/">
        ← Voltar ao início
      </S.BackLink>
    </S.Container>
  )
}
