import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'
import * as S from './styles'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <S.Container>
      <Result
        status="404"
        title="404"
        subTitle="Desculpe, a página que você visitou não existe."
        extra={
          <Button type="primary" onClick={() => navigate('/')}>
            Voltar ao início
          </Button>
        }
      />
    </S.Container>
  )
}
