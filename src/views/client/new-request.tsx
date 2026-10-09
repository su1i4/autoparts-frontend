'use client';

import { Check } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useCategories } from '@/entities/reference/api';
import { useCreateRequest } from '@/entities/request/api';
import { carTitle, useAddVehicle, useGarage } from '@/entities/vehicle/api';
import { PhotoPicker } from '@/features/upload/photo-picker';
import { CarFields } from '@/features/vehicle/add-vehicle';
import { VinInput } from '@/features/vehicle/vin-input';
import type { ConditionPreference, VinDecode } from '@/shared/api/types';
import { cn } from '@/shared/lib/cn';
import { Button, Checkbox, Field, Input, Loading, Panel, Segmented, Select, Textarea } from '@/shared/ui';
import { AuthGuard } from '@/widgets/guard/auth-guard';

const ORIGINS = ['ANY', 'CN', 'JP', 'KR', 'KG', 'AE', 'DE', 'US'];

function NewRequest() {
  const t = useTranslations('request');
  const tg = useTranslations('garage');
  const tc = useTranslations('common');
  const locale = useLocale() as 'ru' | 'ky' | 'en';
  const router = useRouter();
  const params = useSearchParams();
  const { data: garage, isLoading } = useGarage();
  const { data: categories } = useCategories();
  const create = useCreateRequest();
  const addVehicle = useAddVehicle();

  const [mode, setMode] = useState<'garage' | 'manual'>('garage');
  const [vehicleId, setVehicleId] = useState<string>(params.get('vehicleId') ?? '');
  const [vin, setVin] = useState(params.get('vin') ?? '');
  const [car, setCar] = useState({ make: '', model: '', year: '' });
  const [saveToGarage, setSaveToGarage] = useState(true);
  const [f, setF] = useState({
    title: '',
    description: '',
    oemNumber: '',
    categoryId: '',
    condition: 'ANY' as ConditionPreference,
    originCountry: 'ANY',
    budget: '',
  });
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (isLoading) return;
    if (params.get('vin') || !garage?.length) setMode('manual');
    else if (!vehicleId) setVehicleId(garage[0].id);
  }, [isLoading, garage, params, vehicleId]);

  const onDecoded = (d: VinDecode | null) => {
    if (d) setCar({ make: d.make ?? '', model: d.model ?? '', year: d.year ? String(d.year) : '' });
  };

  const submit = async (publish: boolean) => {
    let carPart: Record<string, unknown> = {};
    if (mode === 'garage' && vehicleId) carPart = { vehicleId };
    else {
      carPart = { vin: vin.length === 17 ? vin : undefined, make: car.make, model: car.model || undefined, year: car.year ? Number(car.year) : undefined };
      if (saveToGarage && car.make && car.model) {
        try {
          const v = await addVehicle.mutateAsync({ vin: vin.length === 17 ? vin : undefined, make: car.make, model: car.model, year: car.year ? Number(car.year) : undefined } as never);
          carPart = { vehicleId: v.id };
        } catch {
          /* не критично — запрос создадим с ручными данными */
        }
      }
    }
    create.mutate(
      {
        ...carPart,
        title: f.title,
        description: f.description || undefined,
        oemNumber: f.oemNumber || undefined,
        categoryId: f.categoryId || undefined,
        condition: f.condition,
        originCountry: f.originCountry,
        budget: f.budget ? Number(f.budget) : undefined,
        photos,
        publish,
      },
      {
        onSuccess: (r) => {
          if (publish) toast.success(t('published'));
          router.push(`/requests/${r.id}`);
        },
      },
    );
  };

  const carReady = mode === 'garage' ? !!vehicleId : !!car.make;

  return (
    <form
      className="mx-auto flex max-w-2xl flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        void submit(true);
      }}
    >
      <div>
        <h1 className="text-[24px] font-semibold sm:text-[28px]">{t('newTitle')}</h1>
        <p className="mt-1 text-ink-soft">{t('newLead')}</p>
      </div>

      <Panel>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[17px] font-semibold">{t('car')}</h2>
          {!!garage?.length && (
            <Segmented
              value={mode}
              onChange={setMode}
              options={[
                { value: 'garage', label: t('fromGarage') },
                { value: 'manual', label: t('manualCar') },
              ]}
            />
          )}
        </div>
        {isLoading ? (
          <Loading />
        ) : mode === 'garage' && garage?.length ? (
          <ul className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label={tg('pick')}>
            {garage.map((v) => (
              <li key={v.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={vehicleId === v.id}
                  onClick={() => setVehicleId(v.id)}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left',
                    vehicleId === v.id ? 'border-blue bg-blue-tint' : 'border-steel hover:border-ink-mute',
                  )}
                >
                  <span>
                    <span className="block font-medium">{v.nickname || carTitle(v)}</span>
                    <span className="code block text-[13px] text-ink-mute">{v.vin ?? v.frameNumber ?? tg('noVin')}</span>
                  </span>
                  {vehicleId === v.id && <Check className="size-4 text-blue" />}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col gap-3">
            <VinInput value={vin} onChange={setVin} onDecoded={onDecoded} size="md" id="request-vin" />
            <CarFields {...car} onChange={(p) => setCar((c) => ({ ...c, ...p }))} />
            <Checkbox label={tg('add')} checked={saveToGarage} onChange={(e) => setSaveToGarage(e.target.checked)} />
          </div>
        )}
      </Panel>

      <Panel className="flex flex-col gap-4">
        <Field label={t('part')} htmlFor="title">
          <Input id="title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder={t('partPlaceholder')} required maxLength={300} />
        </Field>
        <Field label={tc('photos')}>
          <PhotoPicker value={photos} onChange={setPhotos} max={10} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('category')}>
            <Select value={f.categoryId} onChange={(e) => setF({ ...f, categoryId: e.target.value })}>
              <option value="">—</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name[locale] ?? c.name.ru}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t('oem')} hint={t('oemHint')}>
            <Input value={f.oemNumber} onChange={(e) => setF({ ...f, oemNumber: e.target.value })} className="code" placeholder="04465-33450" />
          </Field>
        </div>
        <Field label={t('description')}>
          <Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder={t('descriptionPlaceholder')} maxLength={5000} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
          <Field label={t('condition')}>
            <Segmented
              value={f.condition}
              onChange={(v) => setF({ ...f, condition: v })}
              options={(['ANY', 'NEW', 'USED'] as const).map((v) => ({ value: v, label: tc(`condition.${v}`) }))}
            />
          </Field>
          <Field label={t('origin')}>
            <Select value={f.originCountry} onChange={(e) => setF({ ...f, originCountry: e.target.value })}>
              {ORIGINS.map((o) => (
                <option key={o} value={o}>
                  {tc(`country.${o}`)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label={`${t('budget')}, ${tc('som')}`} hint={tc('optional')}>
          <Input type="number" inputMode="numeric" min={1} value={f.budget} onChange={(e) => setF({ ...f, budget: e.target.value })} className="max-w-48" />
        </Field>
      </Panel>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" disabled={!f.title || !carReady || create.isPending} onClick={() => void submit(false)}>
          {t('saveDraft')}
        </Button>
        <Button variant="primary" size="lg" loading={create.isPending || addVehicle.isPending} disabled={!f.title || !carReady}>
          {t('publish')}
        </Button>
      </div>
    </form>
  );
}

export default function NewRequestView() {
  return (
    <AuthGuard>
      <NewRequest />
    </AuthGuard>
  );
}
