'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { useBalance, useBalanceHistory, usePayouts, useRequestPayout } from '@/entities/seller/api';
import type { LedgerEntry, Payout } from '@/shared/api/types';
import { cn } from '@/shared/lib/cn';
import { dateTime, money } from '@/shared/lib/format';
import { Badge, Button, DataTable, Dialog, Field, Input, Loading, Note, PageHeader, Pager, Panel, Segmented } from '@/shared/ui';

export default function BalanceView() {
  const t = useTranslations('seller.balance');
  const tt = useTranslations('seller.table');
  const [tab, setTab] = useState<'history' | 'payouts'>('history');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const { data: b, isLoading } = useBalance();
  const { data: history, isLoading: hl } = useBalanceHistory(page);
  const { data: payouts, isLoading: pl } = usePayouts();
  const request = useRequestPayout();

  if (isLoading || !b) return <Loading />;
  return (
    <>
      <PageHeader
        title={t('title')}
        actions={
          <Button variant="primary" disabled={b.available < b.minPayout} onClick={() => (setAmount(String(b.available)), setOpen(true))}>
            {t('withdraw')}
          </Button>
        }
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-ink p-5 text-white">
          <p className="text-sm text-white/70">{t('available')}</p>
          <p className="mt-1 font-display text-[28px] font-semibold num">{money(b.available)}</p>
        </div>
        <Panel>
          <p className="text-sm text-ink-mute">{t('hold')}</p>
          <p className="mt-1 font-display text-[22px] font-semibold num">{money(b.hold)}</p>
        </Panel>
        <Panel>
          <p className="text-sm text-ink-mute">{t('pending')}</p>
          <p className="mt-1 font-display text-[22px] font-semibold num">{money(b.payoutPending)}</p>
        </Panel>
      </div>
      <p className="mt-3 text-sm text-ink-mute">{t('hint')}</p>

      <Segmented
        className="mt-6 mb-3"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'history', label: t('history') },
          { value: 'payouts', label: t('payouts') },
        ]}
      />
      <Panel>
        {tab === 'history' ? (
          <>
            <DataTable<LedgerEntry>
              loading={hl}
              rows={history?.items}
              columns={[
                { key: 'd', title: tt('date'), render: (e) => <span className="text-ink-mute">{dateTime(e.createdAt)}</span> },
                { key: 'o', title: tt('operation'), render: (e) => (t.has(`ops.${e.operation}`) ? t(`ops.${e.operation}`) : e.operation) },
                { key: 'desc', title: tt('description'), render: (e) => <span className="text-ink-soft">{e.description}</span> },
                {
                  key: 'a',
                  title: tt('amount'),
                  className: 'text-right',
                  render: (e) => <span className={cn('num font-medium', e.amount > 0 ? 'text-ok' : 'text-ink')}>{(e.amount > 0 ? '+' : '') + money(e.amount)}</span>,
                },
              ]}
            />
            {history && <Pager page={page} total={history.total} limit={history.limit} onPage={setPage} />}
          </>
        ) : (
          <DataTable<Payout>
            loading={pl}
            rows={payouts?.items}
            columns={[
              { key: 'd', title: tt('date'), render: (p) => <span className="text-ink-mute">{dateTime(p.createdAt)}</span> },
              { key: 'a', title: tt('amount'), render: (p) => <span className="num font-medium">{money(p.amount)}</span> },
              { key: 'to', title: tt('to'), render: (p) => `${p.details.bankName ?? ''} ${p.details.accountNumber ?? ''}` },
              {
                key: 's',
                title: tt('status'),
                render: (p) => <Badge tone={p.status === 'PAID' ? 'ok' : p.status === 'REJECTED' ? 'danger' : 'amber'}>{t(`payoutStatus.${p.status}`)}</Badge>,
              },
            ]}
          />
        )}
      </Panel>

      <Dialog open={open} onClose={() => setOpen(false)} title={t('withdrawTitle')}>
        {!b.payoutDetails ? (
          <Note tone="amber">
            {t('noDetails')}.{' '}
            <Link href="/seller/profile" className="underline">
              →
            </Link>
          </Note>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-ink-soft">
              {b.payoutDetails.bankName} <span className="code">{b.payoutDetails.accountNumber}</span>
            </p>
            <Field label={t('amount')} hint={t('min', { amount: money(b.minPayout) })}>
              <Input type="number" min={b.minPayout} max={b.available} value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Field>
            <Button
              variant="primary"
              loading={request.isPending}
              disabled={Number(amount) < b.minPayout || Number(amount) > b.available}
              onClick={() => request.mutate(Number(amount), { onSuccess: () => (toast.success(t('requested')), setOpen(false)) })}
            >
              {t('withdraw')}
            </Button>
          </div>
        )}
      </Dialog>
    </>
  );
}
