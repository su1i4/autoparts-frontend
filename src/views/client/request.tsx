'use client';

import { Clock, MessageCircle, ShieldCheck, Truck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { openChat } from '@/entities/chat/api';
import { useMyOrders } from '@/entities/order/api';
import { useCategoryName } from '@/entities/reference/api';
import { OfferSort, useCancelRequest, useOffers, usePublishRequest, useRejectOffer, useRequest } from '@/entities/request/api';
import { OfferStatusBadge, RequestStatusBadge } from '@/entities/request/ui/status';
import { carTitle } from '@/entities/vehicle/api';
import { VinPlate } from '@/entities/vehicle/ui/vin-plate';
import type { Offer } from '@/shared/api/types';
import { cn } from '@/shared/lib/cn';
import { errorMessage } from '@/shared/lib/errors';
import { dateTime, money } from '@/shared/lib/format';
import { Badge, Button, buttonClass, Empty, Loading, Panel, Photo, Segmented, Stars } from '@/shared/ui';
import { AuthGuard } from '@/widgets/guard/auth-guard';

function OfferRow({ offer, best, canAct, onReject }: { offer: Offer; best: boolean; canAct: boolean; onReject: () => void }) {
  const t = useTranslations('request');
  const tc = useTranslations('common');
  const router = useRouter();
  const [chatting, setChatting] = useState(false);
  const active = offer.status === 'SENT' || offer.status === 'VIEWED';

  const ask = async () => {
    setChatting(true);
    try {
      const chat = await openChat({ requestId: offer.requestId, sellerId: offer.sellerId });
      router.push(`/chats/${chat.id}`);
    } catch (e) {
      toast.error(errorMessage(e));
      setChatting(false);
    }
  };

  return (
    <li
      className={cn(
        'grid gap-4 border-l-4 bg-surface p-4 sm:grid-cols-[160px_1fr_auto] sm:p-5',
        best ? 'border-amber' : 'border-transparent',
        !active && offer.status !== 'SELECTED' && 'opacity-60',
      )}
    >
      <div>
        {best && <Badge tone="amber" className="mb-1.5">{t('best')}</Badge>}
        <p className="font-display text-[24px] font-semibold num">{money(offer.price, offer.currency)}</p>
        {offer.currency !== 'KGS' && <p className="text-sm text-ink-mute num">{t('approxKgs', { amount: money(offer.priceKgs) })}</p>}
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={offer.condition === 'NEW' ? 'ok' : 'neutral'}>{tc(`condition.${offer.condition}`)}</Badge>
          <Badge tone={offer.origin === 'ORIGINAL' ? 'blue' : 'neutral'}>{tc(`origin.${offer.origin}`)}</Badge>
          {offer.brand && <Badge>{offer.brand}</Badge>}
          {!active && <OfferStatusBadge status={offer.status} />}
        </div>
        <ul className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-[15px] text-ink-soft">
          <li className="inline-flex items-center gap-1.5">
            <Clock className="size-4 text-ink-mute" /> {t('deliveryDays', { days: tc('days', { count: offer.deliveryDays }) })}
          </li>
          <li className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-ink-mute" />
            {offer.warrantyDays ? tc('warranty', { days: tc('days', { count: offer.warrantyDays }) }) : tc('noWarranty')}
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Truck className="size-4 text-ink-mute" /> {t('fromCountry', { country: tc(`country.${offer.shipFromCountry}`) })}
          </li>
        </ul>
        {offer.seller && (
          <Link href={`/sellers/${offer.seller.id}`} className="mt-2.5 inline-flex flex-wrap items-center gap-2 text-[15px] hover:underline">
            <span className="font-medium">{offer.seller.displayName}</span>
            {offer.seller.reviewsCount ? (
              <span className="inline-flex items-center gap-1 text-ink-soft">
                <Stars value={offer.seller.rating} /> <span className="num">{offer.seller.rating.toFixed(1)}</span>
                <span className="text-ink-mute">({t('reviews', { count: offer.seller.reviewsCount })})</span>
              </span>
            ) : (
              <span className="text-sm text-ink-mute">{t('sellerNew')}</span>
            )}
          </Link>
        )}
        {offer.comment && <p className="mt-2 max-w-[65ch] text-ink-soft">{offer.comment}</p>}
        {!!offer.photos.length && (
          <div className="mt-3 flex gap-2">
            {offer.photos.map((p) => (
              <a key={p} href={p} target="_blank" rel="noreferrer">
                <Photo src={p} className="size-16 rounded-lg border border-steel-light" />
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 sm:flex-col sm:flex-nowrap sm:items-stretch">
        {canAct && active && (
          <>
            <Link href={`/checkout?offerId=${offer.id}`} className={buttonClass('primary', 'md', 'flex-1 sm:flex-none')}>
              {t('choose')}
            </Link>
            <Button variant="outline" onClick={() => void ask()} loading={chatting} className="flex-1 sm:flex-none">
              <MessageCircle className="size-4" /> {t('ask')}
            </Button>
            <Button variant="ghost" size="sm" onClick={onReject} className="w-full sm:w-auto">
              {t('reject')}
            </Button>
          </>
        )}
      </div>
    </li>
  );
}

function RequestDetail() {
  const t = useTranslations('request');
  const tc = useTranslations('common');
  const { id } = useParams<{ id: string }>();
  const [sort, setSort] = useState<OfferSort>('price');
  const { data: r, isLoading } = useRequest(id);
  const { data: offers, isLoading: offersLoading } = useOffers(id, sort);
  const reject = useRejectOffer();
  const cancel = useCancelRequest();
  const publish = usePublishRequest();
  const categoryName = useCategoryName();
  const { data: orders } = useMyOrders();

  if (isLoading || !r) return <Loading />;
  const open = r.status === 'PUBLISHED' || r.status === 'HAS_OFFERS';
  const order = orders?.items.find((o) => o.requestId === r.id && o.status !== 'CANCELLED');
  const activeOffers = offers?.filter((o) => o.status === 'SENT' || o.status === 'VIEWED') ?? [];
  const bestId = sort === 'price' ? activeOffers[0]?.id : [...activeOffers].sort((a, b) => a.priceKgs - b.priceKgs)[0]?.id;

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <RequestStatusBadge status={r.status} />
            {r.category && <Badge>{categoryName(r.categoryId)}</Badge>}
          </div>
          <h1 className="mt-2 text-[24px] font-semibold sm:text-[30px]">{r.title}</h1>
          <p className="mt-1 text-[17px] text-ink-soft">{carTitle(r)}</p>
          {r.vin && <VinPlate vin={r.vin} size="sm" className="mt-3" />}
          {r.description && <p className="mt-4 max-w-[65ch] whitespace-pre-line">{r.description}</p>}
          {r.oemNumber && (
            <p className="mt-2 text-ink-soft">
              OEM: <span className="code text-ink">{r.oemNumber}</span>
            </p>
          )}
          {!!r.photos.length && (
            <div className="mt-4 flex flex-wrap gap-2">
              {r.photos.map((p) => (
                <a key={p} href={p} target="_blank" rel="noreferrer">
                  <Photo src={p} className="size-24 rounded-lg border border-steel-light" />
                </a>
              ))}
            </div>
          )}
        </div>
        <Panel className="h-fit text-[15px]">
          <dl className="flex flex-col gap-2">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-mute">{t('condition')}</dt>
              <dd>{tc(`condition.${r.condition}`)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-mute">{t('origin')}</dt>
              <dd>{tc(`country.${r.originCountry}`)}</dd>
            </div>
            {r.budget && (
              <div className="flex justify-between gap-3">
                <dt className="text-ink-mute">{t('budget')}</dt>
                <dd className="num">{money(r.budget, r.budgetCurrency)}</dd>
              </div>
            )}
          </dl>
          {open && r.expiresAt && <p className="mt-3 text-sm text-ink-mute">{t('expires', { date: dateTime(r.expiresAt) })}</p>}
          <div className="mt-4 flex flex-col gap-2">
            {r.status === 'DRAFT' && (
              <Button variant="primary" loading={publish.isPending} onClick={() => publish.mutate(r.id)}>
                {t('publishDraft')}
              </Button>
            )}
            {order && (
              <Link href={`/orders/${order.id}`} className={buttonClass('blue')}>
                {t('toOrder')}
              </Link>
            )}
            {(open || r.status === 'DRAFT') && (
              <Button
                variant="ghost"
                size="sm"
                loading={cancel.isPending}
                onClick={() => confirm(t('cancelConfirm')) && cancel.mutate(r.id, { onSuccess: () => toast.success(t('cancelled')) })}
              >
                {t('cancel')}
              </Button>
            )}
          </div>
        </Panel>
      </section>

      {r.status !== 'DRAFT' && (
        <section aria-labelledby="offers">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 id="offers" className="text-[20px] font-semibold">
              {t('offersTitle')} <span className="text-ink-mute num">{offers?.length ?? 0}</span>
            </h2>
            {!!offers?.length && (
              <Segmented
                value={sort}
                onChange={setSort}
                options={[
                  { value: 'price', label: t('sortPrice') },
                  { value: 'delivery', label: t('sortDelivery') },
                  { value: 'rating', label: t('sortRating') },
                ]}
              />
            )}
          </div>
          {offersLoading ? (
            <Loading />
          ) : !offers?.length ? (
            <Panel>
              <Empty icon={<Clock className="size-9" />} title={t('waiting')} text={t('waitingText')} />
            </Panel>
          ) : (
            <ul className="divide-y divide-steel-light overflow-hidden rounded-xl border border-steel-light">
              {offers.map((o) => (
                <OfferRow
                  key={o.id}
                  offer={o}
                  best={o.id === bestId && activeOffers.length > 1}
                  canAct={open}
                  onReject={() => reject.mutate(o.id, { onSuccess: () => toast.success(t('rejected')) })}
                />
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

export default function RequestView() {
  return (
    <AuthGuard>
      <RequestDetail />
    </AuthGuard>
  );
}
