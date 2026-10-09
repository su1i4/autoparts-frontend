'use client';

import { MessageCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { useChats } from '@/entities/chat/api';
import { useSellerConfirm, useSellerDecline, useSellerOrder, useSellerShip, useTracking } from '@/entities/order/api';
import { OrderStatusBadge } from '@/entities/order/ui/status';
import { dateTime, money } from '@/shared/lib/format';
import { Button, buttonClass, Dialog, Field, Input, KeyValue, Loading, Note, PageHeader, Panel, Textarea } from '@/shared/ui';

export default function SellerOrderView() {
  const t = useTranslations('seller.orders');
  const to = useTranslations('order');
  const tsh = useTranslations('status.shipment');
  const tm = useTranslations('status.shipping');
  const tt = useTranslations('seller.table');
  const { id } = useParams<{ id: string }>();
  const { data: o, isLoading } = useSellerOrder(id);
  const { data: shipments } = useTracking(o && o.status !== 'PENDING_PAYMENT' ? id : undefined);
  const { data: chats } = useChats();
  const confirm = useSellerConfirm();
  const ship = useSellerShip();
  const decline = useSellerDecline();
  const [dialog, setDialog] = useState<'ship' | 'decline' | null>(null);
  const [shipForm, setShipForm] = useState({ carrier: '', externalTrackingNumber: '', note: '' });
  const [reason, setReason] = useState('');

  if (isLoading || !o) return <Loading />;
  const chat = chats?.items.find((c) => c.orderId === o.id && c.type === 'REQUEST');
  const sh = shipments?.[0];

  return (
    <>
      <PageHeader title={to('number', { number: o.number })} subtitle={<OrderStatusBadge status={o.status} />} />
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-5">
          <Panel>
            <p className="text-lg font-semibold">{o.title}</p>
            <KeyValue
              className="mt-3"
              items={[
                [tt('price'), money(o.goodsPrice, o.goodsCurrency)],
                [tt('qty'), o.quantity],
                [to('goods'), money(o.goodsAmount)],
                [t('commission'), `−${money(o.commissionAmount)}`],
                [t('payout'), <b key="p">{money(o.sellerPayoutAmount)}</b>],
                [tt('shipping'), tm(o.shippingMethod)],
                [t('buyerCity'), o.deliveryAddress.city],
              ]}
            />
          </Panel>
          <Note>{t('privacy')}</Note>
          {sh && (
            <Panel>
              <h2 className="mb-2 font-semibold">{to('tracking')}</h2>
              <p className="code mb-3">{sh.trackingNumber}</p>
              <ol className="flex flex-col gap-1.5 text-[15px]">
                {sh.events?.map((e) => (
                  <li key={e.id} className="flex flex-wrap justify-between gap-x-4">
                    <span>{tsh(e.status)}</span>
                    <span className="text-ink-mute">
                      {dateTime(e.createdAt)} {e.location}
                    </span>
                  </li>
                ))}
              </ol>
            </Panel>
          )}
        </div>
        <aside className="flex flex-col gap-2">
          {o.status === 'PAID' && (
            <Button variant="primary" size="lg" loading={confirm.isPending} onClick={() => confirm.mutate(o.id, { onSuccess: () => toast.success(t('confirmed')) })}>
              {t('confirm')}
            </Button>
          )}
          {(o.status === 'PAID' || o.status === 'CONFIRMED') && (
            <>
              <Button variant={o.status === 'CONFIRMED' ? 'primary' : 'blue'} size="lg" onClick={() => setDialog('ship')}>
                {t('ship')}
              </Button>
              <Button variant="ghost" onClick={() => setDialog('decline')}>
                {t('decline')}
              </Button>
            </>
          )}
          {chat && (
            <Link href={`/seller/chats/${chat.id}`} className={buttonClass('outline')}>
              <MessageCircle className="size-4" /> {t('chat')}
            </Link>
          )}
        </aside>
      </div>

      <Dialog open={dialog === 'ship'} onClose={() => setDialog(null)} title={t('shipTitle')}>
        <div className="flex flex-col gap-3">
          <Field label={t('carrier')}>
            <Input value={shipForm.carrier} onChange={(e) => setShipForm({ ...shipForm, carrier: e.target.value })} />
          </Field>
          <Field label={t('externalTracking')}>
            <Input value={shipForm.externalTrackingNumber} onChange={(e) => setShipForm({ ...shipForm, externalTrackingNumber: e.target.value })} className="code" />
          </Field>
          <Field label={t('note')}>
            <Textarea value={shipForm.note} onChange={(e) => setShipForm({ ...shipForm, note: e.target.value })} />
          </Field>
          <Button
            variant="primary"
            loading={ship.isPending}
            onClick={() =>
              ship.mutate(
                { id: o.id, carrier: shipForm.carrier || undefined, externalTrackingNumber: shipForm.externalTrackingNumber || undefined, note: shipForm.note || undefined },
                { onSuccess: () => (toast.success(t('shipped')), setDialog(null)) },
              )
            }
          >
            {t('ship')}
          </Button>
        </div>
      </Dialog>
      <Dialog open={dialog === 'decline'} onClose={() => setDialog(null)} title={t('decline')}>
        <p className="mb-3 text-ink-soft">{t('declineText')}</p>
        <Field label={to('cancelReason')}>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
        <Button
          variant="danger"
          className="mt-3"
          loading={decline.isPending}
          disabled={reason.trim().length < 3}
          onClick={() => decline.mutate({ id: o.id, reason }, { onSuccess: () => (toast.success(t('declined')), setDialog(null)) })}
        >
          {t('decline')}
        </Button>
      </Dialog>
    </>
  );
}
