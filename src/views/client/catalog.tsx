'use client';

import { PackageSearch, Search } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { CatalogQuery, useCatalog } from '@/entities/part/api';
import { useCategories } from '@/entities/reference/api';
import { ApproxKgs } from '@/entities/reference/ui/approx-kgs';
import { useSession } from '@/entities/session/store';
import { carTitle, useGarage } from '@/entities/vehicle/api';
import type { Part } from '@/shared/api/types';
import { money } from '@/shared/lib/format';
import { Badge, Button, buttonClass, Empty, Input, Loading, PageHeader, Pager, Photo, Select } from '@/shared/ui';

export function PartTile({ p }: { p: Part }) {
  const t = useTranslations('catalog');
  const tc = useTranslations('common');
  return (
    <li>
      <Link href={`/catalog/${p.id}`} className="group flex h-full flex-col overflow-hidden rounded-xl border border-steel-light bg-surface hover:border-steel">
        <Photo src={p.photos[0]} className="aspect-[4/3] w-full" />
        <div className="flex flex-1 flex-col p-3">
          <div className="flex flex-wrap gap-1">
            <Badge tone={p.condition === 'NEW' ? 'ok' : 'neutral'}>{tc(`condition.${p.condition}`)}</Badge>
            {p.origin === 'ANALOG' && <Badge>{tc('origin.ANALOG')}</Badge>}
          </div>
          <p className="mt-2 line-clamp-2 font-medium group-hover:text-blue">{p.name}</p>
          {!!p.oemNumbers.length && <p className="code mt-0.5 truncate text-[13px] text-ink-mute">{p.oemNumbers[0]}</p>}
          <div className="mt-auto flex items-end justify-between gap-2 pt-3">
            <div className="flex flex-col">
              <p className="font-display text-lg font-semibold num">{money(p.price, p.currency)}</p>
              <ApproxKgs price={p.price} currency={p.currency} />
            </div>
            <span className="text-[13px] text-ink-mute">{p.store?.city}</span>
          </div>
          {p.stock < 1 && <p className="text-sm text-danger">{t('outOfStock')}</p>}
        </div>
      </Link>
    </li>
  );
}

export default function CatalogView() {
  const t = useTranslations('catalog');
  const tc = useTranslations('common');
  const locale = useLocale() as 'ru' | 'ky' | 'en';
  const router = useRouter();
  const sp = useSearchParams();
  const token = useSession((s) => s.accessToken);
  const { data: garage } = useGarage(!!token);
  const { data: categories } = useCategories();

  const q: CatalogQuery = {
    q: sp.get('q') ?? undefined,
    categoryId: sp.get('categoryId') ?? undefined,
    vehicleId: token ? (sp.get('vehicleId') ?? undefined) : undefined,
    sort: sp.get('sort') ?? undefined,
    page: Number(sp.get('page') ?? 1),
  };
  const [text, setText] = useState(q.q ?? '');
  const { data, isLoading } = useCatalog(q);

  const setParam = (k: string, v?: string) => {
    const n = new URLSearchParams(sp);
    if (v) n.set(k, v);
    else n.delete(k);
    if (k !== 'page') n.delete('page');
    router.replace(`/catalog?${n.toString()}`);
  };

  return (
    <>
      <PageHeader title={t('title')} subtitle={t('lead')} />
      <form
        className="mb-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setParam('q', text.trim() || undefined);
        }}
      >
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={t('search')} aria-label={t('search')} />
        <Button variant="blue" aria-label={tc('search')}>
          <Search className="size-4" />
        </Button>
      </form>
      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:max-w-3xl">
        {!!garage?.length && (
          <Select value={q.vehicleId ?? ''} onChange={(e) => setParam('vehicleId', e.target.value)} aria-label={t('forCar')}>
            <option value="">{t('allCars')}</option>
            {garage.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nickname || carTitle(v)}
              </option>
            ))}
          </Select>
        )}
        <Select value={q.categoryId ?? ''} onChange={(e) => setParam('categoryId', e.target.value)} aria-label={t('category')}>
          <option value="">{t('category')}</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name[locale] ?? c.name.ru}
            </option>
          ))}
        </Select>
        <Select value={q.sort ?? ''} onChange={(e) => setParam('sort', e.target.value)} aria-label={t('sort')}>
          <option value="">{t('sortNew')}</option>
          <option value="price_asc">{t('sortCheap')}</option>
          <option value="price_desc">{t('sortExpensive')}</option>
        </Select>
      </div>

      {isLoading ? (
        <Loading />
      ) : !data?.items.length ? (
        <Empty
          icon={<PackageSearch className="size-10" />}
          title={tc('notFound')}
          text={t('notFoundText')}
          action={
            <Link href="/requests/new" className={buttonClass('primary')}>
              {t('createRequest')}
            </Link>
          }
        />
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {data.items.map((p) => (
              <PartTile key={p.id} p={p} />
            ))}
          </ul>
          <Pager page={data.page} total={data.total} limit={data.limit} onPage={(p) => setParam('page', String(p))} />
        </>
      )}
    </>
  );
}
