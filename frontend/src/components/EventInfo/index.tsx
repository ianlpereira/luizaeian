import { EventCard } from '@/components/EventCard'
import { eventInfo } from '@/data/event'
import * as S from './styles'

/**
 * Seção de logística do evento: dois EventCards (cerimônia + recepção)
 * e strip de dress code.
 */
export function EventInfo() {
  const dateFormatted = new Date(`${eventInfo.date}T00:00:00`).toLocaleDateString(
    'pt-BR',
    { day: '2-digit', month: 'long', year: 'numeric' },
  )
  const timeLabel = `${dateFormatted} — ${eventInfo.time.replace(':', 'h')}min`

  return (
    <S.Section id="local">
      <S.Inner>
        <S.SectionTitle>Onde & Quando</S.SectionTitle>

        <S.Grid>
          <EventCard
            icon="⛪"
            title="Cerimônia"
            name={eventInfo.ceremony.name}
            address={eventInfo.ceremony.address}
            time={timeLabel}
            lat={eventInfo.ceremony.lat}
            lng={eventInfo.ceremony.lng}
            mapsEmbedUrl={eventInfo.ceremony.mapsEmbedUrl}
          />
          <EventCard
            icon="🥂"
            title="Recepção"
            name={eventInfo.reception.name}
            address={eventInfo.reception.address}
            lat={eventInfo.reception.lat}
            lng={eventInfo.reception.lng}
            mapsEmbedUrl={eventInfo.reception.mapsEmbedUrl}
          />
        </S.Grid>

        <S.DressCode>
          <span aria-hidden="true">👔</span>
          <strong>Dress Code:</strong>&nbsp;{eventInfo.dressCode}
        </S.DressCode>
      </S.Inner>
    </S.Section>
  )
}
