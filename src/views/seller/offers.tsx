'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSellerOffers } from '@/entities/request/api';
import { OfferStatusBadge } from '@/entities/request/ui/status';
import { carTitle } from '@/entities/vehicle/api';
import type { Offer } from '@/shared/api/types';
import { ago, money } from '@/shared/lib/format';
import { DataTable, PageHeader, Pager, Panel, Segmented } from '@/shared/ui';

export default function SellerOffersView() {
  const t = useTranslations('seller.offers');
  const ts = useTranslations('status.offer');
  const tc = useTranslations('common');
  const tt = useTranslations('seller.table');
  const router = useRouter();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useSellerOffers({ page, status: status || undefined });

  return (
    <>
      <PageHeader title={t('title')} />
      <Segmented
        className="mb-4"
        value={status}
        onChange={(v) => (setStatus(v), setPage(1))}
        options={[{ value: '', label: tc('all') }, ...(['SENT', 'VIEWED', 'SELECTED', 'REJECTED'] as const).map((s) => ({ value: s, label: ts(s) }))]}
      />
      <Panel>
        <DataTable<Offer>
          loading={isLoading}
          rows={data?.items}
          empty={t('empty')}
          onRowClick={(o) => router.push(`/seller/feed/${o.requestId}`)}
          columns={[
            { key: 'title', title: tt('request'), render: (o) => <span className="font-medium">{o.request?.title ?? o.title}</span> },
            { key: 'car', title: tt('car'), render: (o) => (o.request ? carTitle(o.request) : '—') },
            { key: 'price', title: tt('price'), render: (o) => <span className="num">{money(o.price, o.currency)}</span> },
            { key: 'status', title: tt('status'), render: (o) => <OfferStatusBadge status={o.status} /> },
            { key: 'at', title: tt('when'), render: (o) => <span className="text-ink-mute">{ago(o.createdAt)}</span> },
          ]}
        />
        {data && <Pager page={page} total={data.total} limit={data.limit} onPage={setPage} />}
      </Panel>
    </>
  );
}
