import { Outlet } from 'react-router-dom'
import * as S from './styles'

export function MainLayout() {
  return (
    <S.Wrapper>
      <S.Header>
        <S.Logo>Luizaeian</S.Logo>
      </S.Header>
      <S.Main>
        <Outlet />
      </S.Main>
    </S.Wrapper>
  )
}
