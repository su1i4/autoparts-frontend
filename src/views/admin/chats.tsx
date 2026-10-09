'use client';

import { useState } from 'react';
import { useGet } from '@/shared/api/hooks';
import type { Chat, Message, Paginated } from '@/shared/api/types';
import { cn } from '@/shared/lib/cn';
import { dateTime } from '@/shared/lib/format';
import { MESSAGE_STATUS_LABEL, SENDER_LABEL } from './labels';
import { Badge, DataTable, Dialog, Input, PageHeader, Panel, Segmented } from '@/shared/ui';

export default function AdminChats() {
  const [type, setType] = useState<'' | 'DISPUTE' | 'REQUEST'>('DISPUTE');
  const [userId, setUserId] = useState('');
  const [open, setOpen] = useState<Chat | null>(null);
  const { data, isLoading } = useGet<Paginated<Chat>>(['admin-chats', type, userId], '/admin/chats', { type, userId, limit: 50 });
  const { data: messages } = useGet<Message[]>(['admin-chat', open?.id], open ? `/admin/chats/${open.id}/messages` : null, { limit: 100 });
  return (
    <>
      <PageHeader title="Чаты" subtitle="Просмотр переписки по спорам и жалобам. Оригиналы заблокированных сообщений видны только здесь." />
      <div className="mb-4 flex flex-wrap gap-2">
        <Segmented
          value={type}
          onChange={setType}
          options={[
            { value: 'DISPUTE', label: 'Споры' },
            { value: 'REQUEST', label: 'Сделки' },
            { value: '', label: 'Все' },
          ]}
        />
        <Input placeholder="ID пользователя" value={userId} onChange={(e) => setUserId(e.target.value.trim())} className="code max-w-sm" />
      </div>
      <Panel>
        <DataTable<Chat>
          loading={isLoading}
          rows={data?.items}
          empty="Чатов нет"
          onRowClick={setOpen}
          columns={[
            { key: 't', title: 'Тип', render: (c) => <Badge tone={c.type === 'DISPUTE' ? 'danger' : 'neutral'}>{c.type === 'DISPUTE' ? 'Спор' : 'Сделка'}</Badge> },
            { key: 'l', title: 'Последнее', render: (c) => <span className="line-clamp-1 text-ink-soft">{c.lastMessagePreview}</span> },
            { key: 'd', title: 'Когда', render: (c) => dateTime(c.lastMessageAt) },
          ]}
        />
      </Panel>
      <Dialog open={!!open} onClose={() => setOpen(null)} title="Переписка" className="max-w-2xl">
        <ul className="flex flex-col gap-2">
          {[...(messages ?? [])].reverse().map((m) => (
            <li key={m.id} className={cn('rounded-lg px-3 py-2 text-[15px]', m.status === 'BLOCKED' ? 'border border-danger/40 bg-danger-tint' : 'bg-paper')}>
              <p className="text-[12px] text-ink-mute">
                {SENDER_LABEL[m.senderRole] ?? m.senderRole}, {dateTime(m.createdAt)} {m.status !== 'SENT' && <Badge tone="danger">{MESSAGE_STATUS_LABEL[m.status] ?? m.status}</Badge>}
              </p>
              <p className="whitespace-pre-line">{m.originalText ?? m.text}</p>
            </li>
          ))}
        </ul>
      </Dialog>
    </>
  );
}
