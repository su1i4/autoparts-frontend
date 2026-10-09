'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { OrderStatusBadge } from '@/entities/order/ui/status';
import { api } from '@/shared/api/http';
import { useGet, useMut } from '@/shared/api/hooks';
import type { LedgerEntry, Order, OrderStatus, Paginated, Payment, Shipment } from '@/shared/api/types';
import { dateTime, money, phone } from '@/shared/lib/format';
import { Badge, Button, DataTable, Dialog, Field, Input, KeyValue, Loading, PageHeader, Panel, Select, Textarea } from '@/shared/ui';
import { LEDGER_OP_LABEL, ORDER_LABEL, PAYMENT_LABEL, SHIPPING_METHOD_LABEL } from './labels';

export default function AdminOrder() {
  const { id } = useParams<{ id: string }>();
  const { data: o, isLoading } = useGet<Order>(['admin-order', id], `/admin/orders/${id}`);
  const { data: payments } = useGet<Paginated<Payment>>(['admin-payments', id], '/admin/payments', { orderId: id });
  const { data: ledger } = useGet<Paginated<LedgerEntry>>(['admin-ledger', id], '/admin/ledger', { orderId: id, limit: 50 });
  const { data: ships } = useGet<Shipment[]>(['tracking', id], `/orders/${id}/tracking`);
  const inv = [['admin-order', id], ['admin-payments', id], ['admin-ledger', id], ['admin-orders']];
  const setStatus = useMut((b: { status: OrderStatus; note?: string }) => api.post(`/admin/orders/${id}/status`, b), { invalidate: inv, success: 'Статус изменён' });
  const refund = useMut((b: { amount: number; reason?: string }) => api.post(`/admin/orders/${id}/refund`, b), { invalidate: inv, success: 'Возврат проведён' });
  const confirmPay = useMut((pid: string) => api.post(`/admin/payments/${pid}/confirm`), { invalidate: inv, success: 'Оплата подтверждена' });
  const [st, setSt] = useState<{ status: OrderStatus | ''; note: string }>({ status: '', note: '' });
  const [rf, setRf] = useState<{ open: boolean; amount: string; reason: string }>({ open: false, amount: '', reason: '' });

  if (isLoading || !o) return <Loading />;
  const a = o.deliveryAddress;

  return (
    <>
      <PageHeader title={<span className="code">{o.number}</span>} subtitle={<OrderStatusBadge status={o.status} />} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <p className="mb-3 text-lg font-semibold">{o.title}</p>
          <KeyValue
            items={[
              ['Цена', `${money(o.goodsPrice, o.goodsCurrency)} × ${o.quantity}`],
              ['Курс', o.goodsCurrency === 'KGS' ? '—' : o.exchangeRate],
              ['Товар', money(o.goodsAmount)],
              ['Доставка', `${money(o.shippingAmount)} (${SHIPPING_METHOD_LABEL[o.shippingMethod] ?? o.shippingMethod})`],
              ['Комиссия', money(o.commissionAmount)],
              ['Продавцу', money(o.sellerPayoutAmount)],
              ['Итого', <b key="t">{money(o.totalAmount)}</b>],
              ['Возвращено', money(o.refundedAmount)],
              ['Получение', o.deliveryMethod === 'COURIER' ? 'Курьер' : 'Пункт выдачи'],
              ['Адрес', [a.city, a.address].filter(Boolean).join(', ')],
              ['Получатель', `${a.recipientName ?? ''} ${phone(a.recipientPhone)}`],
              ['Трек', <span key="tr" className="code">{ships?.[0]?.trackingNumber ?? '—'}</span>],
            ]}
          />
        </Panel>
        <div className="flex flex-col gap-5">
          <Panel className="flex flex-col gap-3">
            <h2 className="font-semibold">Ручная смена статуса</h2>
            <p className="text-sm text-ink-mute">Завершение, отмена и возврат проводят деньги по журналу. Все действия пишутся в аудит.</p>
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <Select value={st.status} onChange={(e) => setSt({ ...st, status: e.target.value as OrderStatus })} aria-label="Статус">
                <option value="">Новый статус</option>
                {Object.entries(ORDER_LABEL)
                  .filter(([k]) => k !== o.status && k !== 'PENDING_PAYMENT' && k !== 'PAID')
                  .map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
              </Select>
              <Button variant="blue" disabled={!st.status} loading={setStatus.isPending} onClick={() => st.status && setStatus.mutate({ status: st.status, note: st.note || undefined })}>
                Применить
              </Button>
            </div>
            <Input placeholder="Комментарий для лога" value={st.note} onChange={(e) => setSt({ ...st, note: e.target.value })} />
            <Button variant="outline" onClick={() => setRf({ open: true, amount: String(o.totalAmount), reason: '' })}>
              Возврат клиенту…
            </Button>
          </Panel>
          <Panel>
            <h2 className="mb-2 font-semibold">Платежи</h2>
            <ul className="flex flex-col gap-2 text-[15px]">
              {payments?.items.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    {p.method} <span className="text-ink-mute">({p.provider})</span> <Badge>{PAYMENT_LABEL[p.status]}</Badge>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="num">{money(p.amount)}</span>
                    {p.status === 'CREATED' && o.status === 'PENDING_PAYMENT' && (
                      <Button size="sm" variant="primary" loading={confirmPay.isPending} onClick={() => confirm('Деньги поступили на счёт платформы?') && confirmPay.mutate(p.id)}>
                        Подтвердить поступление
                      </Button>
                    )}
                  </span>
                </li>
              ))}
              {!payments?.items.length && <li className="text-ink-mute">Платежей нет</li>}
            </ul>
          </Panel>
        </div>
      </div>
      <Panel className="mt-5">
        <h2 className="mb-2 font-semibold">Проводки по заказу</h2>
        <DataTable<LedgerEntry>
          rows={ledger?.items}
          empty="Проводок нет"
          columns={[
            { key: 'd', title: 'Когда', render: (e) => dateTime(e.createdAt) },
            { key: 'o', title: 'Операция', render: (e) => LEDGER_OP_LABEL[e.operation] ?? e.operation },
            { key: 'a', title: 'Счёт', render: (e) => <span className="code text-[13px]">{e.account}</span> },
            { key: 's', title: 'Сумма', className: 'text-right', render: (e) => <span className="num">{money(e.amount)}</span> },
          ]}
        />
      </Panel>
      <Panel className="mt-5">
        <h2 className="mb-2 font-semibold">История статусов</h2>
        <ul className="flex flex-col gap-1.5 text-[15px]">
          {o.history?.map((h) => (
            <li key={h.id} className="flex flex-wrap justify-between gap-x-4">
              <span>
                {h.fromStatus ? `${ORDER_LABEL[h.fromStatus]} → ` : ''}
                {ORDER_LABEL[h.toStatus]} {h.note && <span className="text-ink-mute">— {h.note}</span>}
              </span>
              <span className="text-ink-mute">
                {dateTime(h.createdAt)} {h.actorId ? '' : '(система)'}
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      <Dialog open={rf.open} onClose={() => setRf({ ...rf, open: false })} title="Возврат клиенту">
        <div className="flex flex-col gap-3">
          <p className="text-sm text-ink-soft">Полная сумма — заказ закрывается возвратом. Меньше — заказ завершается, продавец получает остаток за вычетом пропорциональной комиссии.</p>
          <Field label={`Сумма, сом (макс. ${money(o.totalAmount)})`}>
            <Input type="number" min={0.01} max={o.totalAmount} value={rf.amount} onChange={(e) => setRf({ ...rf, amount: e.target.value })} />
          </Field>
          <Field label="Причина">
            <Textarea value={rf.reason} onChange={(e) => setRf({ ...rf, reason: e.target.value })} className="min-h-16" />
          </Field>
          <Button variant="danger" loading={refund.isPending} onClick={() => refund.mutate({ amount: Number(rf.amount), reason: rf.reason || undefined }, { onSuccess: () => setRf({ ...rf, open: false }) })}>
            Провести возврат
          </Button>
        </div>
      </Dialog>
    </>
  );
}
