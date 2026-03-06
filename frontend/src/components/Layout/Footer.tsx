import * as S from './Footer.styles'

export function Footer() {
  return (
    <S.Footer>
      Feito com <span>♥</span> para Luiza &amp; Ian · {new Date().getFullYear()}
    </S.Footer>
  )
}
