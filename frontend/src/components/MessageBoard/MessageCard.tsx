import type { Message } from '@/types/message'
import { getInitials, getAvatarColor } from '@/utils/avatar'
import * as S from './styles'

interface MessageCardProps {
  message: Message
}

export function MessageCard({ message }: MessageCardProps) {
  const initials = getInitials(message.author_name)
  const avatarColor = getAvatarColor(message.author_name)
  const date = new Date(message.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  return (
    <S.Card>
      <S.Avatar $color={avatarColor}>{initials}</S.Avatar>
      <S.CardBody>
        <S.CardAuthor>{message.author_name}</S.CardAuthor>
        <S.CardContent>{message.content}</S.CardContent>
        <S.CardDate dateTime={message.created_at}>{date}</S.CardDate>
      </S.CardBody>
    </S.Card>
  )
}
