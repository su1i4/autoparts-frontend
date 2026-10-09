'use client';

import { useState } from 'react';
import { api } from '@/shared/api/http';
import { useGet, useMut } from '@/shared/api/hooks';
import type { Offer, Paginated, PartRequest, RequestStatus } from '@/shared/api/types';
import { dateTime, money, phone } from '@/shared/lib/format';
import { Badge, Button, DataTable, Input, PageHeader, Pager, Panel, Segmented, Select } from '@/shared/ui';
import { OFFER_LABEL, REQUEST_LABEL } from './labels';

export function AdminRequests() {
  const [q, setQ] = useState({ status: '' as RequestStatus | '', q: '', page: 1 });
  const { data, isLoading } = useGet<Paginated<PartRequest>>(['admin-requests', q], '/admin/requests', { ...q, limit: 30 });
  const close = useMut(({ id, reason }: { id: string; reason: string }) => api.post(`/admin/requests/${id}/close`, { reason }), { invalidate: [['admin-requests']], success: 'Запрос закрыт' });
  return (
    <>
      <PageHeader title="Запросы" subtitle="Модерация и закрытие нарушающих правила" />
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_220px]">
        <Input placeholder="Название, марка или VIN" value={q.q} onChange={(e) => setQ({ ...q, q: e.target.value, page: 1 })} />
        <Select value={q.status} onChange={(e) => setQ({ ...q, status: e.target.value as RequestStatus, page: 1 })} aria-label="Статус">
          <option value="">Все статусы</option>
          {Object.entries(REQUEST_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </div>
      <Panel>
        <DataTable<PartRequest>
          loading={isLoading}
          rows={data?.items}
          columns={[
            { key: 't', title: 'Деталь', render: (r) => <span className="font-medium">{r.title}</span> },
            { key: 'c', title: 'Авто', render: (r) => [r.make, r.model, r.year].filter(Boolean).join(' ') },
            { key: 'u', title: 'Клиент', render: (r) => <span className="code text-sm">{phone(r.client?.phone)}</span> },
            { key: 'o', title: 'Офферов', render: (r) => r.offersCount },
            { key: 's', title: 'Статус', render: (r) => <Badge>{REQUEST_LABEL[r.status]}</Badge> },
            { key: 'd', title: 'Создан', render: (r) => dateTime(r.createdAt) },
            {
              key: 'a',
              title: '',
              render: (r) =>
                ['PUBLISHED', 'HAS_OFFERS'].includes(r.status) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const reason = prompt('Причина закрытия');
                      if (reason) close.mutate({ id: r.id, reason });
                    }}
                  >
                    Закрыть
                  </Button>
                ),
            },
          ]}
        />
        {data && <Pager page={q.page} total={data.total} limit={data.limit} onPage={(page) => setQ({ ...q, page })} />}
      </Panel>
    </>
  );
}

export function AdminOffers() {
  const [page, setPage] = useState(1);
  const [requestId, setRequestId] = useState('');
  const [status, setStatus] = useState('');
  const { data, isLoading } = useGet<Paginated<Offer>>(['admin-offers', page, requestId], '/admin/offers', { page, limit: 30, requestId });
  const remove = useMut(({ id, reason }: { id: string; reason: string }) => api.post(`/admin/offers/${id}/remove`, { reason }), { invalidate: [['admin-offers']], success: 'Предложение удалено' });
  const rows = status ? data?.items.filter((o) => o.status === status) : data?.items;
  return (
    <>
      <PageHeader title="Предложения" subtitle="Удаление предложений, нарушающих правила" />
      <div className="mb-4 flex flex-wrap gap-2">
        <Input placeholder="ID запроса" value={requestId} onChange={(e) => setRequestId(e.target.value.trim())} className="code max-w-sm" />
        <Segmented
          value={status}
          onChange={setStatus}
          options={[
            { value: '', label: 'Все' },
            { value: 'SENT', label: 'Отправлены' },
            { value: 'SELECTED', label: 'Выбраны' },
            { value: 'REMOVED', label: 'Удалены' },
          ]}
        />
      </div>
      <Panel>
        <DataTable<Offer>
          loading={isLoading}
          rows={rows}
          columns={[
            { key: 't', title: 'Предложение', render: (o) => <span className="font-medium">{o.title}</span> },
            { key: 's', title: 'Продавец', render: (o) => o.seller?.displayName },
            { key: 'p', title: 'Цена', render: (o) => <span className="num">{money(o.price, o.currency)}</span> },
            { key: 'c', title: 'Комментарий', render: (o) => <span className="line-clamp-2 text-ink-soft">{o.comment}</span> },
            { key: 'st', title: 'Статус', render: (o) => <Badge tone={o.status === 'REMOVED' ? 'danger' : 'neutral'}>{OFFER_LABEL[o.status] ?? o.status}</Badge> },
            { key: 'd', title: 'Когда', render: (o) => dateTime(o.createdAt) },
            {
              key: 'a',
              title: '',
              render: (o) =>
                !['REMOVED', 'SELECTED'].includes(o.status) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const reason = prompt('Причина удаления');
                      if (reason) remove.mutate({ id: o.id, reason });
                    }}
                  >
                    Удалить
                  </Button>
                ),
            },
          ]}
        />
        {data && <Pager page={page} total={data.total} limit={data.limit} onPage={setPage} />}
      </Panel>
    </>
  );
}
