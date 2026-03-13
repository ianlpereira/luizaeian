import { useState, useMemo } from 'react'
import { useGifts } from '@/hooks/useGifts'
import { GiftCard } from '@/components/GiftCard'
import { CheckoutModal } from '@/components/CheckoutModal'
import { useScrollFadeIn } from '@/hooks/useScrollFadeIn'
import type { Gift, GiftFilters, GiftSortOrder } from '@/types/gift'
import * as S from './styles'

const SKELETON_COUNT = 8

const CATEGORY_EMOJI: Record<string, string> = {
  'Cozinha':      '🍳',
  'Casa':         '🏡',
  'Cama & Banho': '🛁',
  'Eletrônicos':  '📺',
  'Lazer':        '🎲',
  'Viagem':       '✈️',
  'Engraçado':    '🎉',
}

/**
 * Seção completa da lista de presentes.
 * Inclui filtro de categoria (chips), filtro de ordenação por preço,
 * grid responsivo, skeletons de loading e integração com CheckoutModal.
 */
export function GiftList() {
  const [filters, setFilters] = useState<GiftFilters>({ sortOrder: 'asc' })
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null)
  const { ref, isVisible } = useScrollFadeIn()

  // Busca SEM filtro de categoria para derivar a lista de categorias disponíveis
  const { data: allGifts } = useGifts({ sortOrder: 'asc' })
  const { data: gifts, isLoading, isError } = useGifts(filters)

  // Deriva categorias únicas, na ordem em que aparecem (preserva ordem da seed)
  const categories = useMemo(() => {
    if (!allGifts) return []
    const seen = new Set<string>()
    return allGifts
      .map((g) => g.category)
      .filter((cat) => {
        if (seen.has(cat)) return false
        seen.add(cat)
        return true
      })
  }, [allGifts])

  const handleCategoryChange = (category: string | undefined) => {
    setFilters((prev) => ({ ...prev, category }))
  }

  const handleSortChange = (e: { target: { value: string } }) => {
    setFilters((prev: GiftFilters) => ({ ...prev, sortOrder: e.target.value as GiftSortOrder }))
  }

  return (
    <S.Section id="presentes" ref={ref as never} $visible={isVisible}>
      <S.Inner>
        <S.SectionTitle>Lista de Presentes</S.SectionTitle>
        <S.SectionSubtitle>
          Escolha um presente especial para celebrar conosco 🎁
        </S.SectionSubtitle>

        {/* Chips de categoria */}
        {categories.length > 0 && (
          <S.CategoryRow>
            <S.CategoryChip
              $active={!filters.category}
              onClick={() => handleCategoryChange(undefined)}
              aria-pressed={!filters.category}
            >
              Todos
            </S.CategoryChip>
            {categories.map((cat) => (
              <S.CategoryChip
                key={cat}
                $active={filters.category === cat}
                onClick={() => handleCategoryChange(cat)}
                aria-pressed={filters.category === cat}
              >
                {CATEGORY_EMOJI[cat] ?? '🎁'} {cat}
              </S.CategoryChip>
            ))}
          </S.CategoryRow>
        )}

        {/* Ordenação */}
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
