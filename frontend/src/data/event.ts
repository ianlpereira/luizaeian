export interface EventLocation {
  name: string
  address: string
  lat: number
  lng: number
  mapsUrl: string
  wazeUrl: string
  /** URL do Google Maps Embed para o iframe lazy (opcional) */
  mapsEmbedUrl?: string
}

export interface EventInfo {
  couple: {
    name1: string
    name2: string
  }
  date: string        // ISO 8601: 'YYYY-MM-DD'
  time: string        // 'HH:MM'
  dressCode: string
  ceremony: EventLocation
  reception: EventLocation
}

export const eventInfo: EventInfo = {
  couple: {
    name1: 'Luiza',
    name2: 'Ian',
  },
  // ⚠️ Atualize com a data e local reais antes do go-live
  date: '2026-11-07',
  time: '18:00',
  dressCode: 'Traje social — tons neutros e pastel',
  ceremony: {
    name: 'Igreja Nossa Senhora do Carmo',
    address: 'R. do Carmo, 55 — Centro, São Paulo - SP',
    lat: -23.548,
    lng: -46.634,
    mapsUrl: 'https://maps.google.com/?q=-23.548,-46.634',
    wazeUrl: 'https://waze.com/ul?ll=-23.548,-46.634&navigate=yes',
    // ⚠️ Substitua pela URL real do Google Maps Embed do local
    mapsEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3656.1!2d-46.634!3d-23.548!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjPCsDMyJzUyLjgiUyA0NsKwMzgnMDIuNCJX!5e0!3m2!1spt-BR!2sbr!4v1',
  },
  reception: {
    name: 'Espaço Villa Bisutti',
    address: 'Av. Giovanni Gronchi, 5900 — Vila Andrade, São Paulo - SP',
    lat: -23.634,
    lng: -46.734,
    mapsUrl: 'https://maps.google.com/?q=-23.634,-46.734',
    wazeUrl: 'https://waze.com/ul?ll=-23.634,-46.734&navigate=yes',
    // ⚠️ Substitua pela URL real do Google Maps Embed do local
    mapsEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.2!2d-46.734!3d-23.634!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjPCsDM4JzAyLjQiUyA0NsKwNDQnMDIuNCJX!5e0!3m2!1spt-BR!2sbr!4v1',
  },
}
