'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/shared/api/http';
import { useGet, useMut } from '@/shared/api/hooks';
import type { Role, User, UserBlock } from '@/shared/api/types';
import { date, dateTime, phone } from '@/shared/lib/format';
import { Badge, Button, Checkbox, Field, Input, KeyValue, Loading, PageHeader, Panel } from '@/shared/ui';
import { ROLE_LABEL } from './labels';

interface Profile {
  user: User;
  stats: { requests: number; orders: number; ordersCompleted: number; disputes: number; blockedMessages: number };
  blocks: UserBlock[];
}

export default function AdminUser() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useGet<Profile>(['admin-user', id], `/admin/users/${id}`);
  const inv = [['admin-user', id], ['admin-users']];
  const block = useMut((b: object) => api.post(`/admin/users/${id}/block`, b), { invalidate: inv, success: 'Пользователь заблокирован' });
  const unblock = useMut(() => api.post(`/admin/users/${id}/unblock`), { invalidate: inv, success: 'Разблокирован' });
  const roles = useMut((r: Role[]) => api.patch(`/admin/users/${id}/roles`, { roles: r }), { invalidate: inv, success: 'Роли обновлены' });
  const reset = useMut(() => api.post(`/admin/chats/users/${id}/reset-violations`), { invalidate: inv, success: 'Счётчик сброшен' });
  const [reason, setReason] = useState('');
  const [hours, setHours] = useState('');
  const [sel, setSel] = useState<Role[]>([]);

  useEffect(() => {
    if (data) setSel(data.user.roles);
  }, [data]);

  if (isLoading || !data) return <Loading />;
  const { user: u, stats, blocks } = data;

  return (
    <>
      <PageHeader title={u.name ?? phone(u.phone)} subtitle={<span className="code">{phone(u.phone)}</span>} />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <Panel>
            <KeyValue
              items={[
                ['Статус', u.status === 'BLOCKED' ? <Badge key="s" tone="danger">Заблокирован</Badge> : <Badge key="s" tone="ok">Активен</Badge>],
                ['Email', u.email ?? '—'],
                ['Город', u.city ?? '—'],
                ['Язык', u.language],
                ['Продавец', u.seller ? u.seller.displayName : '—'],
                ['Регистрация', date(u.createdAt)],
                ['Запросов', stats.requests],
                ['Заказов', `${stats.ordersCompleted} / ${stats.orders}`],
                ['Споров', stats.disputes],
                ['Заблокированных сообщений', stats.blockedMessages],
                ['Нарушений в чате', u.chatViolations],
                ['Чат ограничен до', dateTime(u.chatRestrictedUntil)],
              ]}
            />
            {u.chatViolations > 0 && (
              <Button variant="ghost" size="sm" className="mt-3" onClick={() => reset.mutate(undefined)}>
                Сбросить нарушения
              </Button>
            )}
          </Panel>
          <Panel className="flex flex-col gap-3">
            <h2 className="font-semibold">Роли и права</h2>
            <div className="flex flex-wrap gap-4">
              {(['CLIENT', 'SELLER', 'SUPPORT', 'LOGISTICS', 'ADMIN'] as Role[]).map((r) => (
                <Checkbox
                  key={r}
                  label={ROLE_LABEL[r]}
                  checked={sel.includes(r)}
                  disabled={r === 'CLIENT' || (r === 'SELLER' && !u.seller)}
                  onChange={(e) => setSel(e.target.checked ? [...sel, r] : sel.filter((x) => x !== r))}
                />
              ))}
            </div>
            <Button variant="blue" size="sm" className="self-start" loading={roles.isPending} onClick={() => roles.mutate(sel)}>
              Сохранить роли
            </Button>
          </Panel>
        </div>
        <div className="flex flex-col gap-5">
          <Panel className="flex flex-col gap-3">
            <h2 className="font-semibold">Блокировка</h2>
            {u.status === 'BLOCKED' ? (
              <Button variant="blue" loading={unblock.isPending} onClick={() => unblock.mutate(undefined)}>
                Разблокировать
              </Button>
            ) : (
              <>
                <Field label="Причина">
                  <Input value={reason} onChange={(e) => setReason(e.target.value)} />
                </Field>
                <Field label="Срок, часов" hint="Пусто — бессрочно">
                  <Input type="number" min={1} value={hours} onChange={(e) => setHours(e.target.value)} className="max-w-32" />
                </Field>
                <Button variant="danger" disabled={reason.length < 3} loading={block.isPending} onClick={() => block.mutate({ reason, hours: hours ? Number(hours) : undefined })}>
                  Заблокировать
                </Button>
              </>
            )}
          </Panel>
          <Panel>
            <h2 className="mb-3 font-semibold">История блокировок</h2>
            {!blocks.length ? (
              <p className="text-ink-mute">Не блокировался</p>
            ) : (
              <ul className="flex flex-col gap-3 text-[15px]">
                {blocks.map((b) => (
                  <li key={b.id} className="border-l-2 border-steel pl-3">
                    <p className="font-medium">{b.reason}</p>
                    <p className="text-sm text-ink-mute">
                      {dateTime(b.createdAt)}, до {b.until ? dateTime(b.until) : 'бессрочно'} {b.isActive && <Badge tone="danger">активна</Badge>}
                    </p>
                    {b.appealText && <p className="mt-1 text-sm">Обжалование: {b.appealText}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
