'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useCatalog } from '@/entities/part/api';
import { usePublicSeller, useSellerReviews } from '@/entities/seller/api';
import { date } from '@/shared/lib/format';
import { Badge, Loading, Panel, Stars } from '@/shared/ui';
import { PartTile } from './catalog';

export default function SellerPublicView() {
  const t = useTranslations('seller_public');
  const tv = useTranslations('status.verification');
  const tt = useTranslations('seller.apply.types');
  const tc = useTranslations('common');
  const { id } = useParams<{ id: string }>();
  const { data: s, isLoading } = usePublicSeller(id);
  const { data: reviews } = useSellerReviews(id);
  const { data: parts } = useCatalog({ sellerId: id });
  if (isLoading || !s) return <Loading />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-[26px] font-semibold">{s.displayName}</h1>
          <Badge tone={s.verificationStatus === 'VERIFIED' ? 'ok' : 'neutral'}>{tv(s.verificationStatus)}</Badge>
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-3 text-ink-soft">
          <span>{tt(s.type)}</span>
          {!!s.reviewsCount && (
            <span className="inline-flex items-center gap-1.5">
              <Stars value={s.rating} /> <span className="num">{s.rating.toFixed(1)}</span>
            </span>
          )}
          <span>{t('since', { date: date(s.createdAt) })}</span>
        </p>
      </div>
      {!!s.stores?.length && (
        <section>
          <h2 className="mb-2 text-lg font-semibold">{t('stores')}</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {s.stores.map((st) => (
              <li key={st.id} className="rounded-xl border border-steel-light bg-surface p-4">
                <p className="font-medium">{st.name}</p>
                <p className="text-ink-soft">
                  {st.city}, {tc(`country.${st.country}`)}
                </p>
                {st.description && <p className="mt-1 text-sm text-ink-mute">{st.description}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
      {!!parts?.items.length && (
        <section>
          <h2 className="mb-2 text-lg font-semibold">{t('parts')}</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {parts.items.map((p) => (
              <PartTile key={p.id} p={p} />
            ))}
          </ul>
        </section>
      )}
      <section>
        <h2 className="mb-2 text-lg font-semibold">{t('reviews')}</h2>
        {!reviews?.items.length ? (
          <p className="text-ink-mute">{t('noReviews')}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {reviews.items.map((r) => (
              <li key={r.id}>
                <Panel>
                  <div className="flex items-center justify-between">
                    <Stars value={r.rating} />
                    <span className="text-sm text-ink-mute">{date(r.createdAt)}</span>
                  </div>
                  {r.text && <p className="mt-2">{r.text}</p>}
                  {r.sellerReply && (
                    <div className="mt-3 border-l-2 border-blue pl-3">
                      <p className="text-sm text-ink-mute">{t('reply')}</p>
                      <p>{r.sellerReply}</p>
                    </div>
                  )}
                </Panel>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
