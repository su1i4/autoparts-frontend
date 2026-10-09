'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { useMakes, useModels } from '@/entities/reference/api';
import { useAddVehicle } from '@/entities/vehicle/api';
import type { Vehicle, VinDecode } from '@/shared/api/types';
import { errorBody, errorMessage } from '@/shared/lib/errors';
import { Button, Dialog, Field, Input, Segmented, Select } from '@/shared/ui';
import { VinInput } from './vin-input';

/** Поля марки/модели/года: список из справочника + свободный ввод модели */
export function CarFields({
  make,
  model,
  year,
  onChange,
}: {
  make: string;
  model: string;
  year: string;
  onChange: (p: { make?: string; model?: string; year?: string }) => void;
}) {
  const t = useTranslations('garage');
  const { data: makes } = useMakes();
  const makeId = makes?.find((m) => m.name === make)?.id;
  const { data: models } = useModels(makeId);
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <Field label={t('make')}>
        <Input list="makes-list" value={make} onChange={(e) => onChange({ make: e.target.value, model: '' })} required />
        <datalist id="makes-list">
          {makes?.map((m) => <option key={m.id} value={m.name} />)}
        </datalist>
      </Field>
      <Field label={t('model')}>
        <Input list="models-list" value={model} onChange={(e) => onChange({ model: e.target.value })} required />
        <datalist id="models-list">
          {models?.map((m) => <option key={m.id} value={m.name} />)}
        </datalist>
      </Field>
      <Field label={t('year')} className="col-span-2 sm:col-span-1">
        <Input type="number" inputMode="numeric" min={1950} max={2100} value={year} onChange={(e) => onChange({ year: e.target.value })} />
      </Field>
    </div>
  );
}

export function AddVehicleDialog({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded?: (v: Vehicle) => void }) {
  const t = useTranslations('garage');
  const tc = useTranslations('common');
  const add = useAddVehicle();
  const [mode, setMode] = useState<'vin' | 'frame'>('vin');
  const [vin, setVin] = useState('');
  const [frame, setFrame] = useState('');
  const [car, setCar] = useState({ make: '', model: '', year: '' });
  const [engine, setEngine] = useState('');
  const [nickname, setNickname] = useState('');

  const onDecoded = (d: VinDecode | null) => {
    if (!d) return;
    setCar({ make: d.make ?? '', model: d.model ?? '', year: d.year ? String(d.year) : '' });
    if (d.engine) setEngine(d.engine);
  };

  const submit = () => {
    add.mutate(
      {
        ...(mode === 'vin' && vin ? { vin } : {}),
        ...(mode === 'frame' && frame ? { frameNumber: frame } : {}),
        make: car.make || undefined,
        model: car.model || undefined,
        year: car.year ? Number(car.year) : undefined,
        engine: engine || undefined,
        nickname: nickname || undefined,
      } as Partial<Vehicle>,
      {
        onSuccess: (v) => {
          toast.success(t('added'));
          onAdded?.(v);
          onClose();
          setVin('');
          setCar({ make: '', model: '', year: '' });
        },
        onError: (e) => toast.error(errorBody(e)?.code === 'VIN_NOT_RECOGNIZED' ? t('manual') : errorMessage(e)),
      },
    );
  };

  return (
    <Dialog open={open} onClose={onClose} title={t('add')} className="max-w-xl">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: 'vin', label: t('vin') },
            { value: 'frame', label: t('frame') },
          ]}
        />
        {mode === 'vin' ? (
          <VinInput value={vin} onChange={setVin} onDecoded={onDecoded} size="md" id="garage-vin" autoFocus />
        ) : (
          <Field label={t('frame')} hint={t('frameHint')}>
            <Input value={frame} onChange={(e) => setFrame(e.target.value.toUpperCase())} className="code" />
          </Field>
        )}
        <CarFields {...car} onChange={(p) => setCar((c) => ({ ...c, ...p }))} />
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('engine')}>
            <Input value={engine} onChange={(e) => setEngine(e.target.value)} placeholder="2AZ-FE 2.4" />
          </Field>
          <Field label={t('nickname')}>
            <Input value={nickname} onChange={(e) => setNickname(e.target.value)} />
          </Field>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {tc('cancel')}
          </Button>
          <Button variant="blue" loading={add.isPending} disabled={!car.make || !car.model}>
            {t('add')}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
