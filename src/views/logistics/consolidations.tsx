'use client';

import { useState } from 'react';
import { api } from '@/shared/api/http';
import { useGet, useMut } from '@/shared/api/hooks';
import type { Consolidation, Paginated, Shipment, ShipmentStatus, ShippingMethod, Warehouse } from '@/shared/api/types';
import { dateTime } from '@/shared/lib/format';
import { Badge, Button, Checkbox, DataTable, Dialog, Field, Input, PageHeader, Panel, Select } from '@/shared/ui';
import { SHIPPING_METHOD_LABEL } from '../admin/labels';
import { SHIP_LABEL } from './labels';

const NEXT: ShipmentStatus[] = ['IN_TRANSIT', 'AT_CUSTOMS', 'AT_DESTINATION_WAREHOUSE'];

export default function ConsolidationsView() {
  const { data, isLoading } = useGet<Paginated<Consolidation>>(['consolidations'], '/logistics/consolidations', { limit: 50 });
  const { data: whs } = useGet<Warehouse[]>(['warehouses'], '/logistics/warehouses');
  const { data: waiting } = useGet<Paginated<Shipment>>(['shipments', 'at-origin'], '/logistics/shipments', { status: 'AT_ORIGIN_WAREHOUSE', limit: 100 });
  const create = useMut((b: object) => api.post('/logistics/consolidations', b), { invalidate: [['consolidations'], ['shipments']], success: 'Груз сформирован' });
  const setStatus = useMut(({ id, status, location }: { id: string; status: ShipmentStatus; location?: string }) => api.post(`/logistics/consolidations/${id}/status`, { status, location }), {
    invalidate: [['consolidations'], ['shipments']],
    success: (r: unknown) => `Обновлено посылок: ${(r as { updated: number }).updated}`,
  });

  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<string[]>([]);
  const [f, setF] = useState({ originWarehouseId: '', destinationWarehouseId: '', method: 'TRUCK' as ShippingMethod, carrier: '', trackingNumber: '' });
  const cnWh = whs?.filter((w) => w.type === 'CONSOLIDATION' && w.country !== 'KG') ?? [];
  const kgWh = whs?.filter((w) => w.type === 'CONSOLIDATION' && w.country === 'KG') ?? [];
  const free = waiting?.items.filter((s) => !s.consolidationId) ?? [];
  const whName = (id: string) => whs?.find((w) => w.id === id)?.city ?? '—';

  return (
    <>
      <PageHeader
        title="Консолидация"
        subtitle="Сборные грузы Китай → Бишкек. Статус груза применяется ко всем посылкам внутри."
        actions={
          <Button variant="primary" onClick={() => setOpen(true)} disabled={!free.length}>
            Сформировать груз ({free.length})
          </Button>
        }
      />
      <Panel>
        <DataTable<Consolidation>
          loading={isLoading}
          rows={data?.items}
          empty="Грузов пока нет"
          columns={[
            { key: 'c', title: 'Код', render: (c) => <span className="code font-medium">{c.code}</span> },
            { key: 'r', title: 'Маршрут', render: (c) => `${whName(c.originWarehouseId)} → ${whName(c.destinationWarehouseId)}` },
            { key: 'm', title: 'Способ', render: (c) => SHIPPING_METHOD_LABEL[c.method] ?? c.method },
            { key: 't', title: 'Перевозчик / трек', render: (c) => [c.carrier, c.trackingNumber].filter(Boolean).join(' ') || '—' },
            { key: 's', title: 'Статус', render: (c) => <Badge tone="blue">{SHIP_LABEL[c.status]}</Badge> },
            { key: 'd', title: 'Отправлен', render: (c) => dateTime(c.shippedAt) },
            {
              key: 'a',
              title: '',
              render: (c) => (
                <Select
                  value=""
                  onChange={(e) => e.target.value && setStatus.mutate({ id: c.id, status: e.target.value as ShipmentStatus })}
                  className="h-8 min-w-40 text-sm"
                  aria-label="Сменить статус груза"
                >
                  <option value="">Сменить статус…</option>
                  {NEXT.map((s) => (
                    <option key={s} value={s}>
                      {SHIP_LABEL[s]}
                    </option>
                  ))}
                </Select>
              ),
            },
          ]}
        />
      </Panel>

      <Dialog open={open} onClose={() => setOpen(false)} title="Новый сборный груз" className="max-w-2xl">
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Откуда">
              <Select value={f.originWarehouseId} onChange={(e) => setF({ ...f, originWarehouseId: e.target.value })}>
                <option value="">—</option>
                {cnWh.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Куда">
              <Select value={f.destinationWarehouseId} onChange={(e) => setF({ ...f, destinationWarehouseId: e.target.value })}>
                <option value="">—</option>
                {kgWh.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Способ">
              <Select value={f.method} onChange={(e) => setF({ ...f, method: e.target.value as ShippingMethod })}>
                <option value="AIR">Авиа</option>
                <option value="TRUCK">Авто</option>
                <option value="RAIL">Ж/д</option>
              </Select>
            </Field>
            <Field label="Перевозчик">
              <Input value={f.carrier} onChange={(e) => setF({ ...f, carrier: e.target.value })} />
            </Field>
          </div>
          <Field label="Трек груза">
            <Input value={f.trackingNumber} onChange={(e) => setF({ ...f, trackingNumber: e.target.value })} className="code" />
          </Field>
          <p className="font-medium">Посылки на складе ({free.length})</p>
          <ul className="max-h-56 overflow-y-auto rounded-lg border border-steel-light p-2">
            {free.map((s) => (
              <li key={s.id} className="py-1">
                <Checkbox
                  label={
                    <span>
                      <span className="code">{s.trackingNumber}</span> <span className="text-ink-mute">{s.weightKg ? `${s.weightKg} кг` : ''}</span>
                    </span>
                  }
                  checked={sel.includes(s.id)}
                  onChange={(e) => setSel(e.target.checked ? [...sel, s.id] : sel.filter((x) => x !== s.id))}
                />
              </li>
            ))}
          </ul>
          <Button
            variant="primary"
            loading={create.isPending}
            disabled={!sel.length || !f.originWarehouseId || !f.destinationWarehouseId}
            onClick={() =>
              create.mutate(
                { shipmentIds: sel, ...f, carrier: f.carrier || undefined, trackingNumber: f.trackingNumber || undefined },
                { onSuccess: () => (setOpen(false), setSel([])) },
              )
            }
          >
            Сформировать ({sel.length})
          </Button>
        </div>
      </Dialog>
    </>
  );
}
