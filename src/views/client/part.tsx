'use client';

import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { usePart } from '@/entities/part/api';
import { ApproxKgs } from '@/entities/reference/ui/approx-kgs';
import { money } from '@/shared/lib/format';
import { Badge, buttonClass, Loading, Panel, Photo, Stars } from '@/shared/ui';

export default function PartView() {
  const t = useTranslations('catalog');
  const tc = useTranslations('common');
  const locale = useLocale() as 'ru' | 'ky' | 'en';
  const { id } = useParams<{ id: string }>();
  const { data: p, isLoading } = usePart(id);
  const [active, setActive] = useState(0);
  if (isLoading || !p) return <Loading />;
  const seller = p.store?.seller;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div>
        <Photo src={p.photos[active]} className="aspect-[4/3] w-full rounded-xl border border-steel-light" alt={p.name} />
        {p.photos.length > 1 && (
          <div className="mt-2 flex gap-2">
            {p.photos.map((ph, i) => (
              <button key={ph} onClick={() => setActive(i)} aria-label={`Фото ${i + 1}`} className={i === active ? 'ring-2 ring-blue rounded-lg' : ''}>
                <Photo src={ph} className="size-16 rounded-lg" />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-1.5">
          <Badge tone={p.condition === 'NEW' ? 'ok' : 'neutral'}>{tc(`condition.${p.condition}`)}</Badge>
          <Badge tone={p.origin === 'ORIGINAL' ? 'blue' : 'neutral'}>{tc(`origin.${p.origin}`)}</Badge>
          {p.brand && <Badge>{p.brand}</Badge>}
          {p.category && <Badge>{p.category.name[locale] ?? p.category.name.ru}</Badge>}
        </div>
        <h1 className="text-[24px] font-semibold sm:text-[28px]">{p.name}</h1>
        <div className="flex flex-col">
          <p className="font-display text-[30px] font-semibold num">{money(p.price, p.currency)}</p>
          <ApproxKgs price={p.price} currency={p.currency} className="text-[15px]" />
        </div>
        <p className={p.stock > 0 ? 'text-ok' : 'text-danger'}>{p.stock > 0 ? t('inStock', { count: p.stock }) : t('outOfStock')}</p>
        {p.stock > 0 && (
          <Link href={`/checkout?partId=${p.id}`} className={buttonClass('primary', 'lg', 'self-start')}>
            {t('buy')}
          </Link>
        )}
        {!!p.oemNumbers.length && (
          <p>
            <span className="text-ink-mute">{t('oem')}: </span>
            <span className="code">{p.oemNumbers.join(', ')}</span>
          </p>
        )}
        {p.description && <p className="max-w-[65ch] whitespace-pre-line text-ink-soft">{p.description}</p>}
        {!!p.compatibility?.length && (
          <Panel>
            <h2 className="mb-2 font-semibold">{t('fits')}</h2>
            <ul className="flex flex-col gap-1 text-[15px]">
              {p.compatibility.map((c, i) => (
                <li key={c.id ?? i}>
                  {[c.make, c.model].filter(Boolean).join(' ')}
                  {(c.yearFrom || c.yearTo) && <span className="ml-2 text-ink-mute num">{[c.yearFrom ?? '…', c.yearTo ?? '…'].join('–')}</span>}
                </li>
              ))}
            </ul>
          </Panel>
        )}
        {p.store && (
          <Panel>
            <p className="text-sm text-ink-mute">{t('store')}</p>
            <p className="font-medium">{p.store.name}</p>
            <p className="text-ink-soft">
              {p.store.city}, {tc(`country.${p.store.country}`)}
            </p>
            {seller && (
              <Link href={`/sellers/${seller.id}`} className="mt-2 inline-flex items-center gap-2 text-blue hover:underline">
                {seller.displayName} {!!seller.reviewsCount && <Stars value={seller.rating} />}
              </Link>
            )}
          </Panel>
        )}
      </div>
    </div>
  );
}
