import DOMPurify from 'dompurify'

/**
 * SEC-01 — Sanitiza uma string removendo todas as tags HTML.
 * Usar em todos os inputs de usuário antes de persistir no Supabase.
 */
export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] })
}

/**
 * Sanitiza preservando um subconjunto seguro de tags HTML (ex: para rich text leve).
 */
export function sanitizeRich(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br'],
  })
}
