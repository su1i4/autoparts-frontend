'use client';

import Link from 'next/link';
import { useState } from 'react';
import { api } from '@/shared/api/http';
import { useGet, useMut } from '@/shared/api/hooks';
import type { LedgerEntry, Paginated, Payment, PaymentStatus, Payout, Reconcile } from '@/shared/api/types';
import { dateTime, money } from '@/shared/lib/format';
import { Badge, Button, DataTable, ErrorBox, Input, Note, PageHeader, Pager, Panel, Segmented, Select } from '@/shared/ui';
import { LEDGER_OP_LABEL, PAYMENT_LABEL, PAYOUT_LABEL } from './labels';

export function AdminPayments() {
  const [tab, setTab] = useState<'payments' | 'ledger' | 'reconcile'>('payments');
  const [status, setStatus] = useState<PaymentStatus | ''>('');
  const [account, setAccount] = useState('');
  const [page, setPage] = useState(1);
  const { data: payments, isLoading } = useGet<Paginated<Payment>>(['admin-payments', status, page], tab === 'payments' ? '/admin/payments' : null, { status, page, limit: 30 });
  const { data: ledger, isLoading: ll } = useGet<Paginated<LedgerEntry>>(['admin-ledger', account, page], tab === 'ledger' ? '/admin/ledger' : null, { account, page, limit: 50 });
  const { data: rec, isLoading: rl, refetch } = useGet<Reconcile>(['reconcile'], tab === 'reconcile' ? '/admin/ledger/reconcile' : null);
  const confirmPay = useMut((id: string) => api.post(`/admin/payments/${id}/confirm`), { invalidate: [['admin-payments']], success: 'Оплата подтверждена' });

  return (
    <>
      <PageHeader title="Платежи и сверка" />
      <Segmented
        className="mb-4"
        value={tab}
        onChange={(v) => (setTab(v), setPage(1))}
        options={[
          { value: 'payments', label: 'Платежи' },
          { value: 'ledger', label: 'Журнал проводок' },
          { value: 'reconcile', label: 'Сверка' },
        ]}
      />
      {tab === 'payments' && (
        <Panel>
          <Select value={status} onChange={(e) => setStatus(e.target.value as PaymentStatus)} className="mb-3 max-w-xs" aria-label="Статус">
            <option value="">Все статусы</option>
            {Object.entries(PAYMENT_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
          <DataTable<Payment>
            loading={isLoading}
            rows={payments?.items}
            columns={[
              { key: 'd', title: 'Создан', render: (p) => dateTime(p.createdAt) },
              {
                key: 'o',
                title: 'Заказ',
                render: (p) => (
                  <Link href={`/admin/orders/${p.orderId}`} className="text-blue hover:underline">
                    открыть
                  </Link>
                ),
              },
              { key: 'm', title: 'Метод', render: (p) => `${p.method} (${p.provider})` },
              { key: 'a', title: 'Сумма', render: (p) => <span className="num">{money(p.amount)}</span> },
              { key: 'r', title: 'Возвращено', render: (p) => (p.refundedAmount ? money(p.refundedAmount) : '—') },
              { key: 's', title: 'Статус', render: (p) => <Badge tone={p.status === 'HOLD' ? 'amber' : p.status === 'FAILED' ? 'danger' : 'neutral'}>{PAYMENT_LABEL[p.status]}</Badge> },
              {
                key: 'x',
                title: '',
                render: (p) =>
                  p.status === 'CREATED' &&
                  p.provider === 'manual' && (
                    <Button size="sm" variant="primary" onClick={() => confirm('Деньги поступили?') && confirmPay.mutate(p.id)}>
                      Подтвердить
                    </Button>
                  ),
              },
            ]}
          />
          {payments && <Pager page={page} total={payments.total} limit={payments.limit} onPage={setPage} />}
        </Panel>
      )}
      {tab === 'ledger' && (
        <Panel>
          <Input placeholder="Счёт: ESCROW, PLATFORM:COMMISSION, SELLER:<id>:AVAILABLE" value={account} onChange={(e) => setAccount(e.target.value.trim())} className="code mb-3 max-w-lg" />
          <DataTable<LedgerEntry>
            loading={ll}
            rows={ledger?.items}
            columns={[
              { key: 'd', title: 'Когда', render: (e) => dateTime(e.createdAt) },
              { key: 'op', title: 'Операция', render: (e) => LEDGER_OP_LABEL[e.operation] ?? e.operation },
              { key: 'acc', title: 'Счёт', render: (e) => <span className="code text-[13px]">{e.account}</span> },
              { key: 'desc', title: 'Описание', render: (e) => <span className="text-ink-soft">{e.description}</span> },
              { key: 'a', title: 'Сумма', className: 'text-right', render: (e) => <span className="num">{money(e.amount)}</span> },
            ]}
          />
          {ledger && <Pager page={page} total={ledger.total} limit={ledger.limit} onPage={setPage} />}
        </Panel>
      )}
      {tab === 'reconcile' && (
        <Panel className="flex flex-col gap-3">
          {rl || !rec ? null : rec.ok ? (
            <Note>Журнал сбалансирован: сумма по всем счетам 0, несбалансированных проводок и расхождений балансов продавцов нет.</Note>
          ) : (
            <ErrorBox>
              Найдены расхождения: несбалансированных проводок {rec.unbalancedTx.length}, расхождений балансов продавцов {rec.sellerMismatch.length}, итог {rec.total}.
            </ErrorBox>
          )}
          <DataTable<{ id: string; account: string; balance: number }>
            loading={rl}
            rows={rec?.balances.map((b) => ({ ...b, id: b.account }))}
            columns={[
              { key: 'a', title: 'Счёт', render: (b) => <span className="code text-[13px]">{b.account}</span> },
              { key: 'b', title: 'Сальдо', className: 'text-right', render: (b) => <span className="num">{money(b.balance)}</span> },
            ]}
          />
          <Button variant="outline" size="sm" className="self-start" onClick={() => refetch()}>
            Пересчитать
          </Button>
        </Panel>
      )}
    </>
  );
}

export function AdminPayouts() {
  const [status, setStatus] = useState<'REQUESTED' | 'PAID' | 'REJECTED' | ''>('REQUESTED');
  const { data, isLoading } = useGet<Paginated<Payout>>(['admin-payouts', status], '/admin/payouts', { status, limit: 50 });
  const process = useMut(({ id, ...b }: { id: string; decision: 'PAID' | 'REJECTED'; bankReference?: string; comment?: string }) => api.post(`/admin/payouts/${id}/process`, b), {
    invalidate: [['admin-payouts'], ['admin-stats']],
    success: 'Выплата обработана',
  });
  return (
    <>
      <PageHeader title="Выплаты продавцам" />
      <Segmented
        className="mb-4"
        value={status}
        onChange={setStatus}
        options={[
          { value: 'REQUESTED', label: 'В очереди' },
          { value: 'PAID', label: 'Выплачены' },
          { value: 'REJECTED', label: 'Отклонены' },
          { value: '', label: 'Все' },
        ]}
      />
      <Panel>
        <DataTable<Payout>
          loading={isLoading}
          rows={data?.items}
          empty="Заявок нет"
          columns={[
            { key: 'd', title: 'Заявка', render: (p) => dateTime(p.createdAt) },
            { key: 'a', title: 'Сумма', render: (p) => <span className="num font-medium">{money(p.amount)}</span> },
            { key: 'r', title: 'Реквизиты', render: (p) => `${p.details.bankName ?? ''} ${p.details.accountNumber ?? ''} ${p.details.recipientName ?? ''}` },
            { key: 's', title: 'Статус', render: (p) => <Badge tone={p.status === 'PAID' ? 'ok' : p.status === 'REJECTED' ? 'danger' : 'amber'}>{PAYOUT_LABEL[p.status] ?? p.status}</Badge> },
            {
              key: 'x',
              title: '',
              render: (p) =>
                p.status === 'REQUESTED' && (
                  <span className="flex gap-1">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        const ref = prompt('Номер платёжного поручения');
                        if (ref !== null) process.mutate({ id: p.id, decision: 'PAID', bankReference: ref || undefined });
                      }}
                    >
                      Выплачено
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const c = prompt('Причина отказа');
                        if (c) process.mutate({ id: p.id, decision: 'REJECTED', comment: c });
                      }}
                    >
                      Отклонить
                    </Button>
                  </span>
                ),
            },
          ]}
        />
      </Panel>
    </>
  );
}
