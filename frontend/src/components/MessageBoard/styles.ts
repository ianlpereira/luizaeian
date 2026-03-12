import styled, { keyframes } from 'styled-components'
import { media } from '@/utils/breakpoints'

// ─── Section wrapper ──────────────────────────────────────────────────────────

export const Section = styled.section`
  background-color: ${({ theme }) => theme.colors.background};
  padding: ${({ theme }) => theme.spacing.xxl} ${({ theme }) => theme.spacing.md};
`

export const Inner = styled.div`
  max-width: 640px;
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

// ─── Message form ─────────────────────────────────────────────────────────────

export const MessageForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  padding: ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`

export const FormRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-direction: column;

  ${media.tablet} {
    flex-direction: row;
  }
`

export const Input = styled.input`
  width: 100%;
  padding: 12px ${({ theme }) => theme.spacing.md};
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

  &::placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
  }
`

export const Textarea = styled.textarea`
  width: 100%;
  padding: 12px ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text.primary};
  resize: vertical;
  min-height: 80px;
  transition: border-color ${({ theme }) => theme.transitions.fast};
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
  }
`

export const FormFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
`

export const CharCount = styled.span<{ $over: boolean }>`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ $over, theme }) => ($over ? theme.colors.error : theme.colors.text.muted)};
`

export const SendButton = styled.button`
  padding: 10px ${({ theme }) => theme.spacing.lg};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  letter-spacing: 0.5px;
  text-transform: uppercase;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text.inverse};
  cursor: pointer;
  transition:
    background-color ${({ theme }) => theme.transitions.fast},
    opacity ${({ theme }) => theme.transitions.fast};
  white-space: nowrap;

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.primaryHover};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

export const ErrorMsg = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.error};
`

// ─── Message cards ────────────────────────────────────────────────────────────

const slideIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`

export const Feed = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`

export const Card = styled.article`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  animation: ${slideIn} 0.3s ease;
`

export const Avatar = styled.div<{ $color: string }>`
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: ${({ theme }) => theme.borderRadius.round};
  background-color: ${({ $color }) => $color};
  color: ${({ theme }) => theme.colors.text.inverse};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  letter-spacing: 0.5px;
`

export const CardBody = styled.div`
  flex: 1;
  min-width: 0;
`

export const CardAuthor = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0 0 4px;
`

export const CardContent = styled.p`
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
  margin: 0 0 6px;
  word-break: break-word;
`

export const CardDate = styled.time`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.text.muted};
`

// ─── Empty / Loading states ───────────────────────────────────────────────────

const shimmer = keyframes`
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
`

export const Skeleton = styled.div`
  height: 90px;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.borderLight} 25%,
    ${({ theme }) => theme.colors.surfaceAlt} 50%,
    ${({ theme }) => theme.colors.borderLight} 75%
  );
  background-size: 800px 100%;
  animation: ${shimmer} 1.4s infinite linear;
`

export const EmptyState = styled.p`
  text-align: center;
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  color: ${({ theme }) => theme.colors.text.muted};
  padding: ${({ theme }) => theme.spacing.xl} 0;
`
