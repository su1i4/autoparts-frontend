'use client';

import { Car, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { carTitle, useDeleteVehicle, useGarage } from '@/entities/vehicle/api';
import { VinPlate } from '@/entities/vehicle/ui/vin-plate';
import { AddVehicleDialog } from '@/features/vehicle/add-vehicle';
import { Button, buttonClass, Empty, Loading, PageHeader } from '@/shared/ui';
import { AuthGuard } from '@/widgets/guard/auth-guard';

function Garage() {
  const t = useTranslations('garage');
  const tc = useTranslations('common');
  const tn = useTranslations('nav');
  const { data, isLoading } = useGarage();
  const del = useDeleteVehicle();
  const [open, setOpen] = useState(false);

  return (
    <>
      <PageHeader
        title={t('title')}
        subtitle={t('lead')}
        actions={
          <Button variant="blue" onClick={() => setOpen(true)}>
            {t('add')}
          </Button>
        }
      />
      {isLoading ? (
        <Loading />
      ) : !data?.length ? (
        <Empty icon={<Car className="size-10" />} title={t('empty')} text={t('emptyText')} action={<Button variant="primary" onClick={() => setOpen(true)}>{t('add')}</Button>} />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {data.map((v) => (
            <li key={v.id} className="rounded-xl border border-steel-light bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-semibold">{v.nickname || carTitle(v)}</p>
                  {v.nickname && <p className="text-ink-soft">{carTitle(v)}</p>}
                  {v.engine && <p className="text-sm text-ink-mute">{v.engine}</p>}
                </div>
                <button
                  onClick={() => confirm(t('removeConfirm')) && del.mutate(v.id, { onSuccess: () => toast.success(t('removed')) })}
                  className="rounded-lg p-2 text-ink-mute hover:bg-danger-tint hover:text-danger"
                  aria-label={tc('delete')}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <div className="mt-3">
                {v.vin ? <VinPlate vin={v.vin} size="sm" /> : v.frameNumber ? <VinPlate vin={v.frameNumber} size="sm" caption={t('frame')} /> : <span className="text-sm text-ink-mute">{t('noVin')}</span>}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/requests/new?vehicleId=${v.id}`} className={buttonClass('primary', 'sm')}>
                  {tn('newRequest')}
                </Link>
                <Link href={`/catalog?vehicleId=${v.id}`} className={buttonClass('outline', 'sm')}>
                  {t('findParts')}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
      <AddVehicleDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export default function GarageView() {
  return (
    <AuthGuard>
      <Garage />
    </AuthGuard>
  );
}
