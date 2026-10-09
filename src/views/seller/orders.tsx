'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSellerOrders } from '@/entities/order/api';
import { OrderStatusBadge } from '@/entities/order/ui/status';
import type { Order, OrderStatus } from '@/shared/api/types';
import { date, money } from '@/shared/lib/format';
import { DataTable, PageHeader, Pager, Panel, Segmented } from '@/shared/ui';

export default function SellerOrdersView() {
  const t = useTranslations('seller.orders');
  const ts = useTranslations('status.order');
  const tc = useTranslations('common');
  const tt = useTranslations('seller.table');
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useSellerOrders({ page, status });

  return (
    <>
      <PageHeader title={t('title')} />
      <Segmented
        className="mb-4"
        value={status}
        onChange={(v) => (setStatus(v), setPage(1))}
        options={[{ value: '' as const, label: tc('all') }, ...(['PAID', 'CONFIRMED', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'DISPUTE'] as const).map((s) => ({ value: s, label: ts(s) }))]}
      />
      <Panel>
        <DataTable<Order>
          loading={isLoading}
          rows={data?.items}
          empty={t('empty')}
          onRowClick={(o) => router.push(`/seller/orders/${o.id}`)}
          columns={[
            { key: 'n', title: '№', render: (o) => <span className="code text-sm">{o.number}</span> },
            { key: 't', title: tt('item'), render: (o) => <span className="font-medium">{o.title}</span> },
            { key: 'p', title: t('payout'), render: (o) => <span className="num">{money(o.sellerPayoutAmount)}</span> },
            { key: 's', title: tt('status'), render: (o) => <OrderStatusBadge status={o.status} /> },
            { key: 'd', title: tt('date'), render: (o) => <span className="text-ink-mute">{date(o.createdAt)}</span> },
          ]}
        />
        {data && <Pager page={page} total={data.total} limit={data.limit} onPage={setPage} />}
      </Panel>
    </>
  );
}
