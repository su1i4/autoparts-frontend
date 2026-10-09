'use client';

import { FileSearch } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';
import { useMyRequests } from '@/entities/request/api';
import { RequestStatusBadge } from '@/entities/request/ui/status';
import { carTitle } from '@/entities/vehicle/api';
import { ago } from '@/shared/lib/format';
import { buttonClass, Empty, Loading, PageHeader, Pager, Photo } from '@/shared/ui';
import { AuthGuard } from '@/widgets/guard/auth-guard';

function Requests() {
  const t = useTranslations('request');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMyRequests({ page });

  return (
    <>
      <PageHeader
        title={t('myTitle')}
        actions={
          <Link href="/requests/new" className={buttonClass('primary')}>
            {t('new')}
          </Link>
        }
      />
      {isLoading ? (
        <Loading />
      ) : !data?.items.length ? (
        <Empty
          icon={<FileSearch className="size-10" />}
          title={t('empty')}
          text={t('emptyText')}
          action={
            <Link href="/requests/new" className={buttonClass('primary')}>
              {t('new')}
            </Link>
          }
        />
      ) : (
        <>
          <ul className="divide-y divide-steel-light rounded-xl border border-steel-light bg-surface">
            {data.items.map((r) => (
              <li key={r.id}>
                <Link href={`/requests/${r.id}`} className="flex gap-3 p-4 hover:bg-paper">
                  <Photo src={r.photos[0]} className="size-16 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold">{r.title}</p>
                      <RequestStatusBadge status={r.status} />
                    </div>
                    <p className="text-ink-soft">{carTitle(r)}</p>
                    <p className="mt-1 flex gap-3 text-sm text-ink-mute">
                      <span>{t('offersCount', { count: r.offersCount })}</span>
                      <span>{ago(r.createdAt)}</span>
                    </p>
                  </div>
                  {r.status === 'HAS_OFFERS' && (
                    <span className="self-center rounded-full bg-amber px-2.5 py-1 font-display text-sm font-semibold num">{r.offersCount}</span>
                  )}
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

export default function RequestsView() {
  return (
    <AuthGuard>
      <Requests />
    </AuthGuard>
  );
}
