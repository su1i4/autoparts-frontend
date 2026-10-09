'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useSellerOrders } from '@/entities/order/api';
import { OrderStatusBadge } from '@/entities/order/ui/status';
import { useSellerStats } from '@/entities/seller/api';
import { money } from '@/shared/lib/format';
import { buttonClass, Loading, PageHeader, Panel, Stars } from '@/shared/ui';

function Figure({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className={accent ? 'rounded-xl bg-ink p-4 text-white' : 'rounded-xl border border-steel-light bg-surface p-4'}>
      <p className={accent ? 'text-sm text-white/70' : 'text-sm text-ink-mute'}>{label}</p>
      <p className="mt-1 font-display text-[22px] font-semibold num">{value}</p>
    </div>
  );
}

export default function SellerDashboard() {
  const t = useTranslations('seller.dashboard');
  const ts = useTranslations('seller');
  const { data: s, isLoading } = useSellerStats();
  const { data: paid } = useSellerOrders({ status: 'PAID' });

  if (isLoading || !s) return <Loading />;
  return (
    <>
      <PageHeader
        title={ts('nav.dashboard')}
        actions={
          <Link href="/seller/feed" className={buttonClass('primary')}>
            {t('toFeed')}
          </Link>
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Figure accent label={t('balance')} value={money(s.balanceAvailable)} />
        <Figure label={t('hold')} value={money(s.balanceHold)} />
        <Figure label={t('revenue')} value={money(s.revenue)} />
        <Figure
          label={t('rating')}
          value={
            <span className="inline-flex items-center gap-2">
              {s.rating ? s.rating.toFixed(1) : '—'} <Stars value={s.rating} size={16} />
            </span>
          }
        />
        <Figure label={t('offers')} value={s.offersTotal} />
        <Figure label={t('conversion')} value={`${s.conversion}%`} />
        <Figure label={t('orders')} value={`${s.ordersCompleted} / ${s.ordersTotal}`} />
        <Figure label={t('views')} value={s.storeViews} />
      </div>
      {!!paid?.items.length && (
        <Panel className="mt-6">
          <h2 className="mb-3 text-[17px] font-semibold">{t('newOrders')}</h2>
          <ul className="divide-y divide-steel-light">
            {paid.items.map((o) => (
              <li key={o.id}>
                <Link href={`/seller/orders/${o.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:text-blue">
                  <span className="min-w-0">
                    <span className="code mr-2 text-sm text-ink-mute">{o.number}</span>
                    <span className="font-medium">{o.title}</span>
                  </span>
                  <OrderStatusBadge status={o.status} />
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  );
}
