import { getGoogleMapsUrl, getWazeUrl } from '@/utils/maps'

export interface PhysicalStoreInfo {
  storeName: string
  address: string
  lat: number
  lng: number
  instructions: string
}

const lat = -2.5283292
const lng = -44.2553957

export const physicalStore: PhysicalStoreInfo = {
  storeName: 'Camicado',
  address: 'Shopping da Ilha — São Luís - MA',
  lat,
  lng,
  instructions:
    'Você também pode nos presentear pessoalmente em qualquer loja Camicado. ' +
    'Basta escolher o presente na loja física e informar aos vendedores que é para o casamento de Luiza e Ian.',
}

export const physicalStoreMapsUrl = getGoogleMapsUrl(lat, lng)
export const physicalStoreWazeUrl = getWazeUrl(lat, lng)
