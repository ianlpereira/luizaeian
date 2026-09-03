/**
 * Formulário de lançamento manual — dinheiro que entrou fora do Mercado Pago.
 *
 * Segue o `GuestDrawer`: AntD `Form` em vez de react-hook-form, porque o drawer
 * vive dentro da subárvore AntD, ao lado da tabela. O mesmo componente cria e
 * edita; `row === null` é o modo de criação.
 */

import { useEffect } from 'react'
import { App, Button, DatePicker, Drawer, Form, Input, InputNumber, Select } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'

import { useAdminGifts, useAdminGuests } from '@/hooks/useAdminReports'
import {
  manualTransactionErrorMessage,
  useCreateManualTransaction,
  useDeleteManualTransaction,
  useUpdateManualTransaction,
} from '@/hooks/useManualTransactionMutations'
import type { AdminGiftLedgerRow, AdminManualTransaction } from '@/types/admin'
import type { ManualMethod } from '@/types/payment'
import { optionsFrom } from '../../guestLabels'
import { MANUAL_METHOD_LABEL } from '../../paymentLabels'
import { GiftPicker } from '../GiftPicker'
import { GuestPicker } from '../GuestPicker'
import * as S from './styles'

interface ManualTransactionDrawerProps {
  open: boolean
  /** `null` abre em modo de criação. */
  row: AdminGiftLedgerRow | null
  onClose: () => void
}

interface FormValues {
  buyer_name: string
  amount: number
  method: ManualMethod
  created_at: Dayjs
  gift_id?: string
  guest_id?: string
  message?: string
}

export function ManualTransactionDrawer({ open, row, onClose }: ManualTransactionDrawerProps) {
  const [form] = Form.useForm<FormValues>()
  const { message, modal } = App.useApp()

  const gifts = useAdminGifts()
  const guests = useAdminGuests()

  const createTransaction = useCreateManualTransaction()
  const updateTransaction = useUpdateManualTransaction()
  const deleteTransaction = useDeleteManualTransaction()

  const isEditing = row !== null
  const saving = createTransaction.isPending || updateTransaction.isPending

  // Repovoa ao abrir e a cada troca de linha; o AntD Form guarda estado interno,
  // então sem isso o drawer reabriria com os dados do lançamento anterior.
  useEffect(() => {
    if (!open) return

    form.setFieldsValue(
      row
        ? {
            buyer_name: row.buyer_name,
            amount: row.amount ?? 0,
            method: row.method as ManualMethod,
            created_at: dayjs(row.created_at),
            gift_id: row.gift_id ?? undefined,
            guest_id: row.guest_id ?? undefined,
            message: row.message ?? undefined,
          }
        : {
            buyer_name: '',
            amount: undefined,
            method: 'bank_transfer',
            created_at: dayjs(),
            gift_id: undefined,
            guest_id: undefined,
            message: undefined,
          },
    )
  }, [open, row, form])

  const handleSubmit = async (values: FormValues) => {
    const payload: AdminManualTransaction = {
      buyer_name: values.buyer_name,
      amount: values.amount,
      method: values.method,
      // ISO completo, com fuso: o backend grava o instante e a data volta no
      // mesmo dia que foi escolhido aqui.
      created_at: values.created_at.toISOString(),
      gift_id: values.gift_id ?? null,
      guest_id: values.guest_id ?? null,
      message: values.message?.trim() ? values.message.trim() : null,
    }

    try {
      if (isEditing) {
        await updateTransaction.mutateAsync({ id: row.purchase_id as string, payload })
        message.success('Lançamento atualizado.')
      } else {
        await createTransaction.mutateAsync(payload)
        message.success('Lançamento registrado.')
      }
      onClose()
    } catch (error) {
      message.error(manualTransactionErrorMessage(error))
    }
  }

  const handleDelete = () => {
    if (!row?.purchase_id) return

    modal.confirm({
      title: `Remover o lançamento de ${row.buyer_name}?`,
      content: 'O valor sai do total aprovado. Não dá para desfazer.',
      okText: 'Remover',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await deleteTransaction.mutateAsync(row.purchase_id as string)
          message.success('Lançamento removido.')
          onClose()
        } catch (error) {
          message.error(manualTransactionErrorMessage(error))
          // Relança para o AntD manter o modal aberto quando falha.
          throw error
        }
      },
    })
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      destroyOnClose
      width={420}
      title={isEditing ? 'Editar lançamento' : 'Adicionar lançamento'}
      footer={
        <S.Footer>
          {isEditing && (
            <Button danger onClick={handleDelete} loading={deleteTransaction.isPending}>
              Remover
            </Button>
          )}
          <S.FooterActions>
            <Button onClick={onClose}>Cancelar</Button>
            <Button type="primary" onClick={() => form.submit()} loading={saving}>
              Salvar
            </Button>
          </S.FooterActions>
        </S.Footer>
      }
    >
      <S.Hint>
        Para presentes que chegaram fora do site — transferência, Camicado, dinheiro. O
        valor entra no total aprovado do painel.
      </S.Hint>

      <Form form={form} layout="vertical" requiredMark={false} onFinish={handleSubmit}>
        <Form.Item
          name="buyer_name"
          label="Quem presenteou"
          rules={[
            { required: true, message: 'Informe o nome.' },
            { min: 2, message: 'Nome muito curto.' },
            { max: 100, message: 'Nome muito longo.' },
          ]}
        >
          <Input placeholder="Nome de quem enviou" />
        </Form.Item>

        <Form.Item
          name="amount"
          label="Valor"
          rules={[
            { required: true, message: 'Informe o valor.' },
            {
              type: 'number',
              min: 0.01,
              message: 'O valor precisa ser maior que zero.',
            },
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            precision={2}
            decimalSeparator=","
            prefix="R$"
            placeholder="0,00"
          />
        </Form.Item>

        <Form.Item name="method" label="Como chegou" rules={[{ required: true }]}>
          <Select options={optionsFrom(MANUAL_METHOD_LABEL)} />
        </Form.Item>

        <Form.Item name="created_at" label="Data" rules={[{ required: true }]}>
          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" allowClear={false} />
        </Form.Item>

        <Form.Item
          name="gift_id"
          label="Presente"
          extra="Deixe vazio quando não corresponder a nenhum item da lista."
        >
          <GiftPicker gifts={gifts.data?.items ?? []} />
        </Form.Item>

        <Form.Item
          name="guest_id"
          label="Convidado"
          extra="Opcional — dá para vincular depois, pela conciliação."
        >
          <GuestPicker
            guests={guests.data?.items ?? []}
            allowClear
            placeholder="Nenhum convidado vinculado"
          />
        </Form.Item>

        <Form.Item name="message" label="Observação" rules={[{ max: 300 }]}>
          <Input.TextArea rows={3} placeholder="Anotação sobre o presente" />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
