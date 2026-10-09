'use client';

import { useState } from 'react';
import { api } from '@/shared/api/http';
import { useMut } from '@/shared/api/hooks';
import { Button, ErrorBox, Field, Note, PageHeader, Panel, Textarea } from '@/shared/ui';

/** Массовая загрузка трек-номеров перевозчиков: строка «AP… ; трек ; перевозчик» */
export default function TrackingUploadView() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<{ updated: number; notFound: string[] } | null>(null);
  const upload = useMut((items: object[]) => api.post<{ updated: number; notFound: string[] }>('/logistics/tracking/bulk', { items }), {
    invalidate: [['shipments']],
    onSuccess: (r) => setResult(r),
  });
  const rows = text
    .split('\n')
    .map((l) => l.split(/[;,\t]/).map((x) => x.trim()))
    .filter((r) => r[0] && r[1])
    .map(([trackingNumber, externalTrackingNumber, carrier]) => ({ trackingNumber, externalTrackingNumber, carrier: carrier || undefined }));

  return (
    <div className="max-w-2xl">
      <PageHeader title="Загрузка трек-номеров" subtitle="Вставьте строки из таблицы перевозчика" />
      <Panel className="flex flex-col gap-3">
        <Note>Формат строки: наш трек AP…; трек перевозчика; перевозчик (необязательно). Разделитель — точка с запятой, запятая или табуляция.</Note>
        <Field label={`Строк распознано: ${rows.length}`}>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} className="code min-h-48" placeholder={'APXXXXXXXXXX; YT1234567890; Cargo GZ\nAPYYYYYYYYYY; SF0987654321'} />
        </Field>
        <Button variant="blue" disabled={!rows.length} loading={upload.isPending} onClick={() => upload.mutate(rows)}>
          Загрузить
        </Button>
        {result && (
          <>
            <Note>Обновлено: {result.updated}</Note>
            {!!result.notFound.length && <ErrorBox>Не найдены: {result.notFound.join(', ')}</ErrorBox>}
          </>
        )}
      </Panel>
    </div>
  );
}
