'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { PhotoPicker } from '@/features/upload/photo-picker';
import { api } from '@/shared/api/http';
import { useGet, useMut } from '@/shared/api/hooks';
import type { Shipment, ShipmentStatus, Warehouse } from '@/shared/api/types';
import { dateTime, money } from '@/shared/lib/format';
import { Badge, Button, Checkbox, Field, Input, KeyValue, Loading, PageHeader, Panel, Select, Textarea } from '@/shared/ui';
import { SHIPPING_METHOD_LABEL } from '../admin/labels';
import { SHIP_FLOW, SHIP_LABEL } from './labels';

export default function ShipmentView() {
  const { id } = useParams<{ id: string }>();
  const { data: s, isLoading } = useGet<Shipment>(['shipment', id], `/logistics/shipments/${id}`);
  const { data: whs } = useGet<Warehouse[]>(['warehouses'], '/logistics/warehouses');
  const inv = [['shipment', id], ['shipments']];
  const receive = useMut((b: object) => api.post(`/logistics/shipments/${id}/receive`, b), { invalidate: inv, success: 'Приёмка отмечена' });
  const setStatus = useMut((b: object) => api.post(`/logistics/shipments/${id}/status`, b), { invalidate: inv, success: 'Статус обновлён' });

  const [rc, setRc] = useState({ warehouseId: '', weightKg: '', l: '', w: '', h: '', complete: true, note: '' });
  const [photos, setPhotos] = useState<string[]>([]);
  const [st, setSt] = useState({ status: '' as ShipmentStatus | '', location: '', note: '', carrier: '', externalTrackingNumber: '' });

  if (isLoading || !s) return <Loading />;
  const next = SHIP_FLOW.filter((x) => SHIP_FLOW.indexOf(x) > SHIP_FLOW.indexOf(s.status));
  // принимать на склад можно, пока посылка не ушла к курьеру
  const canReceive = SHIP_FLOW.indexOf(s.status) < SHIP_FLOW.indexOf('HANDED_TO_COURIER') && s.status !== 'CANCELLED';
  const consolidationWh = whs?.filter((w) => w.type === 'CONSOLIDATION') ?? [];

  return (
    <>
      <PageHeader title={<span className="code">{s.trackingNumber}</span>} subtitle={<Badge tone="blue">{SHIP_LABEL[s.status]}</Badge>} />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <Panel>
            <KeyValue
              items={[
                ['Маршрут', `${s.fromCountry} → ${s.toCountry}`],
                ['Способ', SHIPPING_METHOD_LABEL[s.method] ?? s.method],
                ['Получение', s.deliveryMethod === 'COURIER' ? 'Курьер' : 'Пункт выдачи'],
                ['Перевозчик', s.carrier ?? '—'],
                ['Трек перевозчика', <span key="e" className="code">{s.externalTrackingNumber ?? '—'}</span>],
                ['Вес', s.weightKg ? `${s.weightKg} кг` : '—'],
                ['Габариты', s.dimensions ? `${s.dimensions.l}×${s.dimensions.w}×${s.dimensions.h} см` : '—'],
                ['Стоимость доставки', money(s.cost)],
              ]}
            />
          </Panel>
          <Panel>
            <h2 className="mb-3 font-semibold">Лента статусов</h2>
            <ol className="flex flex-col gap-3">
              {s.events?.map((e) => (
                <li key={e.id} className="border-l-2 border-steel pl-3">
                  <p className="font-medium">{SHIP_LABEL[e.status]}</p>
                  <p className="text-sm text-ink-mute">
                    {dateTime(e.createdAt)} {e.location}
                  </p>
                  {e.note && <p className="text-sm text-ink-soft">{e.note}</p>}
                  {!!e.photos.length && (
                    <div className="mt-1 flex gap-1">
                      {e.photos.map((p) => (
                        <a key={p} href={p} target="_blank" rel="noreferrer" className="text-sm text-blue underline">
                          фото
                        </a>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </Panel>
        </div>
        <div className="flex flex-col gap-5">
          {canReceive && (
          <Panel className="flex flex-col gap-3">
            <h2 className="font-semibold">Приёмка на складе</h2>
            <Field label="Склад">
              <Select value={rc.warehouseId} onChange={(e) => setRc({ ...rc, warehouseId: e.target.value })}>
                <option value="">Выберите склад</option>
                {consolidationWh.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-4 gap-2">
              <Field label="Вес, кг">
                <Input type="number" step="0.1" value={rc.weightKg} onChange={(e) => setRc({ ...rc, weightKg: e.target.value })} />
              </Field>
              <Field label="Д, см">
                <Input type="number" value={rc.l} onChange={(e) => setRc({ ...rc, l: e.target.value })} />
              </Field>
              <Field label="Ш, см">
                <Input type="number" value={rc.w} onChange={(e) => setRc({ ...rc, w: e.target.value })} />
              </Field>
              <Field label="В, см">
                <Input type="number" value={rc.h} onChange={(e) => setRc({ ...rc, h: e.target.value })} />
              </Field>
            </div>
            <PhotoPicker value={photos} onChange={setPhotos} max={10} />
            <Checkbox label="Комплектность проверена" checked={rc.complete} onChange={(e) => setRc({ ...rc, complete: e.target.checked })} />
            <Field label="Заметка">
              <Textarea value={rc.note} onChange={(e) => setRc({ ...rc, note: e.target.value })} className="min-h-16" />
            </Field>
            <Button
              variant="blue"
              loading={receive.isPending}
              disabled={!rc.warehouseId}
              onClick={() =>
                receive.mutate({
                  warehouseId: rc.warehouseId,
                  weightKg: rc.weightKg ? Number(rc.weightKg) : undefined,
                  dimensions: rc.l && rc.w && rc.h ? { l: Number(rc.l), w: Number(rc.w), h: Number(rc.h) } : undefined,
                  photos,
                  complete: rc.complete,
                  note: rc.note || undefined,
                })
              }
            >
              Принять на склад
            </Button>
          </Panel>
          )}
          {!!next.length && (
            <Panel className="flex flex-col gap-3">
              <h2 className="font-semibold">Сменить статус</h2>
              <Field label="Новый статус">
                <Select value={st.status} onChange={(e) => setSt({ ...st, status: e.target.value as ShipmentStatus })}>
                  <option value="">—</option>
                  {next.map((x) => (
                    <option key={x} value={x}>
                      {SHIP_LABEL[x]}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Где">
                  <Input value={st.location} onChange={(e) => setSt({ ...st, location: e.target.value })} placeholder="Иркештам" />
                </Field>
                <Field label="Перевозчик">
                  <Input value={st.carrier} onChange={(e) => setSt({ ...st, carrier: e.target.value })} />
                </Field>
              </div>
              <Field label="Трек перевозчика">
                <Input value={st.externalTrackingNumber} onChange={(e) => setSt({ ...st, externalTrackingNumber: e.target.value })} className="code" />
              </Field>
              <Field label="Заметка">
                <Input value={st.note} onChange={(e) => setSt({ ...st, note: e.target.value })} />
              </Field>
              <Button
                variant="primary"
                loading={setStatus.isPending}
                disabled={!st.status}
                onClick={() =>
                  setStatus.mutate(
                    Object.fromEntries(Object.entries(st).filter(([, v]) => v)),
                    { onSuccess: () => setSt({ status: '', location: '', note: '', carrier: '', externalTrackingNumber: '' }) },
                  )
                }
              >
                Сохранить статус
              </Button>
              <Button variant="ghost" size="sm" onClick={() => confirm('Отменить отправку?') && setStatus.mutate({ status: 'CANCELLED' })}>
                Отменить отправку
              </Button>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
