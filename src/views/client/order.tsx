'use client';

import { Copy, MessageCircle, Star } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useChats } from '@/entities/chat/api';
import { useCreateReview, useDispute, useOpenDispute, useRequestReturn } from '@/entities/dispute/api';
import { useCancelOrder, useConfirmReceipt, useMockConfirm, useOrder, usePay, useTracking } from '@/entities/order/api';
import { OrderStatusBadge, SHIPMENT_STEPS } from '@/entities/order/ui/status';
import { useSession } from '@/entities/session/store';
import { PhotoPicker } from '@/features/upload/photo-picker';
import type { Order, PayInit, PaymentMethod, Shipment } from '@/shared/api/types';
import { cn } from '@/shared/lib/cn';
import { date, dateTime, money } from '@/shared/lib/format';
import { Button, buttonClass, Dialog, Field, Loading, Note, Panel, Select, Textarea } from '@/shared/ui';
import { AuthGuard } from '@/widgets/guard/auth-guard';

const METHODS: PaymentMethod[] = ['MBANK', 'ODENGI', 'ELCART', 'CARD', 'OPTIMA', 'QR', 'BANK_TRANSFER'];

function PaymentPanel({ order }: { order: Order }) {
  const t = useTranslations('checkout');
  const [method, setMethod] = useState<PaymentMethod>('MBANK');
  const [init, setInit] = useState<PayInit | null>(null);
  const pay = usePay();
  const mock = useMockConfirm();

  if (init) {
    const isMock = init.redirectUrl?.includes('/mock-confirm');
    return (
      <div className="flex flex-col gap-3">
        {init.instructions && !isMock && (
          <>
            <p className="font-medium">{t('manualPay')}</p>
            <Note tone="amber">{init.instructions}</Note>
          </>
        )}
        {isMock && (
          <>
            <Note tone="amber">{t('testPay')}</Note>
            <Button variant="primary" size="lg" loading={mock.isPending} onClick={() => mock.mutate(init.payment.id, { onSuccess: () => toast.success(t('paid')) })}>
              {t('confirmTestPay')}
            </Button>
          </>
        )}
        {init.redirectUrl && !isMock && (
          <a href={init.redirectUrl} className={buttonClass('primary', 'lg')}>
            {t('pay', { amount: money(order.totalAmount) })}
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="font-semibold">{t('payMethod')}</p>
      <ul className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t('payMethod')}>
        {METHODS.map((m) => (
          <li key={m}>
            <button
              type="button"
              role="radio"
              aria-checked={method === m}
              onClick={() => setMethod(m)}
              className={cn('w-full rounded-lg border px-3 py-2 text-left text-[15px]', method === m ? 'border-blue bg-blue-tint font-medium' : 'border-steel hover:border-ink-mute')}
            >
              {t(`method.${m}`)}
            </button>
          </li>
        ))}
      </ul>
      <Button variant="primary" size="lg" loading={pay.isPending} onClick={() => pay.mutate({ id: order.id, method }, { onSuccess: setInit })}>
        {t('pay', { amount: money(order.totalAmount) })}
      </Button>
      <Note>{t('escrow')}</Note>
    </div>
  );
}

function Tracking({ shipment }: { shipment?: Shipment }) {
  const t = useTranslations('order');
  const ts = useTranslations('status.shipment');
  const tc = useTranslations('common');
  if (!shipment) return <p className="text-ink-mute">{t('noTracking')}</p>;
  const events = shipment.events ?? [];
  const reached = new Set(events.map((e) => e.status));
  // местные продавцы пропускают склад в Китае и таможню
  const steps = SHIPMENT_STEPS.filter((s) => shipment.fromCountry !== 'KG' || !['AT_ORIGIN_WAREHOUSE', 'AT_CUSTOMS'].includes(s));
  const currentIdx = Math.max(...steps.map((s, i) => (reached.has(s) ? i : -1)));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-[15px]">
        <span className="text-ink-mute">{t('trackNumber')}</span>
        <span className="code font-medium">{shipment.trackingNumber}</span>
        <button
          onClick={() => navigator.clipboard.writeText(shipment.trackingNumber).then(() => toast.success(tc('copied')))}
          className="rounded p-1 text-ink-mute hover:bg-steel-light"
          aria-label={tc('copy')}
        >
          <Copy className="size-4" />
        </button>
      </div>
      <ol className="relative flex flex-col">
        {steps.map((s, i) => {
          const ev = [...events].reverse().find((e) => e.status === s);
          const done = i <= currentIdx;
          const current = i === currentIdx;
          return (
            <li key={s} className="relative flex gap-3 pb-4 last:pb-0">
              {i < steps.length - 1 && <span className={cn('absolute top-4 left-[7px] h-full w-0.5', i < currentIdx ? 'bg-blue' : 'bg-steel-light')} aria-hidden />}
              <span
                className={cn(
                  'relative z-10 mt-1 size-4 shrink-0 rounded-full border-2',
                  current ? 'border-blue bg-amber' : done ? 'border-blue bg-blue' : 'border-steel bg-surface',
                )}
                aria-hidden
              />
              <div className={cn('min-w-0', !done && 'text-ink-mute')}>
                <p className={cn(current && 'font-semibold')}>{ts(s)}</p>
                {ev && (
                  <p className="text-sm text-ink-mute">
                    {dateTime(ev.createdAt)}
                    {ev.location && <span className="ml-2">{ev.location}</span>}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function DisputeDialog({ order, open, onClose }: { order: Order; open: boolean; onClose: () => void }) {
  const t = useTranslations('dispute');
  const [reason, setReason] = useState('NOT_AS_DESCRIBED');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const m = useOpenDispute();
  const router = useRouter();
  return (
    <Dialog open={open} onClose={onClose} title={t('title')}>
      <p className="mb-4 text-ink-soft">{t('lead')}</p>
      <div className="flex flex-col gap-4">
        <Field label={t('reason')}>
          <Select value={reason} onChange={(e) => setReason(e.target.value)}>
            {['NOT_RECEIVED', 'WRONG_ITEM', 'DAMAGED', 'NOT_AS_DESCRIBED', 'COUNTERFEIT', 'OTHER'].map((r) => (
              <option key={r} value={r}>
                {t(`reasons.${r}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('description')}>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
        </Field>
        <PhotoPicker value={photos} onChange={setPhotos} max={10} />
        <Button
          variant="danger"
          loading={m.isPending}
          disabled={description.trim().length < 5}
          onClick={() =>
            m.mutate(
              { orderId: order.id, reason, description, photos },
              {
                onSuccess: (d) => {
                  toast.success(t('opened'));
                  onClose();
                  if (d.chatId) router.push(`/chats/${d.chatId}`);
                },
              },
            )
          }
        >
          {t('open')}
        </Button>
      </div>
    </Dialog>
  );
}

function ReturnDialog({ order, open, onClose }: { order: Order; open: boolean; onClose: () => void }) {
  const t = useTranslations('return');
  const td = useTranslations('dispute');
  const [reason, setReason] = useState('NOT_FIT');
  const [method, setMethod] = useState('DROP_OFF');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const m = useRequestReturn();
  return (
    <Dialog open={open} onClose={onClose} title={t('title')}>
      <p className="mb-4 text-ink-soft">{t('lead')}</p>
      <div className="flex flex-col gap-4">
        <Field label={td('reason')}>
          <Select value={reason} onChange={(e) => setReason(e.target.value)}>
            {['WRONG_ITEM', 'DAMAGED', 'NOT_AS_DESCRIBED', 'NOT_FIT', 'CHANGED_MIND', 'OTHER'].map((r) => (
              <option key={r} value={r}>
                {t(`reasons.${r}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('method')}>
          <Select value={method} onChange={(e) => setMethod(e.target.value)}>
            {['DROP_OFF', 'COURIER'].map((r) => (
              <option key={r} value={r}>
                {t(`methods.${r}`)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={td('description')}>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <PhotoPicker value={photos} onChange={setPhotos} max={10} />
        <Button
          variant="blue"
          loading={m.isPending}
          onClick={() => m.mutate({ orderId: order.id, reason, method, description, photos }, { onSuccess: () => (toast.success(t('done')), onClose()) })}
        >
          {t('submit')}
        </Button>
      </div>
    </Dialog>
  );
}

function ReviewDialog({ order, open, onClose }: { order: Order; open: boolean; onClose: () => void }) {
  const t = useTranslations('review');
  const to = useTranslations('order');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const m = useCreateReview();
  return (
    <Dialog open={open} onClose={onClose} title={t('title')}>
      <div className="flex flex-col gap-4">
        <Field label={t('rating')}>
          <div className="flex gap-1" role="radiogroup" aria-label={t('rating')}>
            {[1, 2, 3, 4, 5].map((i) => (
              <button key={i} type="button" role="radio" aria-checked={rating === i} onClick={() => setRating(i)} aria-label={String(i)}>
                <Star className={cn('size-8', i <= rating ? 'fill-amber text-amber' : 'text-steel')} />
              </button>
            ))}
          </div>
        </Field>
        <Field label={t('text')}>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} />
        </Field>
        <Button variant="primary" loading={m.isPending} onClick={() => m.mutate({ orderId: order.id, rating, text: text || undefined }, { onSuccess: () => (toast.success(to('reviewDone')), onClose()) })}>
          {t('submit')}
        </Button>
      </div>
    </Dialog>
  );
}

function OrderDetail() {
  const t = useTranslations('order');
  const tc = useTranslations('common');
  const ts = useTranslations('status.order');
  const td = useTranslations('dispute');
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const me = useSession((s) => s.user);
  const { data: order, isLoading } = useOrder(id);
  const { data: shipments } = useTracking(order && order.status !== 'PENDING_PAYMENT' ? id : undefined);
  const { data: chats } = useChats();
  const cancel = useCancelOrder();
  const receipt = useConfirmReceipt();
  const { data: dispute } = useDispute(order?.disputeId ?? undefined);
  const [dialog, setDialog] = useState<null | 'dispute' | 'return' | 'review'>(null);

  // продавец, открывший заказ по уведомлению, — в свой кабинет
  useEffect(() => {
    if (order && me && order.clientId !== me.id && order.sellerId === me.seller?.id) router.replace(`/seller/orders/${order.id}`);
  }, [order, me, router]);

  if (isLoading || !order) return <Loading />;
  const chat = chats?.items.find((c) => c.orderId === order.id && c.type === 'REQUEST');
  const s = order.status;
  const canCancel = ['PENDING_PAYMENT', 'PAID', 'CONFIRMED'].includes(s);
  const canDispute = ['PAID', 'CONFIRMED', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'RETURN'].includes(s);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="flex flex-col gap-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[22px] font-semibold sm:text-[26px]">{t('number', { number: order.number })}</h1>
            <OrderStatusBadge status={s} />
          </div>
          <p className="mt-1 text-ink-soft">{t('from', { date: date(order.createdAt) })}</p>
        </div>

        <Panel>
          <p className="text-lg font-semibold">{order.title}</p>
          <p className="mt-1 text-ink-soft">
            {order.quantity > 1 && <span className="mr-3">{tc('pieces', { count: order.quantity })}</span>}
            <span className="num">{money(order.goodsPrice, order.goodsCurrency)}</span>
          </p>
          <p className="mt-3 text-[15px]">
            <span className="text-ink-mute">{t('delivery')}: </span>
            {order.deliveryMethod === 'PICKUP_POINT'
              ? t('pickupAt', { address: [order.deliveryAddress.city, order.deliveryAddress.address].filter(Boolean).join(', ') })
              : t('courierTo', { address: [order.deliveryAddress.city, order.deliveryAddress.address].filter(Boolean).join(', ') })}
          </p>
        </Panel>

        <Panel>
          <h2 className="mb-4 text-[17px] font-semibold">{t('tracking')}</h2>
          <Tracking shipment={shipments?.[0]} />
        </Panel>

        {!!order.history?.length && (
          <Panel>
            <h2 className="mb-3 text-[17px] font-semibold">{t('history')}</h2>
            <ol className="flex flex-col gap-2 text-[15px]">
              {order.history.map((h) => (
                <li key={h.id} className="flex flex-wrap justify-between gap-x-4">
                  <span>{ts(h.toStatus)}</span>
                  <span className="text-ink-mute">{dateTime(h.createdAt)}</span>
                </li>
              ))}
            </ol>
          </Panel>
        )}
      </div>

      <aside className="flex flex-col gap-4">
        <Panel>
          <dl className="flex flex-col gap-2 text-[15px]">
            <div className="flex justify-between">
              <dt className="text-ink-soft">{t('goods')}</dt>
              <dd className="num">{money(order.goodsAmount)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">{t('shipping')}</dt>
              <dd className="num">{money(order.shippingAmount)}</dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-steel-light pt-2">
              <dt className="font-semibold">{t('total')}</dt>
              <dd className="font-display text-[22px] font-semibold num">{money(order.totalAmount)}</dd>
            </div>
            {order.refundedAmount > 0 && (
              <div className="flex justify-between text-ok">
                <dt>{t('refunded')}</dt>
                <dd className="num">{money(order.refundedAmount)}</dd>
              </div>
            )}
          </dl>
        </Panel>

        {s === 'PENDING_PAYMENT' && (
          <Panel className={cn(params.get('pay') && 'border-amber')}>
            <PaymentPanel order={order} />
          </Panel>
        )}

        {s === 'DELIVERED' && (
          <Panel className="flex flex-col gap-3 border-amber">
            <p className="text-ink-soft">{t('confirmReceiptText')}</p>
            <Button variant="primary" size="lg" loading={receipt.isPending} onClick={() => receipt.mutate(order.id, { onSuccess: () => toast.success(t('received')) })}>
              {t('confirmReceipt')}
            </Button>
            <p className="text-sm text-ink-mute">{t('autoComplete')}</p>
          </Panel>
        )}

        <div className="flex flex-col gap-2">
          {chat && (
            <Link href={`/chats/${chat.id}`} className={buttonClass('outline')}>
              <MessageCircle className="size-4" /> {t('chat')}
            </Link>
          )}
          {dispute?.chatId && (
            <Link href={`/chats/${dispute.chatId}`} className={buttonClass('outline')}>
              <MessageCircle className="size-4" /> {td('goChat')}
            </Link>
          )}
          {s === 'COMPLETED' && !order.reviewed && (
            <Button variant="outline" onClick={() => setDialog('review')}>
              <Star className="size-4" /> {t('review')}
            </Button>
          )}
          {s === 'DELIVERED' && (
            <Button variant="outline" onClick={() => setDialog('return')}>
              {t('return')}
            </Button>
          )}
          {canDispute && s !== 'DISPUTE' && (
            <Button variant="ghost" onClick={() => setDialog('dispute')}>
              {t('dispute')}
            </Button>
          )}
          {canCancel && (
            <Button
              variant="ghost"
              loading={cancel.isPending}
              onClick={() => {
                if (!window.confirm(t('cancelConfirm'))) return;
                cancel.mutate({ id: order.id }, { onSuccess: () => toast.success(t('cancelled')) });
              }}
            >
              {t('cancel')}
            </Button>
          )}
        </div>
      </aside>

      <DisputeDialog order={order} open={dialog === 'dispute'} onClose={() => setDialog(null)} />
      <ReturnDialog order={order} open={dialog === 'return'} onClose={() => setDialog(null)} />
      <ReviewDialog order={order} open={dialog === 'review'} onClose={() => setDialog(null)} />
    </div>
  );
}

export default function OrderView() {
  return (
    <AuthGuard>
      <OrderDetail />
    </AuthGuard>
  );
}
