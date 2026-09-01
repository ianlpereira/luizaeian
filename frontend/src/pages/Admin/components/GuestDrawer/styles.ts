import styled from 'styled-components'

/** Rodapé do drawer: "Remover" isolado à esquerda, ações normais à direita. */
export const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
`

export const FooterActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-left: auto;
`

/** Contexto do grupo acima do formulário, quando se está editando alguém. */
export const GroupHint = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`
