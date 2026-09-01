/**
 * Edição e criação de convidado.
 *
 * Primeiro `Form` de AntD do projeto — `AdminLogin` usa react-hook-form + zod.
 * A divergência é deliberada: este drawer vive dentro da subárvore AntD, colado
 * a uma `Table` AntD, e inputs estilizados à mão destoariam da tabela ao lado.
 */

import { useEffect, useMemo } from 'react'
import { App, Button, Drawer, Form, Input, Select } from 'antd'

import { guestErrorMessage, useCreateGuest, useDeleteGuest, useUpdateGuest } from '@/hooks/useAdminGuestMutations'
import type {
  AdminGuestCreate,
  AdminGuestRow,
  AdminGuestUpdate,
  AdminRsvpRow,
} from '@/types/admin'
import { normalizeText } from '@/utils/format'
import {
  ATTENDANCE_LABEL,
  INVITE_TYPE_LABEL,
  RSVP_ROLE_LABEL,
  RSVP_STATUS_LABEL,
  SENT_LABEL,
  SIDE_LABEL,
  optionsFrom,
} from '../../guestLabels'
import * as S from './styles'

interface GuestDrawerProps {
  open: boolean
  /** `null` abre o drawer em modo de criação. */
  guest: AdminGuestRow | null
  /** Todas as linhas, de onde saem os grupos disponíveis na criação. */
  rows: AdminGuestRow[]
  rsvps: AdminRsvpRow[]
  onClose: () => void
}

interface FormValues {
  full_name: string
  side: AdminGuestRow['side']
  invite_type: AdminGuestRow['invite_type']
  attendance: AdminGuestRow['attendance']
  save_the_date_status: AdminGuestRow['save_the_date_status']
  invite_sent_status: AdminGuestRow['invite_sent_status']
  rsvp_id: string | null
  rsvp_role: AdminGuestRow['rsvp_role']
  /** Só na criação. `null` = abrir um grupo novo. */
  group_index: number | null
}

const NEW_GROUP = -1

export function GuestDrawer({ open, guest, rows, rsvps, onClose }: GuestDrawerProps) {
  const [form] = Form.useForm<FormValues>()
  const { message, modal } = App.useApp()

  const createGuest = useCreateGuest()
  const updateGuest = useUpdateGuest()
  const deleteGuest = useDeleteGuest()

  const isEditing = guest !== null
  const saving = createGuest.isPending || updateGuest.isPending

  // Um item por grupo, rotulado pelo titular — é como o usuário reconhece a família.
  const groupOptions = useMemo(() => {
    const seen = new Map<number, string>()
    for (const row of rows) {
      if (!seen.has(row.group_index)) seen.set(row.group_index, row.group_label)
    }
    return [
      { value: NEW_GROUP, label: 'Criar um grupo novo' },
      ...[...seen.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([value, label]) => ({ value, label })),
    ]
  }, [rows])

  const rsvpOptions = useMemo(
    () =>
      rsvps.map((rsvp) => ({
        value: rsvp.id,
        label: `${rsvp.full_name} — ${RSVP_STATUS_LABEL[rsvp.status] ?? rsvp.status}`,
      })),
    [rsvps],
  )

  // Repovoa ao abrir e a cada troca de convidado; o AntD Form guarda estado
  // interno, então sem isso o drawer reabriria com os dados da pessoa anterior.
  useEffect(() => {
    if (!open) return

    form.setFieldsValue(
      guest
        ? {
            full_name: guest.full_name,
            side: guest.side,
            invite_type: guest.invite_type,
            attendance: guest.attendance,
            save_the_date_status: guest.save_the_date_status,
            invite_sent_status: guest.invite_sent_status,
            rsvp_id: guest.rsvp_id,
            rsvp_role: guest.rsvp_role,
            group_index: guest.group_index,
          }
        : {
            full_name: '',
            side: 'bride',
            invite_type: 'digital',
            attendance: null,
            save_the_date_status: null,
            invite_sent_status: 'pending',
            rsvp_id: null,
            rsvp_role: null,
            group_index: NEW_GROUP,
          },
    )
  }, [open, guest, form])

  const handleSubmit = async (values: FormValues) => {
    try {
      if (isEditing) {
        const payload: AdminGuestUpdate = {
          full_name: values.full_name,
          side: values.side,
          invite_type: values.invite_type,
          attendance: values.attendance ?? null,
          save_the_date_status: values.save_the_date_status ?? null,
          invite_sent_status: values.invite_sent_status,
          rsvp_id: values.rsvp_id ?? null,
          // Sem RSVP não existe papel — o backend recusa o par incompleto.
          rsvp_role: values.rsvp_id ? values.rsvp_role ?? 'primary' : null,
        }
        await updateGuest.mutateAsync({ id: guest.id, payload })
        message.success('Convidado atualizado.')
      } else {
        const payload: AdminGuestCreate = {
          full_name: values.full_name,
          side: values.side,
          invite_type: values.invite_type,
          group_index: values.group_index === NEW_GROUP ? null : values.group_index,
          attendance: values.attendance ?? null,
          save_the_date_status: values.save_the_date_status ?? null,
          invite_sent_status: values.invite_sent_status,
        }
        await createGuest.mutateAsync(payload)
        message.success('Convidado adicionado.')
      }
      onClose()
    } catch (error) {
      message.error(guestErrorMessage(error))
    }
  }

  const handleDelete = () => {
    if (!guest) return

    modal.confirm({
      title: `Remover ${guest.full_name}?`,
      content: guest.is_group_head
        ? 'Esta pessoa é a titular do convite. Ao removê-la, outro integrante do grupo assume esse papel e passa a dar nome ao grupo.'
        : 'A pessoa sai da lista de convidados. Não dá para desfazer.',
      okText: 'Remover',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: async () => {
        try {
          await deleteGuest.mutateAsync(guest.id)
          message.success('Convidado removido.')
          onClose()
        } catch (error) {
          message.error(guestErrorMessage(error))
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
      width={420}
      destroyOnClose
      title={isEditing ? 'Editar convidado' : 'Adicionar convidado'}
      footer={
        <S.Footer>
          {isEditing && (
            <Button danger onClick={handleDelete} loading={deleteGuest.isPending}>
              Remover
            </Button>
          )}
          <S.FooterActions>
            <Button onClick={onClose}>Cancelar</Button>
            <Button type="primary" loading={saving} onClick={() => form.submit()}>
              Salvar
            </Button>
          </S.FooterActions>
        </S.Footer>
      }
    >
      {isEditing && (
        <S.GroupHint>
          Grupo: {guest.group_label}
          {guest.group_size > 1 && ` · ${guest.group_size} pessoas`}
          {guest.is_group_head && ' · titular do convite'}
        </S.GroupHint>
      )}

      <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
        <Form.Item
          name="full_name"
          label="Nome"
          rules={[
            { required: true, message: 'Informe o nome.' },
            { min: 2, message: 'Nome precisa ter ao menos 2 caracteres.' },
            { max: 200, message: 'Nome muito longo.' },
          ]}
        >
          <Input placeholder="Nome do convidado" />
        </Form.Item>

        {!isEditing && (
          <Form.Item
            name="group_index"
            label="Grupo"
            extra="Quem entra num grupo existente divide o convite com a família."
          >
            <Select
              showSearch
              options={groupOptions}
              filterOption={(input, option) =>
                normalizeText(String(option?.label ?? '')).includes(normalizeText(input))
              }
            />
          </Form.Item>
        )}

        <Form.Item name="side" label="Origem" rules={[{ required: true }]}>
          <Select options={optionsFrom(SIDE_LABEL)} />
        </Form.Item>

        <Form.Item name="invite_type" label="Tipo de convite" rules={[{ required: true }]}>
          <Select options={optionsFrom(INVITE_TYPE_LABEL)} />
        </Form.Item>

        <Form.Item name="attendance" label="Comparecimento">
          <Select allowClear placeholder="Sem resposta" options={optionsFrom(ATTENDANCE_LABEL)} />
        </Form.Item>

        <Form.Item name="save_the_date_status" label="Save the Date">
          <Select allowClear placeholder="Sem registro" options={optionsFrom(SENT_LABEL)} />
        </Form.Item>

        <Form.Item
          name="invite_sent_status"
          label="Convite enviado"
          rules={[{ required: true }]}
        >
          <Select options={optionsFrom(SENT_LABEL)} />
        </Form.Item>

        {isEditing && (
          <>
            <Form.Item
              name="rsvp_id"
              label="Confirmação vinculada"
              extra="A resposta que esta pessoa enviou pelo site."
            >
              <Select
                allowClear
                showSearch
                placeholder="Nenhuma"
                options={rsvpOptions}
                filterOption={(input, option) =>
                  normalizeText(String(option?.label ?? '')).includes(normalizeText(input))
                }
              />
            </Form.Item>

            <Form.Item noStyle shouldUpdate={(prev, next) => prev.rsvp_id !== next.rsvp_id}>
              {({ getFieldValue }) =>
                getFieldValue('rsvp_id') ? (
                  <Form.Item
                    name="rsvp_role"
                    label="Papel na confirmação"
                    rules={[{ required: true, message: 'Escolha o papel.' }]}
                  >
                    <Select options={optionsFrom(RSVP_ROLE_LABEL)} />
                  </Form.Item>
                ) : null
              }
            </Form.Item>
          </>
        )}
      </Form>
    </Drawer>
  )
}
