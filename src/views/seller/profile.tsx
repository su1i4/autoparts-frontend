'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAddSellerDoc, useMySeller, useSaveStore, useUpdateSeller } from '@/entities/seller/api';
import { PhotoPicker } from '@/features/upload/photo-picker';
import type { PayoutDetails, Store } from '@/shared/api/types';
import { Badge, Button, Dialog, Field, Input, Loading, PageHeader, Panel, Segmented, Select, Textarea } from '@/shared/ui';

function StoreDialog({ store, open, onClose }: { store?: Store; open: boolean; onClose: () => void }) {
  const t = useTranslations('seller.apply');
  const tc = useTranslations('common');
  const save = useSaveStore();
  const [f, setF] = useState({ name: '', country: 'KG', city: 'Бишкек', address: '', description: '' });
  useEffect(() => {
    if (store) setF({ name: store.name, country: store.country, city: store.city, address: store.address ?? '', description: store.description ?? '' });
  }, [store]);
  return (
    <Dialog open={open} onClose={onClose} title={store ? store.name : t('store')}>
      <div className="flex flex-col gap-3">
        <Field label={t('storeName')}>
          <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('country')}>
            <Select value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })}>
              {['KG', 'CN', 'KZ', 'RU', 'JP', 'KR', 'AE'].map((c) => (
                <option key={c} value={c}>
                  {tc(`country.${c}`)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('city')}>
            <Input value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} />
          </Field>
        </div>
        <Field label={t('address')}>
          <Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
        </Field>
        <Field label={tc('more')}>
          <Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        </Field>
        <Button
          variant="blue"
          loading={save.isPending}
          disabled={!f.name || !f.city}
          onClick={() => save.mutate({ ...(store ? { id: store.id } : {}), ...f, address: f.address || undefined, description: f.description || undefined }, { onSuccess: () => (toast.success(tc('saved')), onClose()) })}
        >
          {tc('save')}
        </Button>
      </div>
    </Dialog>
  );
}

export default function SellerProfileView() {
  const t = useTranslations('seller.profile');
  const ta = useTranslations('seller.apply');
  const tv = useTranslations('status.verification');
  const tc = useTranslations('common');
  const { data: s, isLoading } = useMySeller();
  const update = useUpdateSeller();
  const addDoc = useAddSellerDoc();
  const [payout, setPayout] = useState<PayoutDetails>({ method: 'BANK' });
  const [storeDialog, setStoreDialog] = useState<{ store?: Store } | null>(null);
  const [docType, setDocType] = useState('PATENT');

  useEffect(() => {
    if (s?.payoutDetails) setPayout(s.payoutDetails);
  }, [s]);

  if (isLoading || !s) return <Loading />;
  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <PageHeader
        title={t('title')}
        actions={
          <Link href={`/sellers/${s.id}`} className="text-blue hover:underline">
            {t('public')}
          </Link>
        }
      />
      <Panel>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold">{s.displayName}</h2>
          <Badge tone={s.verificationStatus === 'VERIFIED' ? 'ok' : s.verificationStatus === 'REJECTED' ? 'danger' : 'amber'}>{tv(s.verificationStatus)}</Badge>
        </div>
        <p className="text-ink-soft">
          {ta(`types.${s.type}`)}
          {s.legalName && <span className="ml-2">{s.legalName}</span>}
          {s.inn && <span className="code ml-2">{s.inn}</span>}
        </p>
      </Panel>

      <Panel className="flex flex-col gap-4">
        <h2 className="text-[17px] font-semibold">{t('payout')}</h2>
        <Field label={t('method')}>
          <Segmented
            value={payout.method}
            onChange={(v) => setPayout({ ...payout, method: v })}
            options={[
              { value: 'BANK', label: t('bank') },
              { value: 'WALLET', label: t('wallet') },
            ]}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('bankName')}>
            <Input value={payout.bankName ?? ''} onChange={(e) => setPayout({ ...payout, bankName: e.target.value })} />
          </Field>
          <Field label={t('account')}>
            <Input value={payout.accountNumber ?? ''} onChange={(e) => setPayout({ ...payout, accountNumber: e.target.value })} className="code" />
          </Field>
          <Field label={t('recipient')}>
            <Input value={payout.recipientName ?? ''} onChange={(e) => setPayout({ ...payout, recipientName: e.target.value })} />
          </Field>
          <Field label="БИК">
            <Input value={payout.bik ?? ''} onChange={(e) => setPayout({ ...payout, bik: e.target.value })} className="code" />
          </Field>
        </div>
        <Button variant="blue" className="self-end" loading={update.isPending} disabled={!payout.accountNumber} onClick={() => update.mutate({ payoutDetails: payout }, { onSuccess: () => toast.success(tc('saved')) })}>
          {tc('save')}
        </Button>
      </Panel>

      <Panel>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[17px] font-semibold">{t('stores')}</h2>
          <Button variant="outline" size="sm" onClick={() => setStoreDialog({})}>
            {t('addStore')}
          </Button>
        </div>
        <ul className="divide-y divide-steel-light">
          {s.stores?.map((st) => (
            <li key={st.id} className="flex items-center justify-between gap-3 py-2.5">
              <span>
                <span className="font-medium">{st.name}</span>
                <span className="ml-2 text-ink-soft">
                  {st.city}, {tc(`country.${st.country}`)}
                </span>
              </span>
              <Button variant="ghost" size="sm" onClick={() => setStoreDialog({ store: st })}>
                {tc('edit')}
              </Button>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel className="flex flex-col gap-3">
        <h2 className="text-[17px] font-semibold">{t('documents')}</h2>
        <ul className="flex flex-col gap-1">
          {s.documents?.map((d) => (
            <li key={d.id}>
              <a href={d.url} target="_blank" rel="noreferrer" className="text-blue hover:underline">
                {ta(`docTypes.${d.type}`)}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-end gap-3">
          <Field label={ta('docType')}>
            <Select value={docType} onChange={(e) => setDocType(e.target.value)}>
              {['IP_CERT', 'LLC_CERT', 'PATENT', 'PASSPORT', 'OTHER'].map((d) => (
                <option key={d} value={d}>
                  {ta(`docTypes.${d}`)}
                </option>
              ))}
            </Select>
          </Field>
          <PhotoPicker value={[]} onChange={(urls) => urls.forEach((url) => addDoc.mutate({ type: docType, url }, { onSuccess: () => toast.success(tc('saved')) }))} max={1} accept="image/*,application/pdf" />
        </div>
      </Panel>
      <StoreDialog open={!!storeDialog} store={storeDialog?.store} onClose={() => setStoreDialog(null)} />
    </div>
  );
}
