export interface EventLocation {
  name: string
  address: string
  lat: number
  lng: number
  mapsUrl: string
  wazeUrl: string
}

export interface EventInfo {
  couple: {
    name1: string
    name2: string
  }
  date: string        // ISO 8601: '2026-11-07'
  time: string        // '18:00'
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
  ceremony: {
    name: 'Igreja Nossa Senhora do Carmo',
    address: 'R. do Carmo, 55 — Centro, São Paulo - SP',
    lat: -23.548,
    lng: -46.634,
    mapsUrl: 'https://maps.google.com/?q=-23.548,-46.634',
    wazeUrl: 'https://waze.com/ul?ll=-23.548,-46.634&navigate=yes',
  },
  reception: {
    name: 'Espaço Villa Bisutti',
    address: 'Av. Giovanni Gronchi, 5900 — Vila Andrade, São Paulo - SP',
    lat: -23.634,
    lng: -46.734,
    mapsUrl: 'https://maps.google.com/?q=-23.634,-46.734',
    wazeUrl: 'https://waze.com/ul?ll=-23.634,-46.734&navigate=yes',
  },
}
