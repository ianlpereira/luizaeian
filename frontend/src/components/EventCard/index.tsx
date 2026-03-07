import { getGoogleMapsUrl, getWazeUrl } from '@/utils/maps'
import { LazyMap } from './LazyMap'
import * as S from './styles'

interface EventCardProps {
  icon: string
  title: string
  name: string
  address: string
  /** Texto opcional de horário, ex.: "07 de Novembro de 2026 — 18h00" */
  time?: string
  /** URL do Google Maps Embed para o iframe lazy */
  mapsEmbedUrl?: string
  lat: number
  lng: number
}

/**
 * Card de local do evento com mapa lazy, endereço e
 * deep links para Google Maps e Waze.
 */
export function EventCard({
  icon,
  title,
  name,
  address,
  time,
  mapsEmbedUrl,
  lat,
  lng,
}: EventCardProps) {
  return (
    <S.Card>
      {/* Mapa topo — carrega via IntersectionObserver */}
      {mapsEmbedUrl && <LazyMap embedUrl={mapsEmbedUrl} title={`Mapa — ${name}`} />}

      <S.CardBody>
        <S.Header>
          <S.Icon aria-hidden="true">{icon}</S.Icon>
          <S.Title>{title}</S.Title>
        </S.Header>

        <S.Venue>{name}</S.Venue>
        <S.Address>{address}</S.Address>

        {time && (
          <S.TimeRow>
            <span aria-hidden="true">🕕</span>
            {time}
          </S.TimeRow>
        )}
      </S.CardBody>

      <S.Actions>
        <S.MapsButton
          href={getGoogleMapsUrl(lat, lng)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Abrir ${name} no Google Maps`}
        >
          🗺️ Google Maps
        </S.MapsButton>
        <S.WazeButton
          href={getWazeUrl(lat, lng)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Abrir ${name} no Waze`}
        >
          🚗 Waze
        </S.WazeButton>
      </S.Actions>
    </S.Card>
  )
}
