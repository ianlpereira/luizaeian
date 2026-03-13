import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSubmitRsvp } from '@/hooks/useRsvp'
import { rsvpSchema, type RsvpFormValues } from './schema'
import * as S from './styles'

/**
 * RsvpForm — Formulário de confirmação de presença.
 *
 * Fluxo:
 *  1. Convidado preenche nome, e-mail e status (confirmed | declined)
 *  2. Se confirmed → sub-form dinâmico de acompanhantes (useFieldArray)
 *  3. POST /api/rsvp → estado de sucesso ou erro amigável
 *
 * SEC-01: sanitização feita no hook useSubmitRsvp antes de enviar.
 */
export function RsvpForm() {
  const { mutate, isPending, isSuccess, error } = useSubmitRsvp()

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<RsvpFormValues>({
    resolver: zodResolver(rsvpSchema),
    defaultValues: { companions: [] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'companions' })
  const status = watch('status')

  const onSubmit = (data: RsvpFormValues) => mutate(data)

  // ── Estado de sucesso ──────────────────────────────────────────────────────
  if (isSuccess) {
    const isConfirmed = watch('status') === 'confirmed'
    return (
      <S.Section id="rsvp">
        <S.Inner>
          <S.SuccessBox>
            <S.SuccessEmoji>{isConfirmed ? '🎉' : '💌'}</S.SuccessEmoji>
            <S.SuccessTitle>
              {isConfirmed ? 'Presença confirmada!' : 'Obrigado por nos avisar!'}
            </S.SuccessTitle>
            <S.SuccessText>
              {isConfirmed
                ? 'Mal podemos esperar para te ver. Até lá! 💛'
                : 'Sua resposta foi registrada. Você fará muita falta!'}
            </S.SuccessText>
          </S.SuccessBox>
        </S.Inner>
      </S.Section>
    )
  }

  return (
    <S.Section id="rsvp">
      <S.Inner>
        <S.SectionTitle>Confirme sua Presença</S.SectionTitle>
        <S.SectionSubtitle>
          Confirme até <strong>1º de julho de 2026</strong>
        </S.SectionSubtitle>

        <S.Form onSubmit={handleSubmit(onSubmit)} noValidate>

          {/* Nome completo */}
          <S.Field>
            <label htmlFor="rsvp-name">Nome completo *</label>
            <input
              id="rsvp-name"
              type="text"
              {...register('full_name')}
              placeholder="Seu nome completo"
            />
            {errors.full_name && <S.ErrorMsg>{errors.full_name.message}</S.ErrorMsg>}
          </S.Field>

          {/* E-mail */}
          <S.Field>
            <label htmlFor="rsvp-email">E-mail *</label>
            <input
              id="rsvp-email"
              type="email"
              {...register('email')}
              placeholder="seu@email.com"
            />
            {errors.email && <S.ErrorMsg>{errors.email.message}</S.ErrorMsg>}
          </S.Field>

          {/* Status */}
          <S.Field>
            <label>Confirmação *</label>
            <S.StatusGroup>
              <label>
                <input {...register('status')} type="radio" value="confirmed" />
                ✅ Vou comparecer
              </label>
              <label>
                <input {...register('status')} type="radio" value="declined" />
                ❌ Não poderei ir
              </label>
            </S.StatusGroup>
            {errors.status && <S.ErrorMsg>{errors.status.message}</S.ErrorMsg>}
          </S.Field>

          {/* Sub-form de acompanhantes — só exibido para 'confirmed' */}
          {status === 'confirmed' && (
            <S.CompanionsSection>
              <S.CompanionsTitle>Acompanhantes</S.CompanionsTitle>

              {fields.map((field, index) => (
                <S.CompanionRow key={field.id}>
                  <input
                    type="text"
                    {...register(`companions.${index}.name`)}
                    placeholder={`Acompanhante ${index + 1}`}
                  />
                  <S.RemoveButton
                    type="button"
                    aria-label="Remover acompanhante"
                    onClick={() => remove(index)}
                  >
                    ✕
                  </S.RemoveButton>
                </S.CompanionRow>
              ))}

              <S.AddCompanionButton
                type="button"
                onClick={() => append({ name: '' })}
              >
                + Adicionar acompanhante
              </S.AddCompanionButton>
            </S.CompanionsSection>
          )}

          {/* Erro global (ex: e-mail duplicado) */}
          {error && (
            <S.GlobalError>
              {(error as Error).message}
            </S.GlobalError>
          )}

          <S.SubmitButton type="submit" disabled={isPending}>
            {isPending ? 'Enviando…' : 'Confirmar Presença'}
          </S.SubmitButton>

        </S.Form>
      </S.Inner>
    </S.Section>
  )
}
