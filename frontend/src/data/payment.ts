/**
 * Configurações de pagamento para a lista de presentes.
 * Altere os valores abaixo para refletir a chave Pix real do casal.
 */
export const pixConfig = {
  /** Chave Pix — pode ser CPF, e-mail, telefone ou chave aleatória */
  key: 'luiza.ian@gmail.com',
  /** Nome que aparece no comprovante do Pix */
  holderName: 'Luiza & Ian',
  /** Banco para orientação (opcional) */
  bank: 'Nubank',
  /**
   * URL do QR code estático gerado pela sua instituição bancária.
   * Se ainda não tiver, deixe null — o modal exibirá só a chave.
   */
  qrCodeUrl: null as string | null,
}
