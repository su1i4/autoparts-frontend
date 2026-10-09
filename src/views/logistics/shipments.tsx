'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useGet } from '@/shared/api/hooks';
import type { Paginated, Shipment, ShipmentStatus } from '@/shared/api/types';
import { dateTime } from '@/shared/lib/format';
import { Badge, DataTable, PageHeader, Pager, Panel, Segmented } from '@/shared/ui';
import { SHIP_LABEL } from './labels';

export default function ShipmentsView() {
  const router = useRouter();
  const [status, setStatus] = useState<ShipmentStatus | ''>('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGet<Paginated<Shipment>>(['shipments', page, status], '/logistics/shipments', { page, limit: 30, status });

  return (
    <>
      <PageHeader title="Отправки" subtitle="Приёмка, взвешивание и статусы посылок" />
      <Segmented
        className="mb-4"
        value={status}
        onChange={(v) => (setStatus(v), setPage(1))}
        options={[
          { value: '', label: 'Все' },
          { value: 'PENDING', label: 'Ждём от продавца' },
          { value: 'HANDED_BY_SELLER', label: 'Переданы' },
          { value: 'AT_ORIGIN_WAREHOUSE', label: 'На складе CN' },
          { value: 'IN_TRANSIT', label: 'В пути' },
          { value: 'AT_CUSTOMS', label: 'Таможня' },
          { value: 'AT_DESTINATION_WAREHOUSE', label: 'Склад КР' },
          { value: 'HANDED_TO_COURIER', label: 'У курьера' },
        ]}
      />
      <Panel>
        <DataTable<Shipment>
          loading={isLoading}
          rows={data?.items}
          empty="Отправок нет"
          onRowClick={(s) => router.push(`/logistics/shipments/${s.id}`)}
          columns={[
            { key: 'tr', title: 'Трек', render: (s) => <span className="code font-medium">{s.trackingNumber}</span> },
            { key: 'ext', title: 'Трек перевозчика', render: (s) => <span className="code text-sm">{s.externalTrackingNumber ?? '—'}</span> },
            { key: 'r', title: 'Маршрут', render: (s) => `${s.fromCountry} → ${s.toCountry}, ${s.method}` },
            { key: 'w', title: 'Вес', render: (s) => (s.weightKg ? `${s.weightKg} кг` : '—') },
            { key: 'c', title: 'Груз', render: (s) => (s.consolidationId ? <Badge tone="blue">в консолидации</Badge> : '—') },
            { key: 's', title: 'Статус', render: (s) => <Badge tone={s.status === 'DELIVERED' ? 'ok' : 'neutral'}>{SHIP_LABEL[s.status]}</Badge> },
            { key: 'd', title: 'Создана', render: (s) => <span className="text-ink-mute">{dateTime(s.createdAt)}</span> },
          ]}
        />
        {data && <Pager page={page} total={data.total} limit={data.limit} onPage={setPage} />}
      </Panel>
    </>
  );
}
