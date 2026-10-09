'use client';

import { Plus, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useDeletePart, useSavePart } from '@/entities/part/api';
import { useCategories } from '@/entities/reference/api';
import { useMyStores } from '@/entities/seller/api';
import { PhotoPicker } from '@/features/upload/photo-picker';
import { useGet } from '@/shared/api/hooks';
import type { Compatibility, Currency, Paginated, Part, PartCondition, PartOrigin } from '@/shared/api/types';
import { Button, Checkbox, Field, Input, Loading, PageHeader, Panel, Segmented, Select, Textarea } from '@/shared/ui';

export default function PartFormView() {
  const t = useTranslations('seller.catalog');
  const to = useTranslations('seller.offer');
  const tc = useTranslations('common');
  const tr = useTranslations('request');
  const tg = useTranslations('garage');
  const locale = useLocale() as 'ru' | 'ky' | 'en';
  const { id } = useParams<{ id?: string }>();
  const isNew = !id || id === 'new';
  const router = useRouter();
  const { data: stores } = useMyStores();
  const { data: categories } = useCategories();
  // часть каталога продавца отдаётся списком — находим нужный товар
  const { data: list } = useGet<Paginated<Part>>(['my-parts', 'all'], isNew ? null : '/seller/parts', { limit: 100 });
  const part = list?.items.find((p) => p.id === id);
  const save = useSavePart();
  const del = useDeletePart();

  const [f, setF] = useState({
    storeId: '',
    name: '',
    description: '',
    categoryId: '',
    oem: '',
    brand: '',
    condition: 'NEW' as PartCondition,
    origin: 'ORIGINAL' as PartOrigin,
    price: '',
    currency: 'KGS' as Currency,
    stock: '1',
    weightKg: '',
    isActive: true,
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [compat, setCompat] = useState<Compatibility[]>([{ make: '', model: '' }]);

  useEffect(() => {
    if (!f.storeId && stores?.length) setF((x) => ({ ...x, storeId: stores[0].id }));
  }, [stores, f.storeId]);

  useEffect(() => {
    if (!part) return;
    setF({
      storeId: part.storeId,
      name: part.name,
      description: part.description ?? '',
      categoryId: part.categoryId ?? '',
      oem: part.oemNumbers.join(', '),
      brand: part.brand ?? '',
      condition: part.condition,
      origin: part.origin,
      price: String(part.price),
      currency: part.currency,
      stock: String(part.stock),
      weightKg: part.weightKg ? String(part.weightKg) : '',
      isActive: part.isActive,
    });
    setPhotos(part.photos);
    setCompat(part.compatibility?.length ? part.compatibility : [{ make: '', model: '' }]);
  }, [part]);

  if (!isNew && !part) return <Loading />;

  const submit = () => {
    const body = {
      ...(isNew ? { storeId: f.storeId } : { isActive: f.isActive }),
      name: f.name,
      description: f.description || undefined,
      categoryId: f.categoryId || undefined,
      oemNumbers: f.oem.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean),
      brand: f.brand || undefined,
      condition: f.condition,
      origin: f.origin,
      price: Number(f.price),
      currency: f.currency,
      stock: Number(f.stock),
      weightKg: f.weightKg ? Number(f.weightKg) : undefined,
      photos,
      compatibility: compat
        .filter((c) => c.make)
        .map((c) => ({ make: c.make, model: c.model || undefined, yearFrom: c.yearFrom ? Number(c.yearFrom) : undefined, yearTo: c.yearTo ? Number(c.yearTo) : undefined })),
    };
    save.mutate(isNew ? body : { id, ...body }, {
      onSuccess: () => {
        toast.success(t('saved'));
        router.push('/seller/catalog');
      },
    });
  };

  return (
    <form
      className="flex max-w-3xl flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <PageHeader title={isNew ? t('add') : t('editTitle')} />
      <Panel className="flex flex-col gap-4">
        {isNew && stores && stores.length > 1 && (
          <Field label={to('store')}>
            <Select value={f.storeId} onChange={(e) => setF({ ...f, storeId: e.target.value })}>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label={t('name')}>
          <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required maxLength={300} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={tr('category')}>
            <Select value={f.categoryId} onChange={(e) => setF({ ...f, categoryId: e.target.value })}>
              <option value="">—</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name[locale] ?? c.name.ru}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={to('brand')}>
            <Input value={f.brand} onChange={(e) => setF({ ...f, brand: e.target.value })} />
          </Field>
        </div>
        <Field label={t('oem')} hint={t('oemHint')}>
          <Input value={f.oem} onChange={(e) => setF({ ...f, oem: e.target.value })} className="code" />
        </Field>
        <div className="flex flex-wrap gap-4">
          <Field label={to('condition')}>
            <Segmented value={f.condition} onChange={(v) => setF({ ...f, condition: v })} options={(['NEW', 'USED'] as const).map((v) => ({ value: v, label: tc(`condition.${v}`) }))} />
          </Field>
          <Field label={to('origin')}>
            <Segmented value={f.origin} onChange={(v) => setF({ ...f, origin: v })} options={(['ORIGINAL', 'ANALOG'] as const).map((v) => ({ value: v, label: tc(`origin.${v}`) }))} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label={t('price')}>
            <Input type="number" min={1} step="0.01" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} required />
          </Field>
          <Field label={to('currency')}>
            <Select value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value as Currency })}>
              {['KGS', 'USD', 'CNY', 'RUB'].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label={t('stock')}>
            <Input type="number" min={0} value={f.stock} onChange={(e) => setF({ ...f, stock: e.target.value })} />
          </Field>
          <Field label={to('weight')}>
            <Input type="number" min={0.1} step="0.1" value={f.weightKg} onChange={(e) => setF({ ...f, weightKg: e.target.value })} />
          </Field>
        </div>
        <Field label={tr('description')}>
          <Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        </Field>
        <PhotoPicker value={photos} onChange={setPhotos} max={10} />
      </Panel>

      <Panel className="flex flex-col gap-3">
        <h2 className="text-[17px] font-semibold">{t('compat')}</h2>
        {compat.map((c, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_80px_80px_auto] items-end gap-2">
            <Field label={i === 0 ? tg('make') : undefined}>
              <Input value={c.make} onChange={(e) => setCompat(compat.map((x, j) => (j === i ? { ...x, make: e.target.value } : x)))} placeholder="Toyota" />
            </Field>
            <Field label={i === 0 ? tg('model') : undefined}>
              <Input value={c.model ?? ''} onChange={(e) => setCompat(compat.map((x, j) => (j === i ? { ...x, model: e.target.value } : x)))} placeholder="Camry" />
            </Field>
            <Field label={i === 0 ? t('yearFrom') : undefined}>
              <Input type="number" value={c.yearFrom ?? ''} onChange={(e) => setCompat(compat.map((x, j) => (j === i ? { ...x, yearFrom: e.target.value ? Number(e.target.value) : null } : x)))} />
            </Field>
            <Field label={i === 0 ? t('yearTo') : undefined}>
              <Input type="number" value={c.yearTo ?? ''} onChange={(e) => setCompat(compat.map((x, j) => (j === i ? { ...x, yearTo: e.target.value ? Number(e.target.value) : null } : x)))} />
            </Field>
            <button type="button" onClick={() => setCompat(compat.filter((_, j) => j !== i))} className="mb-2.5 rounded p-1 text-ink-mute hover:text-danger" aria-label={tc('delete')}>
              <X className="size-4" />
            </button>
          </div>
        ))}
        <Button type="button" variant="ghost" size="sm" className="self-start" onClick={() => setCompat([...compat, { make: compat.at(-1)?.make ?? '', model: '' }])}>
          <Plus className="size-4" /> {t('compatAdd')}
        </Button>
      </Panel>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {!isNew ? <Checkbox label={t('active')} checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} /> : <span />}
        <div className="flex gap-2">
          {!isNew && (
            <Button type="button" variant="ghost" onClick={() => del.mutate(id!, { onSuccess: () => (toast.success(t('deleted')), router.push('/seller/catalog')) })}>
              {tc('delete')}
            </Button>
          )}
          <Button variant="primary" size="lg" loading={save.isPending}>
            {tc('save')}
          </Button>
        </div>
      </div>
    </form>
  );
}
