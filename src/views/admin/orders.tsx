'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { OrderStatusBadge } from '@/entities/order/ui/status';
import { useGet } from '@/shared/api/hooks';
import type { Order, OrderStatus, Paginated } from '@/shared/api/types';
import { dateTime, money } from '@/shared/lib/format';
import { DataTable, Input, PageHeader, Pager, Panel, Select } from '@/shared/ui';
import { ORDER_LABEL } from './labels';

export default function AdminOrders() {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState({ status: (sp.get('status') ?? '') as OrderStatus | '', number: '', page: 1 });
  const { data, isLoading } = useGet<Paginated<Order>>(['admin-orders', q], '/admin/orders', { ...q, limit: 30 });
  return (
    <>
      <PageHeader title="Заказы" />
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_220px]">
        <Input placeholder="Номер заказа AP-…" value={q.number} onChange={(e) => setQ({ ...q, number: e.target.value.trim().toUpperCase(), page: 1 })} className="code" />
        <Select value={q.status} onChange={(e) => setQ({ ...q, status: e.target.value as OrderStatus, page: 1 })} aria-label="Статус">
          <option value="">Все статусы</option>
          {Object.entries(ORDER_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </div>
      <Panel>
        <DataTable<Order>
          loading={isLoading}
          rows={data?.items}
          onRowClick={(o) => router.push(`/admin/orders/${o.id}`)}
          columns={[
            { key: 'n', title: '№', render: (o) => <span className="code">{o.number}</span> },
            { key: 't', title: 'Товар', render: (o) => <span className="font-medium">{o.title}</span> },
            { key: 'tot', title: 'Итого', render: (o) => <span className="num">{money(o.totalAmount)}</span> },
            { key: 'c', title: 'Комиссия', render: (o) => <span className="num">{money(o.commissionAmount)}</span> },
            { key: 's', title: 'Статус', render: (o) => <OrderStatusBadge status={o.status} /> },
            { key: 'd', title: 'Создан', render: (o) => dateTime(o.createdAt) },
          ]}
        />
        {data && <Pager page={q.page} total={data.total} limit={data.limit} onPage={(page) => setQ({ ...q, page })} />}
      </Panel>
    </>
  );
}
