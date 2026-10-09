'use client';

import { Package } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';
import { useMyOrders } from '@/entities/order/api';
import { OrderStatusBadge } from '@/entities/order/ui/status';
import { date, money } from '@/shared/lib/format';
import { buttonClass, Empty, Loading, PageHeader, Pager } from '@/shared/ui';
import { AuthGuard } from '@/widgets/guard/auth-guard';

function Orders() {
  const t = useTranslations('order');
  const tn = useTranslations('nav');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMyOrders({ page });

  return (
    <>
      <PageHeader title={t('listTitle')} />
      {isLoading ? (
        <Loading />
      ) : !data?.items.length ? (
        <Empty
          icon={<Package className="size-10" />}
          title={t('empty')}
          text={t('emptyText')}
          action={
            <Link href="/catalog" className={buttonClass('outline')}>
              {tn('catalog')}
            </Link>
          }
        />
      ) : (
        <>
          <ul className="divide-y divide-steel-light rounded-xl border border-steel-light bg-surface">
            {data.items.map((o) => (
              <li key={o.id}>
                <Link href={`/orders/${o.id}`} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-paper">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="code text-sm text-ink-mute">{o.number}</span>
                      <OrderStatusBadge status={o.status} />
                    </div>
                    <p className="mt-1 truncate font-semibold">{o.title}</p>
                    <p className="text-sm text-ink-mute">{date(o.createdAt)}</p>
                  </div>
                  <p className="font-display text-lg font-semibold num">{money(o.totalAmount)}</p>
                </Link>
              </li>
            ))}
          </ul>
          <Pager page={page} total={data.total} limit={data.limit} onPage={setPage} />
        </>
      )}
    </>
  );
}

export default function OrdersView() {
  return (
    <AuthGuard>
      <Orders />
    </AuthGuard>
  );
}
