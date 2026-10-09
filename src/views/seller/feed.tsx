'use client';

import { Inbox } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';
import { useCategoryName, useCategories, useMakes } from '@/entities/reference/api';
import { FeedQuery, useFeed } from '@/entities/request/api';
import { carTitle } from '@/entities/vehicle/api';
import { ago } from '@/shared/lib/format';
import { Badge, Checkbox, Empty, Input, Loading, PageHeader, Pager, Photo, Select } from '@/shared/ui';

export default function FeedView() {
  const t = useTranslations('seller.feed');
  const tr = useTranslations('request');
  const tc = useTranslations('common');
  const tt = useTranslations('seller.table');
  const locale = useLocale() as 'ru' | 'ky' | 'en';
  const { data: makes } = useMakes();
  const { data: categories } = useCategories();
  const categoryName = useCategoryName();
  const [q, setQ] = useState<FeedQuery>({ page: 1 });
  const { data, isLoading } = useFeed(q);
  const set = (p: Partial<FeedQuery>) => setQ((x) => ({ ...x, ...p, page: p.page ?? 1 }));

  return (
    <>
      <PageHeader title={t('title')} subtitle={t('lead')} />
      <div className="mb-4 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Input placeholder={tc('search')} value={q.q ?? ''} onChange={(e) => set({ q: e.target.value || undefined })} />
          <Select value={q.make ?? ''} onChange={(e) => set({ make: e.target.value || undefined })} aria-label={t('make')}>
            <option value="">{t('make')}</option>
            {makes?.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name}
              </option>
            ))}
          </Select>
          <Select value={q.categoryId ?? ''} onChange={(e) => set({ categoryId: e.target.value || undefined })} aria-label={tr('category')}>
            <option value="">{tr('category')}</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name[locale] ?? c.name.ru}
              </option>
            ))}
          </Select>
          <Input placeholder={tt('city')} value={q.city ?? ''} onChange={(e) => set({ city: e.target.value || undefined })} />
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Checkbox label={t('matchesOnly')} checked={!!q.matchesOnly} onChange={(e) => set({ matchesOnly: e.target.checked || undefined })} />
          <Checkbox label={t('hideAnswered')} checked={!!q.hideAnswered} onChange={(e) => set({ hideAnswered: e.target.checked || undefined })} />
        </div>
      </div>
      {isLoading ? (
        <Loading />
      ) : !data?.items.length ? (
        <Empty icon={<Inbox className="size-10" />} title={t('empty')} text={t('emptyText')} />
      ) : (
        <>
          <ul className="divide-y divide-steel-light rounded-xl border border-steel-light bg-surface">
            {data.items.map((r) => (
              <li key={r.id}>
                <Link href={`/seller/feed/${r.id}`} className="flex gap-3 p-4 hover:bg-paper">
                  <Photo src={r.photos[0]} className="size-16 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {r.matchesAssortment && <Badge tone="amber">{t('match')}</Badge>}
                      {r.myOfferId && <Badge tone="ok">{t('answered')}</Badge>}
                      {r.categoryId && <Badge>{categoryName(r.categoryId)}</Badge>}
                    </div>
                    <p className="mt-1 truncate font-semibold">{r.title}</p>
                    <p className="text-ink-soft">{carTitle(r)}</p>
                    <p className="mt-0.5 flex flex-wrap gap-3 text-sm text-ink-mute">
                      <span>{r.city ?? r.country}</span>
                      <span>{tr('offersCount', { count: r.offersCount })}</span>
                      <span>{ago(r.publishedAt)}</span>
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <Pager page={data.page} total={data.total} limit={data.limit} onPage={(page) => setQ((x) => ({ ...x, page }))} />
        </>
      )}
    </>
  );
}
