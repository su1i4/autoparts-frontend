'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/shared/api/http';
import { useGet, useMut } from '@/shared/api/hooks';
import type { Dispute, DisputeResolution, DisputeStatus, Message, Order, Paginated, ReturnRequest } from '@/shared/api/types';
import { cn } from '@/shared/lib/cn';
import { dateTime, money } from '@/shared/lib/format';
import { Badge, Button, DataTable, Field, Input, Loading, PageHeader, Panel, Photo, Segmented, Textarea } from '@/shared/ui';
import { DISPUTE_REASON, RESOLUTION_LABEL, RETURN_LABEL, SENDER_LABEL } from './labels';

const ST: Record<DisputeStatus, string> = { OPEN: 'Открыт', SELLER_RESPONDED: 'Продавец ответил', IN_REVIEW: 'На рассмотрении', RESOLVED: 'Решён' };

export function AdminDisputes() {
  const router = useRouter();
  const [status, setStatus] = useState<DisputeStatus | ''>('OPEN');
  const { data, isLoading } = useGet<Paginated<Dispute>>(['admin-disputes', status], '/admin/disputes', { status, limit: 50 });
  return (
    <>
      <PageHeader title="Споры" subtitle="Очередь: сначала самые старые" />
      <Segmented
        className="mb-4"
        value={status}
        onChange={setStatus}
        options={[{ value: '' as const, label: 'Все' }, ...(Object.keys(ST) as DisputeStatus[]).map((k) => ({ value: k, label: ST[k] }))]}
      />
      <Panel>
        <DataTable<Dispute>
          loading={isLoading}
          rows={data?.items}
          empty="Споров нет"
          onRowClick={(d) => router.push(`/admin/disputes/${d.id}`)}
          columns={[
            { key: 'd', title: 'Открыт', render: (d) => dateTime(d.createdAt) },
            { key: 'r', title: 'Причина', render: (d) => DISPUTE_REASON[d.reason] ?? d.reason },
            { key: 't', title: 'Описание', render: (d) => <span className="line-clamp-2 text-ink-soft">{d.description}</span> },
            { key: 'e', title: 'Доказательств', render: (d) => d.evidence.length },
            { key: 's', title: 'Статус', render: (d) => <Badge tone={d.status === 'RESOLVED' ? 'ok' : 'amber'}>{ST[d.status]}</Badge> },
          ]}
        />
      </Panel>
    </>
  );
}

export function AdminDispute() {
  const { id } = useParams<{ id: string }>();
  const { data: d, isLoading } = useGet<Dispute>(['dispute', id], `/disputes/${id}`);
  const { data: order } = useGet<Order>(['admin-order', d?.orderId], d ? `/admin/orders/${d.orderId}` : null);
  const { data: messages } = useGet<Message[]>(['admin-chat', d?.chatId], d?.chatId ? `/admin/chats/${d.chatId}/messages` : null, { limit: 100 });
  const inv = [['dispute', id], ['admin-disputes'], ['admin-stats'], ['admin-chat', d?.chatId]];
  const review = useMut(() => api.post(`/admin/disputes/${id}/review`), { invalidate: inv, success: 'Взято в работу' });
  const resolve = useMut((b: object) => api.post(`/admin/disputes/${id}/resolve`, b), { invalidate: inv, success: 'Спор решён, деньги проведены' });
  const send = useMut((text: string) => api.post(`/chats/${d!.chatId}/messages`, { text }), { invalidate: inv });
  const [res, setRes] = useState<{ resolution: DisputeResolution; refundAmount: string; comment: string }>({ resolution: 'REFUND_FULL', refundAmount: '', comment: '' });
  const [msg, setMsg] = useState('');

  if (isLoading || !d) return <Loading />;
  return (
    <>
      <PageHeader
        title={`Спор: ${DISPUTE_REASON[d.reason] ?? d.reason}`}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone={d.status === 'RESOLVED' ? 'ok' : 'amber'}>{ST[d.status]}</Badge>
            {order && (
              <Link href={`/admin/orders/${order.id}`} className="code text-blue hover:underline">
                {order.number}
              </Link>
            )}
          </span>
        }
        actions={
          d.status !== 'RESOLVED' &&
          d.status !== 'IN_REVIEW' && (
            <Button variant="blue" onClick={() => review.mutate(undefined)}>
              Взять в работу
            </Button>
          )
        }
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <Panel>
            <h2 className="mb-2 font-semibold">Доказательства</h2>
            <ul className="flex flex-col gap-3">
              {d.evidence.map((e, i) => (
                <li key={i} className="border-l-2 border-steel pl-3">
                  <p className="text-sm text-ink-mute">
                    {e.role === 'CLIENT' ? 'Покупатель' : e.role === 'SELLER' ? 'Продавец' : 'Поддержка'}, {dateTime(e.at)}
                  </p>
                  {e.text && <p className="whitespace-pre-line">{e.text}</p>}
                  {!!e.photos.length && (
                    <div className="mt-1 flex gap-1.5">
                      {e.photos.map((p) => (
                        <a key={p} href={p} target="_blank" rel="noreferrer">
                          <Photo src={p} className="size-16 rounded-md" />
                        </a>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Panel>
          {order && (
            <Panel>
              <p className="font-medium">{order.title}</p>
              <p className="text-ink-soft">
                Итого {money(order.totalAmount)}, продавцу {money(order.sellerPayoutAmount)}
              </p>
            </Panel>
          )}
          {d.status === 'RESOLVED' ? (
            <Panel>
              <p className="font-semibold">{d.resolution ? RESOLUTION_LABEL[d.resolution] : '—'}</p>
              {!!d.refundAmount && <p>Возврат: {money(d.refundAmount)}</p>}
              {d.resolutionComment && <p className="text-ink-soft">{d.resolutionComment}</p>}
            </Panel>
          ) : (
            <Panel className="flex flex-col gap-3">
              <h2 className="font-semibold">Решение</h2>
              <Segmented
                value={res.resolution}
                onChange={(v) => setRes({ ...res, resolution: v })}
                options={[
                  { value: 'REFUND_FULL', label: 'Полный возврат' },
                  { value: 'REFUND_PARTIAL', label: 'Частичный' },
                  { value: 'PAYOUT_SELLER', label: 'Оплата продавцу' },
                ]}
              />
              {res.resolution === 'REFUND_PARTIAL' && (
                <Field label="Сумма возврата, сом">
                  <Input type="number" min={1} value={res.refundAmount} onChange={(e) => setRes({ ...res, refundAmount: e.target.value })} className="max-w-48" />
                </Field>
              )}
              <Field label="Комментарий (увидят обе стороны)">
                <Textarea value={res.comment} onChange={(e) => setRes({ ...res, comment: e.target.value })} className="min-h-16" />
              </Field>
              <Button
                variant="primary"
                loading={resolve.isPending}
                disabled={res.resolution === 'REFUND_PARTIAL' && !res.refundAmount}
                onClick={() =>
                  confirm('Провести решение? Деньги будут распределены сразу.') &&
                  resolve.mutate({ resolution: res.resolution, refundAmount: res.refundAmount ? Number(res.refundAmount) : undefined, comment: res.comment || undefined })
                }
              >
                Вынести решение
              </Button>
            </Panel>
          )}
        </div>
        <Panel className="flex h-fit flex-col gap-3">
          <h2 className="font-semibold">Чат спора</h2>
          <ul className="flex max-h-[520px] flex-col gap-2 overflow-y-auto">
            {[...(messages ?? [])].reverse().map((m) => (
              <li key={m.id} className={cn('rounded-lg px-3 py-2 text-[15px]', m.senderRole === 'SUPPORT' ? 'bg-amber-tint' : m.senderRole === 'SYSTEM' ? 'bg-steel-light text-sm' : 'bg-paper')}>
                <p className="text-[12px] text-ink-mute">
                  {SENDER_LABEL[m.senderRole] ?? m.senderRole}, {dateTime(m.createdAt)} {m.status === 'BLOCKED' && <Badge tone="danger">заблокировано</Badge>}
                </p>
                <p className="whitespace-pre-line">{m.originalText ?? m.text}</p>
              </li>
            ))}
          </ul>
          {d.chatId && d.status !== 'RESOLVED' && (
            <div className="flex gap-2">
              <Input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Сообщение от поддержки" />
              <Button variant="blue" disabled={!msg.trim()} onClick={() => send.mutate(msg, { onSuccess: () => setMsg('') })}>
                Отправить
              </Button>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}

export function AdminReturns() {
  const [status, setStatus] = useState<'REQUESTED' | 'APPROVED' | ''>('REQUESTED');
  const { data, isLoading } = useGet<Paginated<ReturnRequest>>(['admin-returns', status], '/admin/returns', { status, limit: 50 });
  const decide = useMut(({ id, ...b }: { id: string; approve: boolean; cost?: number; comment?: string }) => api.post(`/admin/returns/${id}/decide`, b), {
    invalidate: [['admin-returns']],
    success: 'Решение сохранено',
  });
  const received = useMut(({ id, ...b }: { id: string; refundAmount?: number }) => api.post(`/admin/returns/${id}/received`, b), { invalidate: [['admin-returns']], success: 'Возврат проведён' });
  return (
    <>
      <PageHeader title="Возвраты" />
      <Segmented
        className="mb-4"
        value={status}
        onChange={setStatus}
        options={[
          { value: 'REQUESTED', label: 'Новые' },
          { value: 'APPROVED', label: 'Ждём товар' },
          { value: '', label: 'Все' },
        ]}
      />
      <Panel>
        <DataTable<ReturnRequest>
          loading={isLoading}
          rows={data?.items}
          empty="Заявок нет"
          columns={[
            { key: 'd', title: 'Заявка', render: (r) => dateTime(r.createdAt) },
            {
              key: 'o',
              title: 'Заказ',
              render: (r) => (
                <Link href={`/admin/orders/${r.orderId}`} className="text-blue hover:underline">
                  открыть
                </Link>
              ),
            },
            { key: 'r', title: 'Причина', render: (r) => DISPUTE_REASON[r.reason] ?? r.reason },
            { key: 't', title: 'Описание', render: (r) => <span className="line-clamp-2 text-ink-soft">{r.description}</span> },
            { key: 'm', title: 'Способ', render: (r) => (r.method === 'COURIER' ? 'Курьер' : 'Сдаст в ПВЗ') },
            { key: 's', title: 'Статус', render: (r) => <Badge>{RETURN_LABEL[r.status] ?? r.status}</Badge> },
            {
              key: 'x',
              title: '',
              render: (r) =>
                r.status === 'REQUESTED' ? (
                  <span className="flex gap-1">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        const cost = prompt('Стоимость обратной доставки, сом (удержим из возврата)', '0');
                        if (cost !== null) decide.mutate({ id: r.id, approve: true, cost: Number(cost) || 0 });
                      }}
                    >
                      Одобрить
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const c = prompt('Причина отказа');
                        if (c) decide.mutate({ id: r.id, approve: false, comment: c });
                      }}
                    >
                      Отклонить
                    </Button>
                  </span>
                ) : r.status === 'APPROVED' ? (
                  <Button size="sm" variant="blue" onClick={() => confirm('Товар получен на складе? Деньги вернутся клиенту.') && received.mutate({ id: r.id })}>
                    Товар получен
                  </Button>
                ) : null,
            },
          ]}
        />
      </Panel>
    </>
  );
}
