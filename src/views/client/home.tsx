'use client';

import { Search } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCategories } from '@/entities/reference/api';
import { VIN_RE } from '@/entities/vehicle/api';
import { VinInput } from '@/features/vehicle/vin-input';
import { Button, Input } from '@/shared/ui';

export default function HomeView() {
  const t = useTranslations('home');
  const tt = useTranslations('track');
  const locale = useLocale() as 'ru' | 'ky' | 'en';
  const router = useRouter();
  const [vin, setVin] = useState('');
  const [q, setQ] = useState('');
  const [track, setTrack] = useState('');
  const { data: categories } = useCategories();

  const steps = [
    [t('how1'), t('how1Text')],
    [t('how2'), t('how2Text')],
    [t('how3'), t('how3Text')],
    [t('how4'), t('how4Text')],
  ];

  return (
    <div className="flex flex-col gap-12 sm:gap-16">
      <section className="pt-2 sm:pt-8">
        <h1 className="max-w-[16ch] text-[30px] font-bold sm:text-[44px]">{t('title')}</h1>
        <p className="mt-4 max-w-[58ch] text-[17px] text-ink-soft">{t('lead')}</p>
        <form
          className="mt-7 max-w-2xl"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(VIN_RE.test(vin) ? `/requests/new?vin=${vin}` : '/requests/new');
          }}
        >
          <VinInput value={vin} onChange={setVin} />
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Button variant="primary" size="lg" disabled={vin.length > 0 && !VIN_RE.test(vin)}>
              {t('vinGo')}
            </Button>
            <Link href="/requests/new" className="text-blue hover:underline">
              {t('noVin')}
            </Link>
          </div>
        </form>
      </section>

      <section aria-labelledby="catalog-search">
        <h2 id="catalog-search" className="text-lg font-semibold">
          {t('searchCatalog')}
        </h2>
        <form
          className="mt-3 flex max-w-2xl gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/catalog?q=${encodeURIComponent(q)}`);
          }}
        >
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('searchPlaceholder')} aria-label={t('searchCatalog')} />
          <Button variant="blue" aria-label={t('searchCatalog')}>
            <Search className="size-4" />
          </Button>
        </form>
        {!!categories?.length && (
          <ul className="mt-4 flex max-w-3xl flex-wrap gap-2">
            {categories.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/catalog?categoryId=${c.id}`}
                  className="inline-block rounded-full border border-steel bg-surface px-3 py-1.5 text-sm text-ink-soft hover:border-blue hover:text-blue"
                >
                  {c.name[locale] ?? c.name.ru}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="how">
        <h2 id="how" className="text-[22px] font-semibold">
          {t('howTitle')}
        </h2>
        <ol className="mt-5 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(([title, text], i) => (
            <li key={title} className="border-t-2 border-ink pt-3">
              <span className="font-display text-[13px] text-ink-mute num">{i + 1}</span>
              <h3 className="mt-1 text-[17px] font-semibold">{title}</h3>
              <p className="mt-1.5 text-ink-soft">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="track" className="max-w-2xl rounded-xl bg-blue px-5 py-6 text-white sm:px-7">
        <h2 id="track" className="text-xl font-semibold">
          {t('trackTitle')}
        </h2>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (track.trim()) router.push(`/track/${encodeURIComponent(track.trim())}`);
          }}
        >
          <Input value={track} onChange={(e) => setTrack(e.target.value)} placeholder={t('trackPlaceholder')} className="code border-transparent" aria-label={t('trackTitle')} />
          <Button variant="primary">{tt('find')}</Button>
        </form>
      </section>
    </div>
  );
}
