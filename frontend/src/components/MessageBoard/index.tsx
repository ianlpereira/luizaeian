import { useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMessages, usePostMessage } from '@/hooks/useMessages'
import { messageSchema, type MessageFormValues } from '@/components/MessageForm/schema'
import { MessageCard } from './MessageCard'
import * as S from './styles'

/**
 * MessageBoard — Mural de recados dos convidados.
 *
 * Exibe feed de mensagens (mais recentes no topo) com polling a cada 10 s.
 * Permite postar nova mensagem via formulário inline.
 * SEC-01: sanitização feita no hook usePostMessage.
 */
export function MessageBoard() {
  const feedRef = useRef<HTMLDivElement>(null)
  const { data: messages, isLoading } = useMessages()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: { author_name: '', content: '' },
  })

  const { mutate, isPending, error } = usePostMessage()

  const contentValue = watch('content') ?? ''

  const onSubmit = (data: MessageFormValues) => {
    mutate(data, {
      onSuccess: () => {
        reset()
        // Scroll suave ao topo do feed
        feedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      },
    })
  }

  return (
    <S.Section id="mural">
      <S.Inner>
        <S.SectionTitle>Mural de Recados</S.SectionTitle>
        <S.SectionSubtitle>Deixe uma mensagem para os noivos 💌</S.SectionSubtitle>

        {/* ── Formulário de nova mensagem ─────────────────────────────────── */}
        <S.MessageForm onSubmit={handleSubmit(onSubmit)} noValidate>
          <S.FormRow>
            <S.Input
              type="text"
              {...register('author_name')}
              placeholder="Seu nome"
              aria-label="Seu nome"
            />
          </S.FormRow>
          {errors.author_name && <S.ErrorMsg>{errors.author_name.message}</S.ErrorMsg>}

          <S.Textarea
            {...register('content')}
            placeholder="Escreva sua mensagem para Luiza e Ian…"
            aria-label="Mensagem"
          />
          {errors.content && <S.ErrorMsg>{errors.content.message}</S.ErrorMsg>}

          <S.FormFooter>
            <S.CharCount $over={contentValue.length > 500}>
              {contentValue.length}/500
            </S.CharCount>
            <S.SendButton type="submit" disabled={isPending}>
              {isPending ? 'Enviando…' : 'Enviar Mensagem'}
            </S.SendButton>
          </S.FormFooter>

          {error && <S.ErrorMsg>{(error as Error).message}</S.ErrorMsg>}
        </S.MessageForm>

        {/* ── Feed de mensagens ───────────────────────────────────────────── */}
        <S.Feed ref={feedRef}>
          {isLoading && (
            <>
              <S.Skeleton />
              <S.Skeleton />
              <S.Skeleton />
            </>
          )}

          {!isLoading && messages?.length === 0 && (
            <S.EmptyState>
              Seja o primeiro a deixar uma mensagem! 🎊
            </S.EmptyState>
          )}

          {messages?.map(message => (
            <MessageCard key={message.id} message={message} />
          ))}
        </S.Feed>
      </S.Inner>
    </S.Section>
  )
}
