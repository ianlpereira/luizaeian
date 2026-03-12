import styled, { keyframes } from 'styled-components'
import { media } from '@/utils/breakpoints'

// ─── Form wrapper ─────────────────────────────────────────────────────────────

export const Section = styled.section`
  background-color: ${({ theme }) => theme.colors.surfaceAlt};
  padding: ${({ theme }) => theme.spacing.xxl} ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
`

export const Inner = styled.div`
  max-width: 560px;
  margin: 0 auto;
`

export const SectionTitle = styled.h2`
  font-family: ${({ theme }) => theme.typography.fontFamily.serif};
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.regular};
  color: ${({ theme }) => theme.colors.text.primary};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.sm};

  ${media.tablet} {
    font-size: ${({ theme }) => theme.typography.fontSize.xxl};
  }
`

export const SectionSubtitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

// ─── Form fields ──────────────────────────────────────────────────────────────

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};

  label {
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
    font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
    color: ${({ theme }) => theme.colors.text.secondary};
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  input[type='text'],
  input[type='email'] {
    width: 100%;
    padding: 12px ${({ theme }) => theme.spacing.md};
    font-size: ${({ theme }) => theme.typography.fontSize.md};
    /* font-size 16px no iOS evita zoom automático */
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.borderRadius.md};
    background-color: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.text.primary};
    transition: border-color ${({ theme }) => theme.transitions.fast};
    box-sizing: border-box;

    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.primary};
    }

    &::placeholder {
      color: ${({ theme }) => theme.colors.text.muted};
    }
  }
`

export const ErrorMsg = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.error};
`

// ─── Status radio group ───────────────────────────────────────────────────────

export const StatusGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};

  label {
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.spacing.sm};
    font-size: ${({ theme }) => theme.typography.fontSize.md};
    color: ${({ theme }) => theme.colors.text.primary};
    cursor: pointer;
    text-transform: none;
    letter-spacing: 0;

    input[type='radio'] {
      accent-color: ${({ theme }) => theme.colors.primary};
      width: 18px;
      height: 18px;
      cursor: pointer;
    }
  }
`

// ─── Companions ───────────────────────────────────────────────────────────────

export const CompanionsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: ${({ theme }) => theme.colors.surface};
`

export const CompanionsTitle = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text.secondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
`

export const CompanionRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;

  input[type='text'] {
    flex: 1;
    padding: 10px ${({ theme }) => theme.spacing.md};
    font-size: ${({ theme }) => theme.typography.fontSize.md};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.borderRadius.md};
    background-color: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.text.primary};
    transition: border-color ${({ theme }) => theme.transitions.fast};
    box-sizing: border-box;

    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.primary};
    }
  }
`

export const RemoveButton = styled.button`
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.round};
  background-color: ${({ theme }) => theme.colors.borderLight};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color ${({ theme }) => theme.transitions.fast};

  &:hover {
    background-color: ${({ theme }) => theme.colors.error};
    color: ${({ theme }) => theme.colors.text.inverse};
  }
`

export const AddCompanionButton = styled.button`
  align-self: flex-start;
  border: none;
  background: none;
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  padding: 0;
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.primaryHover};
  }
`

// ─── Submit button ────────────────────────────────────────────────────────────

export const SubmitButton = styled.button`
  width: 100%;
  padding: 14px ${({ theme }) => theme.spacing.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  letter-spacing: 1px;
  text-transform: uppercase;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text.inverse};
  cursor: pointer;
  transition:
    background-color ${({ theme }) => theme.transitions.fast},
    opacity ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.primaryHover};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

// ─── Success / Error states ───────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
`

export const SuccessBox = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.lg};
  animation: ${fadeIn} 0.4s ease;
`

export const SuccessEmoji = styled.div`
  font-size: 48px;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

export const SuccessTitle = styled.h3`
  font-family: ${({ theme }) => theme.typography.fontFamily.serif};
  font-size: ${({ theme }) => theme.typography.fontSize.xl};
  font-weight: ${({ theme }) => theme.typography.fontWeight.regular};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

export const SuccessText = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`

export const GlobalError = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: #fdf0f0;
  border: 1px solid ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.error};
`
