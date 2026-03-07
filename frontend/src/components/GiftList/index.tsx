import { useState } from 'react'
import { useGifts } from '@/hooks/useGifts'
import { GiftCard } from '@/components/GiftCard'
import { CheckoutModal } from '@/components/CheckoutModal'
import type { Gift, GiftFilters, GiftSortOrder } from '@/types/gift'
import * as S from './styles'

const SKELETON_COUNT = 8

/**
 * Seção completa da lista de presentes.
 * Inclui filtro de ordenação por preço, grid responsivo,
 * skeletons de loading e integração com CheckoutModal.
 */
export function GiftList() {
  const [filters, setFilters] = useState<GiftFilters>({ sortOrder: 'asc' })
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null)

  const { data: gifts, isLoading, isError } = useGifts(filters)

  const handleSortChange = (e: { target: { value: string } }) => {
    setFilters((prev: GiftFilters) => ({ ...prev, sortOrder: e.target.value as GiftSortOrder }))
  }

  return (
    <S.Section id="presentes">
      <S.Inner>
        <S.SectionTitle>Lista de Presentes</S.SectionTitle>
        <S.SectionSubtitle>
          Escolha um presente especial para celebrar conosco 🎁
        </S.SectionSubtitle>

        {/* Filtros */}
        <S.FilterBar>
          <S.FilterLabel>Ordenar por preço:</S.FilterLabel>
          <S.SortSelect
            value={filters.sortOrder}
            onChange={handleSortChange}
            aria-label="Ordenar presentes por preço"
          >
            <option value="asc">Menor preço primeiro</option>
            <option value="desc">Maior preço primeiro</option>
          </S.SortSelect>
        </S.FilterBar>

        {/* Grid */}
        <S.Grid>
          {isLoading &&
            Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <S.SkeletonCard key={i} aria-hidden="true" />
            ))}

          {isError && (
            <S.StateMessage>
              Não foi possível carregar os presentes. Tente novamente mais tarde.
            </S.StateMessage>
          )}

          {!isLoading && !isError && gifts?.length === 0 && (
            <S.StateMessage>Nenhum presente encontrado.</S.StateMessage>
          )}

          {!isLoading &&
            !isError &&
            gifts?.map((gift) => (
              <GiftCard key={gift.id} gift={gift} onSelect={setSelectedGift} />
            ))}
        </S.Grid>
      </S.Inner>

      {/* Modal de checkout — renderizado fora do grid para z-index correto */}
      {selectedGift && (
        <CheckoutModal
          gift={selectedGift}
          onClose={() => setSelectedGift(null)}
        />
      )}
    </S.Section>
  )
}
