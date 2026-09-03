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

/** Explica, no topo do formulário, para que serve um lançamento manual. */
export const Hint = styled.p`
  margin: 0 0 ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`
