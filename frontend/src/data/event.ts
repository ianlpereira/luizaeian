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
  date: '2026-10-31',
  time: '18:00',
  dressCode: 'Traje social — tons neutros e pastel',
  ceremony: {
    name: 'Paróquia Nossa Senhora dos Remédios',
    address: 'R. da Palma, s/n — Centro Histórico, São Luís - MA',
    lat: -2.5238087,
    lng: -44.2957545,
    mapsUrl: 'https://maps.google.com/?q=-2.5238087,-44.2957545',
    wazeUrl: 'https://waze.com/ul?ll=-2.5238087,-44.2957545&navigate=yes',
    mapsEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3974.8!2d-44.2957545!3d-2.5238087!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x7f68eed859ececb%3A0x24a1f3108a7440ed!2sPar%C3%B3quia+Nossa+Senhora+dos+Rem%C3%A9dios!5e0!3m2!1spt-BR!2sbr!4v1',
  },
  reception: {
    name: 'Casa da Família',
    address: 'Av. Nina Rodrigues, 17 — Ponta d\'Areia, São Luís - MA',
    lat: -2.505259,
    lng: -44.3147112,
    mapsUrl: 'https://maps.google.com/?q=-2.505259,-44.3147112',
    wazeUrl: 'https://waze.com/ul?ll=-2.505259,-44.3147112&navigate=yes',
    mapsEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3974.8!2d-44.3147112!3d-2.505259!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMi4zMCczMS4wIlMgNDQuMTknMzAuMCJX!5e0!3m2!1spt-BR!2sbr!4v1',
  },
}
