import { useState, useMemo, useEffect } from 'react'
import { useGifts } from '@/hooks/useGifts'
import { GiftCard } from '@/components/GiftCard'
import { CheckoutModal } from '@/components/CheckoutModal'
import { useScrollFadeIn } from '@/hooks/useScrollFadeIn'
import type { Gift, GiftFilters, GiftSortOrder } from '@/types/gift'
import * as S from './styles'

const SKELETON_COUNT = 8
const PAGE_SIZE = 8

const CATEGORY_EMOJI: Record<string, string> = {
  // categorias da seed atual
  'Eletrodomésticos':   '🏠',
  'Sala':               '🛋️',
  'Quarto':             '🛏️',
  'Cozinha':            '🍳',
  'Cama, Mesa e Banho': '🛁',
  'Decoração':          '🖼️',
  'Utilidades':         '🧹',
  'Lua de Mel':         '✈️',
  // categorias legadas (seed anterior)
  'Casa':               '🏡',
  'Cama & Banho':       '🛁',
  'Eletrônicos':        '📺',
  'Lazer':              '🎲',
  'Viagem':             '🗺️',
  'Engraçado':          '🎉',
}

/** Gera array de páginas com reticências: [1, '…', 4, 5, 6, '…', 10] */
function buildPageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '…')[] = [1]
  if (current > 3) pages.push('…')
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    pages.push(p)
  }
  if (current < total - 2) pages.push('…')
  pages.push(total)
  return pages
}

/**
 * Seção completa da lista de presentes.
 * Todos os dados são carregados de uma vez via API; a paginação é feita
 * no front com slice (PAGE_SIZE itens por página).
 */
export function GiftList() {
  const [filters, setFilters] = useState<GiftFilters>({ sortOrder: 'asc' })
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const { ref, isVisible } = useScrollFadeIn()

  // Busca SEM filtro de categoria para derivar a lista de categorias disponíveis
  const { data: allGifts } = useGifts({ sortOrder: 'asc' })
  // Busca COM filtros — traz tudo; paginação acontece no front
  const { data: gifts, isLoading, isError } = useGifts(filters)

  // Resetar para página 1 sempre que os filtros mudarem
  useEffect(() => { setCurrentPage(1) }, [filters])

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

  // Paginação client-side
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((gifts?.length ?? 0) / PAGE_SIZE)),
    [gifts],
  )

  const pageGifts = useMemo(() => {
    if (!gifts) return []
    const start = (currentPage - 1) * PAGE_SIZE
    return gifts.slice(start, start + PAGE_SIZE)
  }, [gifts, currentPage])

  const pageNumbers = useMemo(
    () => buildPageNumbers(currentPage, totalPages),
    [currentPage, totalPages],
  )

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
            pageGifts.map((gift) => (
              <GiftCard key={gift.id} gift={gift} onSelect={setSelectedGift} />
            ))}
        </S.Grid>

        {/* Paginação — só exibe quando há mais de uma página */}
        {!isLoading && !isError && totalPages > 1 && (
          <S.PaginationRow role="navigation" aria-label="Páginas de presentes">
            <S.PaginationButton
              $nav
              onClick={() => setCurrentPage((p) => p - 1)}
              disabled={currentPage === 1}
              aria-label="Página anterior"
            >
              ‹
            </S.PaginationButton>

            {pageNumbers.map((p, idx) =>
              p === '…' ? (
                <S.PaginationEllipsis key={`ellipsis-${idx}`}>…</S.PaginationEllipsis>
              ) : (
                <S.PaginationButton
                  key={p}
                  $active={p === currentPage}
                  onClick={() => setCurrentPage(p as number)}
                  aria-label={`Página ${p}`}
                  aria-current={p === currentPage ? 'page' : undefined}
                >
                  {p}
                </S.PaginationButton>
              ),
            )}

            <S.PaginationButton
              $nav
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={currentPage === totalPages}
              aria-label="Próxima página"
            >
              ›
            </S.PaginationButton>
          </S.PaginationRow>
        )}
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
