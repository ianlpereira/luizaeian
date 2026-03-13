import { useCountdown } from '@/hooks/useCountdown'
import { eventInfo } from '@/data/event'
import * as S from './styles'

const PAD = (n: number) => String(n).padStart(2, '0')

/**
 * Contador regressivo até a data do casamento.
 * Exibe dias · horas · minutos · segundos.
 * Quando isOver = true, exibe mensagem de celebração.
 */
export function Countdown() {
  const { days, hours, minutes, seconds, isOver } = useCountdown(eventInfo.date)

  if (isOver) {
    return (
      <S.Section id="contagem">
        <S.Wrapper>
          <S.OverMessage>Chegou o grande dia! 💍</S.OverMessage>
        </S.Wrapper>
      </S.Section>
    )
  }

  return (
    <S.Section id="contagem">
      <S.Wrapper>
        <S.Eyebrow>Contagem regressiva</S.Eyebrow>
        <S.Label>faltam</S.Label>
        <S.Track>
          <S.Block>
            <S.Number>{PAD(days)}</S.Number>
            <S.Unit>dias</S.Unit>
          </S.Block>
          <S.Separator>:</S.Separator>
          <S.Block>
            <S.Number>{PAD(hours)}</S.Number>
            <S.Unit>horas</S.Unit>
          </S.Block>
          <S.Separator>:</S.Separator>
          <S.Block>
            <S.Number>{PAD(minutes)}</S.Number>
            <S.Unit>min</S.Unit>
          </S.Block>
          <S.Separator>:</S.Separator>
          <S.Block>
            <S.Number>{PAD(seconds)}</S.Number>
            <S.Unit>seg</S.Unit>
          </S.Block>
        </S.Track>
      </S.Wrapper>
    </S.Section>
  )
}
