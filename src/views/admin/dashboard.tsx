'use client';

import Link from 'next/link';
import { useGet } from '@/shared/api/hooks';
import type { AdminStats } from '@/shared/api/types';
import { money } from '@/shared/lib/format';
import { Loading, PageHeader, Panel } from '@/shared/ui';
import { ORDER_LABEL } from './labels';

function Tile({ label, value, href, warn }: { label: string; value: React.ReactNode; href?: string; warn?: boolean }) {
  const body = (
    <div className={`h-full rounded-xl border p-4 ${warn ? 'border-amber bg-amber-tint' : 'border-steel-light bg-surface'}`}>
      <p className="text-sm text-ink-mute">{label}</p>
      <p className="mt-1 font-display text-[22px] font-semibold num">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default function AdminDashboard() {
  const { data: s, isLoading } = useGet<AdminStats>(['admin-stats'], '/admin/stats');
  if (isLoading || !s) return <Loading />;
  const statuses = Object.entries(s.ordersByStatus).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...statuses.map(([, n]) => n));

  return (
    <>
      <PageHeader title="Сводка" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Оборот (завершённые)" value={money(s.gmv)} />
        <Tile label="Доход: комиссия" value={money(s.commissionRevenue)} />
        <Tile label="В эскроу" value={money(s.escrowBalance)} />
        <Tile label="Пользователи" value={`${s.users} (+${s.usersToday})`} href="/admin/users" />
        <Tile label="Продавцы на проверке" value={s.sellersPending} href="/admin/sellers" warn={s.sellersPending > 0} />
        <Tile label="Открытые споры" value={s.disputesOpen} href="/admin/disputes" warn={s.disputesOpen > 0} />
        <Tile label="Выплаты в очереди" value={s.payoutsPending} href="/admin/payouts" warn={s.payoutsPending > 0} />
        <Tile label="Попытки обхода (7 дн.)" value={s.blockedMessages7d} href="/admin/moderation" />
        <Tile label="Открытые запросы" value={s.requestsOpen} href="/admin/requests" />
        <Tile label="Запросов за сутки" value={s.requestsToday} />
        <Tile label="Предложений за сутки" value={s.offersToday} />
        <Tile label="Предложений на запрос" value={s.avgOffersPerRequest} />
      </div>
      <Panel className="mt-6">
        <h2 className="mb-3 font-semibold">Заказы по статусам</h2>
        <ul className="flex flex-col gap-2">
          {statuses.map(([st, n]) => (
            <li key={st} className="grid grid-cols-[180px_1fr_40px] items-center gap-3 text-[15px]">
              <Link href={`/admin/orders?status=${st}`} className="hover:text-blue">
                {ORDER_LABEL[st as keyof typeof ORDER_LABEL] ?? st}
              </Link>
              <span className="h-2 rounded-full bg-steel-light" title={`${ORDER_LABEL[st as keyof typeof ORDER_LABEL] ?? st}: ${n}`}>
                <span className="block h-2 rounded-full bg-blue" style={{ width: `${(n / max) * 100}%` }} />
              </span>
              <span className="text-right num">{n}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
