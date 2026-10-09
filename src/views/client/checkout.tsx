'use client';

import { Check, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { getQuote, useCreateOrder } from '@/entities/order/api';
import { usePart } from '@/entities/part/api';
import { usePickupPoints } from '@/entities/reference/api';
import { useSession } from '@/entities/session/store';
import { api } from '@/shared/api/http';
import { useGet } from '@/shared/api/hooks';
import type { DeliveryMethod, Offer, Quote, ShippingMethod, ShippingOption } from '@/shared/api/types';
import { cn } from '@/shared/lib/cn';
import { errorMessage } from '@/shared/lib/errors';
import { money } from '@/shared/lib/format';
import { Button, ErrorBox, Field, Input, Loading, Note, Panel, Segmented, Spinner } from '@/shared/ui';
import { AuthGuard } from '@/widgets/guard/auth-guard';

function Checkout() {
  const t = useTranslations('checkout');
  const tc = useTranslations('common');
  const ts = useTranslations('status.shipping');
  const router = useRouter();
  const params = useSearchParams();
  const offerId = params.get('offerId') ?? undefined;
  const partId = params.get('partId') ?? undefined;
  const user = useSession((s) => s.user);

  const { data: offer } = useGet<Offer>(['offer', offerId], offerId ? `/offers/${offerId}` : null);
  const { data: part } = usePart(partId);
  const { data: points } = usePickupPoints();
  const create = useCreateOrder();

  const [delivery, setDelivery] = useState<DeliveryMethod>('PICKUP_POINT');
  const [pickupPointId, setPickupPointId] = useState('');
  const [address, setAddress] = useState({ city: user?.city ?? 'Бишкек', address: '', recipientName: user?.name ?? '', recipientPhone: user?.phone ?? '', comment: '' });
  const [qty, setQty] = useState(1);
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [method, setMethod] = useState<ShippingMethod | undefined>();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoting, setQuoting] = useState(false);

  const fromCountry = offer?.shipFromCountry ?? part?.store?.country;
  const weight = offer?.weightKg ?? (part?.weightKg ? part.weightKg * qty : undefined);
  const crossBorder = !!fromCountry && fromCountry !== 'KG';

  useEffect(() => {
    if (!pickupPointId && points?.length) setPickupPointId(points[0].id);
  }, [points, pickupPointId]);

  // варианты доставки (авиа/авто/ж-д) для зарубежных продавцов
  useEffect(() => {
    if (!crossBorder || !fromCountry) return;
    api
      .post<ShippingOption[]>('/logistics/calculate', { fromCountry, deliveryMethod: delivery, weightKg: weight ?? undefined })
      .then((o) => {
        setOptions(o);
        setMethod((m) => m ?? o[0]?.method);
      })
      .catch(() => setOptions([]));
  }, [crossBorder, fromCountry, delivery, weight]);

  const body = useMemo(
    () => ({
      ...(offerId ? { offerId } : { partId, quantity: qty }),
      deliveryMethod: delivery,
      ...(delivery === 'PICKUP_POINT' ? { pickupPointId } : { address }),
      ...(crossBorder && method ? { shippingMethod: method } : {}),
    }),
    [offerId, partId, qty, delivery, pickupPointId, address, crossBorder, method],
  );

  useEffect(() => {
    if (!fromCountry || (delivery === 'PICKUP_POINT' && !pickupPointId)) return;
    let alive = true;
    setQuoting(true);
    getQuote({ ...body, address: undefined })
      .then((q) => alive && (setQuote(q), setQuoteError(null)))
      .catch((e) => alive && (setQuote(null), setQuoteError(errorMessage(e))))
      .finally(() => alive && setQuoting(false));
    return () => {
      alive = false;
    };
    // адрес не влияет на цену — не пересчитываем на каждый символ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromCountry, offerId, partId, qty, delivery, pickupPointId, method]);

  if ((offerId && !offer) || (partId && !part)) return <Loading />;
  const title = offer?.title ?? part?.name;
  const courierInvalid = delivery === 'COURIER' && (!address.city || !address.address);

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_340px]">
      <div className="flex flex-col gap-5">
        <h1 className="text-[24px] font-semibold sm:text-[28px]">{t('title')}</h1>

        <Panel>
          <p className="text-lg font-semibold">{title}</p>
          <p className="mt-1 text-ink-soft">
            {offer?.seller?.displayName ?? part?.store?.name}
            {fromCountry && <span className="ml-2 text-ink-mute">{tc(`country.${fromCountry}`)}</span>}
          </p>
          {partId && part && (
            <Field label={t('quantity')} className="mt-3 max-w-32">
              <Input type="number" min={1} max={part.stock} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(part.stock, Number(e.target.value) || 1)))} />
            </Field>
          )}
        </Panel>

        <Panel className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[17px] font-semibold">{t('delivery')}</h2>
            <Segmented
              value={delivery}
              onChange={setDelivery}
              options={[
                { value: 'PICKUP_POINT', label: t('pickup') },
                { value: 'COURIER', label: t('courier') },
              ]}
            />
          </div>
          {delivery === 'PICKUP_POINT' ? (
            <ul className="grid gap-2" role="radiogroup" aria-label={t('pickupPoint')}>
              {points?.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={pickupPointId === p.id}
                    onClick={() => setPickupPointId(p.id)}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left',
                      pickupPointId === p.id ? 'border-blue bg-blue-tint' : 'border-steel hover:border-ink-mute',
                    )}
                  >
                    <MapPin className="mt-0.5 size-4 shrink-0 text-ink-mute" />
                    <span className="flex-1">
                      <span className="block font-medium">{p.name}</span>
                      <span className="block text-sm text-ink-soft">
                        {p.city}, {p.address}
                      </span>
                    </span>
                    {pickupPointId === p.id && <Check className="size-4 text-blue" />}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('city')}>
                <Input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} required />
              </Field>
              <Field label={t('address')}>
                <Input value={address.address} onChange={(e) => setAddress({ ...address, address: e.target.value })} placeholder={t('addressPlaceholder')} required />
              </Field>
              <Field label={t('recipient')}>
                <Input value={address.recipientName} onChange={(e) => setAddress({ ...address, recipientName: e.target.value })} />
              </Field>
              <Field label={t('recipientPhone')}>
                <Input type="tel" value={address.recipientPhone} onChange={(e) => setAddress({ ...address, recipientPhone: e.target.value })} />
              </Field>
              <Field label={t('comment')} className="sm:col-span-2">
                <Input value={address.comment} onChange={(e) => setAddress({ ...address, comment: e.target.value })} />
              </Field>
            </div>
          )}
        </Panel>

        {crossBorder && options.length > 0 && (
          <Panel>
            <h2 className="mb-3 text-[17px] font-semibold">{t('shipping')}</h2>
            <ul className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label={t('shipping')}>
              {options.map((o) => (
                <li key={o.method}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={method === o.method}
                    onClick={() => setMethod(o.method)}
                    className={cn(
                      'w-full rounded-lg border px-3 py-2.5 text-left',
                      method === o.method ? 'border-blue bg-blue-tint' : 'border-steel hover:border-ink-mute',
                    )}
                  >
                    <span className="block font-medium">{ts(o.method)}</span>
                    <span className="block font-display font-semibold num">{money(o.total)}</span>
                    <span className="block text-sm text-ink-mute">{tc('daysRange', { min: o.daysMin, max: o.daysMax })}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>

      <aside className="lg:pt-[52px]">
        <Panel className="sticky top-20 flex flex-col gap-3">
          {quoting && !quote ? (
            <p className="flex items-center gap-2 text-ink-soft">
              <Spinner /> {t('calculating')}
            </p>
          ) : quoteError ? (
            <ErrorBox>{quoteError}</ErrorBox>
          ) : (
            quote && (
              <>
                <dl className="flex flex-col gap-2 text-[15px]">
                  <div className="flex justify-between">
                    <dt className="text-ink-soft">
                      {t('goods')}
                      {quote.quantity > 1 && <span className="text-ink-mute"> × {quote.quantity}</span>}
                    </dt>
                    <dd className="num">{money(quote.goodsAmount)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-soft">
                      {t('shippingCost')} <span className="text-ink-mute">{ts(quote.shippingMethod)}</span>
                    </dt>
                    <dd className="num">{money(quote.shippingAmount)}</dd>
                  </div>
                  <div className="flex items-baseline justify-between border-t border-steel-light pt-3">
                    <dt className="font-semibold">{t('total')}</dt>
                    <dd className="font-display text-[24px] font-semibold num">{money(quote.totalAmount)}</dd>
                  </div>
                </dl>
                {quote.currency !== 'KGS' && <p className="text-sm text-ink-mute">{t('rate', { currency: quote.currency, rate: quote.exchangeRate })}</p>}
              </>
            )
          )}
          <Note>{t('escrow')}</Note>
          <Button
            variant="primary"
            size="lg"
            loading={create.isPending}
            disabled={!quote || courierInvalid || (delivery === 'PICKUP_POINT' && !pickupPointId)}
            onClick={() => create.mutate(body, { onSuccess: (o) => router.replace(`/orders/${o.id}?pay=1`) })}
          >
            {t('placeOrder')}
          </Button>
        </Panel>
      </aside>
    </div>
  );
}

export default function CheckoutView() {
  return (
    <AuthGuard>
      <Checkout />
    </AuthGuard>
  );
}
