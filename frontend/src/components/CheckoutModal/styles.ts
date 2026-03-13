import styled, { keyframes } from 'styled-components'
import { media } from '@/utils/breakpoints'

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(24px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0)    scale(1); }
`

// ── Backdrop ──────────────────────────────────────────────────────────────────

export const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0;
  animation: ${fadeIn} 200ms ease both;

  ${media.tablet} {
    align-items: center;
    padding: ${({ theme }) => theme.spacing.lg};
  }
`

// ── Dialog ────────────────────────────────────────────────────────────────────

export const Dialog = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.xl} ${({ theme }) => theme.borderRadius.xl} 0 0;
  width: 100%;
  max-height: 90dvh;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  animation: ${slideUp} 250ms ease both;

  ${media.tablet} {
    border-radius: ${({ theme }) => theme.borderRadius.xl};
    max-width: 480px;
    max-height: 80dvh;
  }
`

// ── Header ────────────────────────────────────────────────────────────────────

export const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
`

export const GiftName = styled.h2`
  font-family: ${({ theme }) => theme.typography.fontFamily.serif};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
  line-height: ${({ theme }) => theme.typography.lineHeight.tight};
`

export const Price = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary};
  margin: 0;
`

export const CloseButton = styled.button`
  flex-shrink: 0;
  background: none;
  border: none;
  font-size: 24px;
  line-height: 1;
  color: ${({ theme }) => theme.colors.text.muted};
  cursor: pointer;
  padding: 4px;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
  }
`

// ── Form ──────────────────────────────────────────────────────────────────────

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};

  label {
    font-family: ${({ theme }) => theme.typography.fontFamily.sans};
    font-size: ${({ theme }) => theme.typography.fontSize.sm};
    font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
    color: ${({ theme }) => theme.colors.text.secondary};
  }

  input,
  textarea {
    width: 100%;
    padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.borderRadius.md};
    font-family: ${({ theme }) => theme.typography.fontFamily.sans};
    font-size: ${({ theme }) => theme.typography.fontSize.md};
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.background};
    box-sizing: border-box;
    transition: border-color ${({ theme }) => theme.transitions.fast};
    outline: none;

    &:focus {
      border-color: ${({ theme }) => theme.colors.primary};
    }
  }

  textarea {
    resize: vertical;
    min-height: 90px;
  }
`

export const ErrorMsg = styled.span`
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.error};
`

// ── Submit ────────────────────────────────────────────────────────────────────

export const SubmitButton = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text.inverse};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primaryHover};
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.text.muted};
    cursor: not-allowed;
  }
`

// ── Success state ─────────────────────────────────────────────────────────────

export const SuccessBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.xl} 0;
  text-align: center;
`

export const SuccessIcon = styled.span`
  font-size: 56px;
  line-height: 1;
`

export const SuccessText = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamily.serif};
  font-size: ${({ theme }) => theme.typography.fontSize.lg};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
`

export const SuccessSubtext = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.text.muted};
  margin: 0;
`

// ── Error banner ──────────────────────────────────────────────────────────────

export const ErrorBanner = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  color: ${({ theme }) => theme.colors.error};
  background: ${({ theme }) => theme.colors.error}18;
  border: 1px solid ${({ theme }) => theme.colors.error}44;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  margin: 0;
`

// ── Step progress dots ────────────────────────────────────────────────────────

export const ProgressDots = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
`

export const Dot = styled.span<{ $active?: boolean; $done?: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $active, $done, theme }) =>
    $active || $done ? theme.colors.primary : theme.colors.borderLight};
  transition: background 250ms ease, transform 250ms ease;
  transform: ${({ $active }) => ($active ? 'scale(1.35)' : 'scale(1)')};
`

export const DotLine = styled.span`
  flex: 1;
  max-width: 32px;
  height: 1px;
  background: ${({ theme }) => theme.colors.borderLight};
`

// ── Gift preview strip (step 2) ───────────────────────────────────────────────

export const GiftPreview = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
`

export const GiftPreviewImg = styled.img`
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  flex-shrink: 0;
  background: ${({ theme }) => theme.colors.border};
`

export const GiftPreviewInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`

export const GiftPreviewName = styled.span`
  font-family: ${({ theme }) => theme.typography.fontFamily.serif};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const GiftPreviewPrice = styled.span`
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.bold};
  color: ${({ theme }) => theme.colors.primary};
`

// ── Pix payment box ───────────────────────────────────────────────────────────

export const PaymentBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`

export const PaymentTitle = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text.secondary};
  text-align: center;
  margin: 0;
`

export const QrWrapper = styled.div`
  width: 160px;
  height: 160px;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.surface};

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  ${media.tablet} {
    width: 180px;
    height: 180px;
  }
`

export const QrPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xs};
  width: 100%;
  height: 100%;
  font-size: 40px;
  color: ${({ theme }) => theme.colors.text.muted};
`

export const PixKeyBox = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  border: 1px dashed ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
`

export const PixKeyLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.text.muted};
  flex-shrink: 0;
`

export const PixKeyValue = styled.span`
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  flex: 1;
  word-break: break-all;
`

export const CopyButton = styled.button<{ $copied?: boolean }>`
  flex-shrink: 0;
  padding: 4px ${({ theme }) => theme.spacing.sm};
  background: ${({ $copied, theme }) =>
    $copied ? theme.colors.success : theme.colors.primary};
  color: ${({ theme }) => theme.colors.text.inverse};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  cursor: pointer;
  transition: background 200ms ease;
  white-space: nowrap;
`

export const PaymentHint = styled.p`
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.text.muted};
  text-align: center;
  margin: 0;
  line-height: ${({ theme }) => theme.typography.lineHeight.relaxed};
`

// ── Confirm payment button ────────────────────────────────────────────────────

export const ConfirmButton = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text.inverse};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primaryHover};
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.text.muted};
    cursor: not-allowed;
  }
`

export const BackButton = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm};
  background: none;
  color: ${({ theme }) => theme.colors.text.muted};
  border: none;
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  cursor: pointer;
  transition: color ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
  }
`

// ── Method selector (Etapa 2: escolha Pix | Cartão) ──────────────────────────

export const MethodGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.md};
`

export const MethodCard = styled.button<{ $selected?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.md};
  background: ${({ $selected, theme }) =>
    $selected ? theme.colors.primary + '14' : theme.colors.surface};
  border: 2px solid ${({ $selected, theme }) =>
    $selected ? theme.colors.primary : theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  cursor: pointer;
  transition:
    border-color ${({ theme }) => theme.transitions.fast},
    background ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`

export const MethodIcon = styled.span`
  font-size: 32px;
  line-height: 1;
`

export const MethodLabel = styled.span`
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
`

export const MethodSub = styled.span`
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.text.muted};
  text-align: center;
`

export const MethodContinueButton = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text.inverse};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.semibold};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primaryHover};
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.text.muted};
    cursor: not-allowed;
  }
`

// ── Pix: countdown timer ──────────────────────────────────────────────────────

export const PixCountdown = styled.p<{ $warning?: boolean }>`
  font-family: ${({ theme }) => theme.typography.fontFamily.sans};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ $warning, theme }) => ($warning ? theme.colors.error : theme.colors.text.muted)};
  margin: 0;
  text-align: center;
  transition: color 300ms ease;
`

// ── Card: Brick skeleton loader ───────────────────────────────────────────────

const shimmer = keyframes`
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
`

export const BrickSkeleton = styled.div`
  width: 100%;
  height: 280px;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.colors.borderLight} 25%,
    ${({ theme }) => theme.colors.surfaceAlt} 50%,
    ${({ theme }) => theme.colors.borderLight} 75%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.6s ease infinite;
`
