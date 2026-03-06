import styled from 'styled-components'

export const Wrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`

export const Header = styled.header`
  display: flex;
  align-items: center;
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.xl}`};
  background-color: ${({ theme }) => theme.colors.surface};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  height: 64px;
  box-shadow: ${({ theme }) => theme.shadows.sm};
`

export const Logo = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary};
  letter-spacing: -0.5px;
`

export const Main = styled.main`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.xl};
  max-width: 1440px;
  margin: 0 auto;
  width: 100%;
`
