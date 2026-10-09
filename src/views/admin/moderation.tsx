'use client';

import { useState } from 'react';
import { api } from '@/shared/api/http';
import { useGet, useMut } from '@/shared/api/hooks';
import type { BlacklistEntry, Message, Paginated, Report, UserBlock } from '@/shared/api/types';
import { dateTime, phone } from '@/shared/lib/format';
import { BLACKLIST_LABEL, SENDER_LABEL } from './labels';
import { Badge, Button, DataTable, Field, Input, PageHeader, Panel, Segmented, Select } from '@/shared/ui';

export default function AdminModeration() {
  const [tab, setTab] = useState<'blocked' | 'reports' | 'appeals' | 'blacklist'>('blocked');
  const { data: blocked, isLoading: bl } = useGet<Paginated<Message>>(['admin-blocked'], tab === 'blocked' ? '/admin/chats/blocked-messages' : null, { limit: 50 });
  const { data: reports, isLoading: rl } = useGet<Paginated<Report>>(['admin-reports'], tab === 'reports' ? '/admin/reports' : null, { status: 'OPEN', limit: 50 });
  const { data: appeals, isLoading: al } = useGet<Paginated<UserBlock>>(['admin-appeals'], tab === 'appeals' ? '/admin/appeals' : null, { limit: 50 });
  const { data: bll, isLoading: bll2 } = useGet<Paginated<BlacklistEntry>>(['admin-blacklist'], tab === 'blacklist' ? '/admin/blacklist' : null, { limit: 100 });
  const resolve = useMut(({ id, status }: { id: string; status: 'RESOLVED' | 'DISMISSED' }) => api.post(`/admin/reports/${id}/resolve`, { status }), { invalidate: [['admin-reports']], success: 'Жалоба обработана' });
  const hide = useMut((id: string) => api.post(`/admin/chats/messages/${id}/hide`), { success: 'Сообщение скрыто' });
  const decide = useMut(({ id, decision }: { id: string; decision: 'APPROVED' | 'REJECTED' }) => api.post(`/admin/appeals/${id}`, { decision }), { invalidate: [['admin-appeals']], success: 'Решение сохранено' });
  const add = useMut((b: object) => api.post('/admin/blacklist', b), { invalidate: [['admin-blacklist']], success: 'Добавлено в чёрный список' });
  const del = useMut((id: string) => api.del(`/admin/blacklist/${id}`), { invalidate: [['admin-blacklist']] });
  const [bf, setBf] = useState({ type: 'PHONE', value: '', reason: '' });

  return (
    <>
      <PageHeader title="Модерация" subtitle="Попытки обхода, жалобы, обжалования, чёрный список" />
      <Segmented
        className="mb-4"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'blocked', label: 'Заблокированные сообщения' },
          { value: 'reports', label: 'Жалобы' },
          { value: 'appeals', label: 'Обжалования' },
          { value: 'blacklist', label: 'Чёрный список' },
        ]}
      />
      <Panel>
        {tab === 'blocked' && (
          <DataTable<Message>
            loading={bl}
            rows={blocked?.items}
            empty="Попыток передать контакты нет"
            columns={[
              { key: 'd', title: 'Когда', render: (m) => dateTime(m.createdAt) },
              { key: 'r', title: 'Кто', render: (m) => SENDER_LABEL[m.senderRole] ?? m.senderRole },
              { key: 't', title: 'Оригинал', render: (m) => <span className="whitespace-pre-line">{m.originalText}</span> },
              { key: 'f', title: 'Найдено', render: (m) => <span className="flex flex-wrap gap-1">{m.flags.map((f) => <Badge key={f} tone="danger">{f}</Badge>)}</span> },
            ]}
          />
        )}
        {tab === 'reports' && (
          <DataTable<Report>
            loading={rl}
            rows={reports?.items}
            empty="Открытых жалоб нет"
            columns={[
              { key: 'd', title: 'Когда', render: (r) => dateTime(r.createdAt) },
              { key: 't', title: 'На что', render: (r) => <Badge>{r.targetType}</Badge> },
              { key: 'id', title: 'ID', render: (r) => <span className="code text-[13px]">{r.targetId.slice(0, 8)}</span> },
              { key: 'r', title: 'Причина', render: (r) => r.reason },
              {
                key: 'x',
                title: '',
                render: (r) => (
                  <span className="flex flex-wrap gap-1">
                    {r.targetType === 'MESSAGE' && (
                      <Button size="sm" variant="ghost" onClick={() => hide.mutate(r.targetId)}>
                        Скрыть сообщение
                      </Button>
                    )}
                    <Button size="sm" variant="primary" onClick={() => resolve.mutate({ id: r.id, status: 'RESOLVED' })}>
                      Обработана
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => resolve.mutate({ id: r.id, status: 'DISMISSED' })}>
                      Отклонить
                    </Button>
                  </span>
                ),
              },
            ]}
          />
        )}
        {tab === 'appeals' && (
          <DataTable<UserBlock>
            loading={al}
            rows={appeals?.items}
            empty="Обжалований нет"
            columns={[
              { key: 'u', title: 'Пользователь', render: (b) => <span className="code">{phone(b.user?.phone)}</span> },
              { key: 'r', title: 'Причина блокировки', render: (b) => b.reason },
              { key: 'a', title: 'Обжалование', render: (b) => b.appealText },
              {
                key: 'x',
                title: '',
                render: (b) => (
                  <span className="flex gap-1">
                    <Button size="sm" variant="primary" onClick={() => decide.mutate({ id: b.id, decision: 'APPROVED' })}>
                      Разблокировать
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => decide.mutate({ id: b.id, decision: 'REJECTED' })}>
                      Отказать
                    </Button>
                  </span>
                ),
              },
            ]}
          />
        )}
        {tab === 'blacklist' && (
          <>
            <div className="mb-4 grid items-end gap-2 sm:grid-cols-[140px_1fr_1fr_auto]">
              <Field label="Тип">
                <Select value={bf.type} onChange={(e) => setBf({ ...bf, type: e.target.value })}>
                  <option value="PHONE">Телефон</option>
                  <option value="DEVICE">Устройство</option>
                </Select>
              </Field>
              <Field label="Значение">
                <Input value={bf.value} onChange={(e) => setBf({ ...bf, value: e.target.value })} className="code" />
              </Field>
              <Field label="Причина">
                <Input value={bf.reason} onChange={(e) => setBf({ ...bf, reason: e.target.value })} />
              </Field>
              <Button variant="danger" disabled={!bf.value} onClick={() => add.mutate({ ...bf, reason: bf.reason || undefined }, { onSuccess: () => setBf({ ...bf, value: '', reason: '' }) })}>
                Добавить
              </Button>
            </div>
            <DataTable<BlacklistEntry>
              loading={bll2}
              rows={bll?.items}
              empty="Список пуст"
              columns={[
                { key: 't', title: 'Тип', render: (b) => BLACKLIST_LABEL[b.type] ?? b.type },
                { key: 'v', title: 'Значение', render: (b) => <span className="code">{b.value}</span> },
                { key: 'r', title: 'Причина', render: (b) => b.reason ?? '—' },
                { key: 'd', title: 'Добавлен', render: (b) => dateTime(b.createdAt) },
                {
                  key: 'x',
                  title: '',
                  render: (b) => (
                    <Button size="sm" variant="ghost" onClick={() => del.mutate(b.id)}>
                      Убрать
                    </Button>
                  ),
                },
              ]}
            />
          </>
        )}
      </Panel>
    </>
  );
}
