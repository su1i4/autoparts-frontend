'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useMyParts } from '@/entities/part/api';
import { useCreateOffer, useUpdateOffer, useWithdrawOffer } from '@/entities/request/api';
import { useMyStores } from '@/entities/seller/api';
import { PhotoPicker } from '@/features/upload/photo-picker';
import type { Currency, Offer, PartCondition, PartOrigin } from '@/shared/api/types';
import { Button, Field, Input, Note, Segmented, Select, Textarea } from '@/shared/ui';

/** Предложение цены: цена, состояние, срок, гарантия, фото (до 5), комментарий */
export function OfferForm({ requestId, existing, defaultTitle }: { requestId: string; existing?: Offer | null; defaultTitle: string }) {
  const t = useTranslations('seller.offer');
  const tc = useTranslations('common');
  const { data: stores } = useMyStores();
  const { data: parts } = useMyParts();
  const create = useCreateOffer(requestId);
  const update = useUpdateOffer();
  const withdraw = useWithdrawOffer();
  const editable = !existing || existing.status === 'SENT' || existing.status === 'VIEWED';

  const [f, setF] = useState({
    storeId: existing?.storeId ?? '',
    partId: existing?.partId ?? '',
    price: existing ? String(existing.price) : '',
    currency: (existing?.currency ?? 'KGS') as Currency,
    condition: (existing?.condition ?? 'NEW') as PartCondition,
    origin: (existing?.origin ?? 'ORIGINAL') as PartOrigin,
    brand: existing?.brand ?? '',
    deliveryDays: existing ? String(existing.deliveryDays) : '1',
    warrantyDays: existing ? String(existing.warrantyDays) : '14',
    weightKg: existing?.weightKg ? String(existing.weightKg) : '',
    comment: existing?.comment ?? '',
  });
  const [photos, setPhotos] = useState<string[]>(existing?.photos ?? []);

  useEffect(() => {
    if (!f.storeId && stores?.length) setF((x) => ({ ...x, storeId: stores[0].id, currency: stores[0].country === 'CN' ? 'CNY' : x.currency }));
  }, [stores, f.storeId]);

  const store = stores?.find((s) => s.id === f.storeId);
  const pickPart = (id: string) => {
    const p = parts?.items.find((x) => x.id === id);
    setF((x) => ({
      ...x,
      partId: id,
      ...(p ? { price: String(p.price), currency: p.currency, condition: p.condition, origin: p.origin, brand: p.brand ?? '', weightKg: p.weightKg ? String(p.weightKg) : '' } : {}),
    }));
    if (p?.photos.length && !photos.length) setPhotos(p.photos.slice(0, 5));
  };

  const body = {
    price: Number(f.price),
    currency: f.currency,
    condition: f.condition,
    origin: f.origin,
    brand: f.brand || undefined,
    deliveryDays: Number(f.deliveryDays),
    warrantyDays: Number(f.warrantyDays || 0),
    weightKg: f.weightKg ? Number(f.weightKg) : undefined,
    comment: f.comment || undefined,
    photos,
  };

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (existing) update.mutate({ id: existing.id, ...body }, { onSuccess: () => toast.success(t('updated')) });
        else create.mutate({ ...body, storeId: f.storeId, partId: f.partId || undefined, title: defaultTitle }, { onSuccess: () => toast.success(t('sent')) });
      }}
    >
      {!existing && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('store')}>
            <Select value={f.storeId} onChange={(e) => setF({ ...f, storeId: e.target.value })}>
              {stores?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.city})
                </option>
              ))}
            </Select>
          </Field>
          {!!parts?.items.length && (
            <Field label={t('fromCatalog')}>
              <Select value={f.partId} onChange={(e) => pickPart(e.target.value)}>
                <option value="">—</option>
                {parts.items.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
          )}
        </div>
      )}
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <Field label={t('price')}>
          <Input type="number" inputMode="decimal" min={1} step="0.01" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} required disabled={!editable} className="font-display text-lg" />
        </Field>
        <Field label={t('currency')}>
          <Select value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value as Currency })} disabled={!editable}>
            {['KGS', 'USD', 'CNY', 'RUB'].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="flex flex-wrap gap-4">
        <Field label={t('condition')}>
          <Segmented value={f.condition} onChange={(v) => setF({ ...f, condition: v })} options={(['NEW', 'USED'] as const).map((v) => ({ value: v, label: tc(`condition.${v}`) }))} />
        </Field>
        <Field label={t('origin')}>
          <Segmented value={f.origin} onChange={(v) => setF({ ...f, origin: v })} options={(['ORIGINAL', 'ANALOG'] as const).map((v) => ({ value: v, label: tc(`origin.${v}`) }))} />
        </Field>
      </div>
      <div className="grid grid-cols-2 items-end gap-3 sm:grid-cols-4">
        <Field label={t('brand')} className="col-span-2 sm:col-span-1">
          <Input value={f.brand} onChange={(e) => setF({ ...f, brand: e.target.value })} disabled={!editable} />
        </Field>
        <Field label={t('deliveryDays')}>
          <Input type="number" min={0} max={180} value={f.deliveryDays} onChange={(e) => setF({ ...f, deliveryDays: e.target.value })} required disabled={!editable} />
        </Field>
        <Field label={t('warrantyDays')}>
          <Input type="number" min={0} value={f.warrantyDays} onChange={(e) => setF({ ...f, warrantyDays: e.target.value })} disabled={!editable} />
        </Field>
        {store?.country !== 'KG' && (
          <Field label={t('weight')}>
            <Input type="number" min={0.1} step="0.1" value={f.weightKg} onChange={(e) => setF({ ...f, weightKg: e.target.value })} disabled={!editable} />
          </Field>
        )}
      </div>
      <Field label={t('comment')}>
        <Textarea value={f.comment} onChange={(e) => setF({ ...f, comment: e.target.value })} disabled={!editable} maxLength={2000} />
      </Field>
      <PhotoPicker value={photos} onChange={setPhotos} max={5} />
      <Note tone="amber">{t('contactWarning')}</Note>
      {editable && (
        <div className="flex flex-wrap justify-end gap-2">
          {existing && (
            <Button type="button" variant="ghost" loading={withdraw.isPending} onClick={() => withdraw.mutate(existing.id, { onSuccess: () => toast.success(t('withdrawn')) })}>
              {t('withdraw')}
            </Button>
          )}
          <Button variant="primary" size="lg" loading={create.isPending || update.isPending} disabled={!f.price || !f.storeId}>
            {existing ? t('update') : t('send')}
          </Button>
        </div>
      )}
    </form>
  );
}
