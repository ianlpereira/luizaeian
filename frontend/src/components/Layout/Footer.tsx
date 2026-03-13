import { eventInfo } from '@/data/event'
import * as S from './Footer.styles'

export function Footer() {
  const year = new Date().getFullYear()
  const weddingYear = new Date(eventInfo.date).getFullYear()

  return (
    <S.Footer>
      <S.Monogram>L &amp; I</S.Monogram>
      <S.FooterDate>{weddingYear} · São Luís, MA</S.FooterDate>
      <S.FooterCopy>
        Feito com <span aria-hidden="true">♥</span> para Luiza &amp; Ian · {year}
      </S.FooterCopy>
    </S.Footer>
  )
}
