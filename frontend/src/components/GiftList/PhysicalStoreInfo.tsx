import { physicalStore, physicalStoreMapsUrl, physicalStoreWazeUrl } from '@/data/physicalStore'
import * as S from './styles'

/**
 * Instruções para presentear na loja física (Camicado).
 * Não está vinculado a nenhum presente específico da lista online —
 * a loja física não compartilha estoque/catálogo com a API.
 */
export function PhysicalStoreInfo() {
  return (
    <S.PhysicalCard>
      <S.PhysicalIcon>🏬</S.PhysicalIcon>
      <S.PhysicalTitle>Presentear na {physicalStore.storeName}</S.PhysicalTitle>
      <S.PhysicalAddress>{physicalStore.address}</S.PhysicalAddress>
      <S.PhysicalInstructions>{physicalStore.instructions}</S.PhysicalInstructions>

      <S.PhysicalLinks>
        <S.PhysicalLink href={physicalStoreMapsUrl} target="_blank" rel="noopener noreferrer">
          📍 Ver no Google Maps
        </S.PhysicalLink>
        <S.PhysicalLink href={physicalStoreWazeUrl} target="_blank" rel="noopener noreferrer">
          🚗 Abrir no Waze
        </S.PhysicalLink>
      </S.PhysicalLinks>
    </S.PhysicalCard>
  )
}
