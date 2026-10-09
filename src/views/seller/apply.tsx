'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useApplySeller } from '@/entities/seller/api';
import { useSession } from '@/entities/session/store';
import { PhotoPicker } from '@/features/upload/photo-picker';
import type { SellerType } from '@/shared/api/types';
import { Button, Field, Input, PageHeader, Panel, Segmented, Select, Textarea } from '@/shared/ui';
import { AuthGuard } from '@/widgets/guard/auth-guard';

const COUNTRIES = ['KG', 'CN', 'KZ', 'RU', 'JP', 'KR', 'AE'];

function Apply() {
  const t = useTranslations('seller.apply');
  const tc = useTranslations('common');
  const router = useRouter();
  const user = useSession((s) => s.user);
  const apply = useApplySeller();
  const [type, setType] = useState<SellerType>('SHOP');
  const [f, setF] = useState({ displayName: '', legalName: '', inn: '' });
  const [docType, setDocType] = useState('PATENT');
  const [docs, setDocs] = useState<string[]>([]);
  const [store, setStore] = useState({ name: '', country: 'KG', city: 'Бишкек', address: '', description: '' });

  useEffect(() => {
    if (user?.seller) router.replace('/seller');
  }, [user, router]);

  return (
    <form
      className="mx-auto flex max-w-2xl flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        apply.mutate(
          {
            type,
            displayName: f.displayName,
            legalName: f.legalName || undefined,
            inn: f.inn || undefined,
            documents: docs.map((url) => ({ type: docType, url })),
            store: { ...store, address: store.address || undefined, description: store.description || undefined },
          },
          {
            onSuccess: () => {
              toast.success(t('sent'));
              router.replace('/seller');
            },
          },
        );
      }}
    >
      <PageHeader title={t('title')} subtitle={t('lead')} />
      <Panel className="flex flex-col gap-4">
        <Field label={t('type')}>
          <Segmented value={type} onChange={setType} options={(['SHOP', 'SCRAPYARD', 'PRIVATE'] as const).map((v) => ({ value: v, label: t(`types.${v}`) }))} />
        </Field>
        <Field label={t('displayName')}>
          <Input value={f.displayName} onChange={(e) => setF({ ...f, displayName: e.target.value })} required maxLength={200} />
        </Field>
        {type !== 'PRIVATE' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('legalName')}>
              <Input value={f.legalName} onChange={(e) => setF({ ...f, legalName: e.target.value })} />
            </Field>
            <Field label={t('inn')}>
              <Input value={f.inn} onChange={(e) => setF({ ...f, inn: e.target.value })} inputMode="numeric" className="code" />
            </Field>
          </div>
        )}
      </Panel>
      <Panel className="flex flex-col gap-4">
        <h2 className="text-[17px] font-semibold">{t('documents')}</h2>
        <p className="-mt-2 text-ink-soft">{t('documentsHint')}</p>
        <Field label={t('docType')}>
          <Select value={docType} onChange={(e) => setDocType(e.target.value)} className="max-w-xs">
            {['IP_CERT', 'LLC_CERT', 'PATENT', 'PASSPORT', 'OTHER'].map((d) => (
              <option key={d} value={d}>
                {t(`docTypes.${d}`)}
              </option>
            ))}
          </Select>
        </Field>
        <PhotoPicker value={docs} onChange={setDocs} max={5} accept="image/*,application/pdf" />
      </Panel>
      <Panel className="flex flex-col gap-4">
        <h2 className="text-[17px] font-semibold">{t('store')}</h2>
        <Field label={t('storeName')}>
          <Input value={store.name} onChange={(e) => setStore({ ...store, name: e.target.value })} required />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('country')}>
            <Select value={store.country} onChange={(e) => setStore({ ...store, country: e.target.value })}>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {tc(`country.${c}`)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('city')}>
            <Input value={store.city} onChange={(e) => setStore({ ...store, city: e.target.value })} required />
          </Field>
        </div>
        <Field label={t('address')}>
          <Input value={store.address} onChange={(e) => setStore({ ...store, address: e.target.value })} />
        </Field>
        <Field label={tc('more')}>
          <Textarea value={store.description} onChange={(e) => setStore({ ...store, description: e.target.value })} />
        </Field>
      </Panel>
      <Button variant="primary" size="lg" className="self-end" loading={apply.isPending} disabled={!f.displayName || !store.name || !docs.length}>
        {t('submit')}
      </Button>
    </form>
  );
}

export default function ApplyView() {
  return (
    <AuthGuard>
      <Apply />
    </AuthGuard>
  );
}
