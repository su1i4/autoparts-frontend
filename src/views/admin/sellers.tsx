'use client';

import { useState } from 'react';
import { api } from '@/shared/api/http';
import { useGet, useMut } from '@/shared/api/hooks';
import type { Paginated, Seller, VerificationStatus } from '@/shared/api/types';
import { date, phone } from '@/shared/lib/format';
import { VERIFICATION_LABEL } from './labels';
import { Badge, Button, DataTable, Dialog, Field, Input, PageHeader, Pager, Panel, Segmented, Textarea } from '@/shared/ui';

const TYPE: Record<string, string> = { SHOP: 'Магазин', SCRAPYARD: 'Разборка', PRIVATE: 'Частник' };
const DOC: Record<string, string> = { IP_CERT: 'Свид. ИП', LLC_CERT: 'Свид. ОсОО', PATENT: 'Патент', PASSPORT: 'Паспорт', OTHER: 'Документ' };

export default function AdminSellers() {
  const [status, setStatus] = useState<VerificationStatus | ''>('PENDING');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [cur, setCur] = useState<Seller | null>(null);
  const [comment, setComment] = useState('');
  const [limit, setLimit] = useState('');
  const { data, isLoading } = useGet<Paginated<Seller>>(['admin-sellers', status, search, page], '/admin/sellers', { status, search, page, limit: 30 });
  const verify = useMut(({ id, ...b }: { id: string; status: VerificationStatus; comment?: string }) => api.patch(`/admin/sellers/${id}/verification`, b), {
    invalidate: [['admin-sellers'], ['admin-stats']],
    success: 'Решение сохранено',
    onSuccess: () => setCur(null),
  });
  const setLim = useMut(({ id, v }: { id: string; v: number | null }) => api.patch(`/admin/sellers/${id}/limits`, { offersPerDayLimit: v }), { invalidate: [['admin-sellers']], success: 'Лимит сохранён' });

  return (
    <>
      <PageHeader title="Продавцы" subtitle="Верификация документов, лимиты" />
      <div className="mb-4 flex flex-wrap gap-2">
        <Segmented
          value={status}
          onChange={(v) => (setStatus(v), setPage(1))}
          options={[
            { value: 'PENDING', label: 'На проверке' },
            { value: 'VERIFIED', label: 'Проверены' },
            { value: 'REJECTED', label: 'Отклонены' },
            { value: '', label: 'Все' },
          ]}
        />
        <Input placeholder="Название или ИНН" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
      </div>
      <Panel>
        <DataTable<Seller>
          loading={isLoading}
          rows={data?.items}
          empty="Нет продавцов"
          onRowClick={(s) => (setCur(s), setComment(s.verificationComment ?? ''), setLimit(s.offersPerDayLimit ? String(s.offersPerDayLimit) : ''))}
          columns={[
            { key: 'n', title: 'Название', render: (s) => <span className="font-medium">{s.displayName}</span> },
            { key: 't', title: 'Тип', render: (s) => TYPE[s.type] },
            { key: 'p', title: 'Телефон', render: (s) => <span className="code">{phone(s.user?.phone)}</span> },
            { key: 'c', title: 'Точки', render: (s) => s.stores?.map((x) => `${x.city} (${x.country})`).join(', ') },
            { key: 'r', title: 'Рейтинг', render: (s) => (s.reviewsCount ? `${s.rating} (${s.reviewsCount})` : '—') },
            {
              key: 's',
              title: 'Статус',
              render: (s) => <Badge tone={s.verificationStatus === 'VERIFIED' ? 'ok' : s.verificationStatus === 'REJECTED' ? 'danger' : 'amber'}>{VERIFICATION_LABEL[s.verificationStatus] ?? s.verificationStatus}</Badge>,
            },
            { key: 'd', title: 'Заявка', render: (s) => date(s.createdAt) },
          ]}
        />
        {data && <Pager page={page} total={data.total} limit={data.limit} onPage={setPage} />}
      </Panel>

      <Dialog open={!!cur} onClose={() => setCur(null)} title={cur?.displayName ?? ''} className="max-w-xl">
        {cur && (
          <div className="flex flex-col gap-3">
            <p className="text-ink-soft">
              {TYPE[cur.type]} {cur.legalName} {cur.inn && <span className="code">ИНН {cur.inn}</span>}
            </p>
            <div>
              <p className="mb-1 font-medium">Документы</p>
              <ul className="flex flex-wrap gap-3">
                {cur.documents?.map((d) => (
                  <li key={d.id}>
                    <a href={d.url} target="_blank" rel="noreferrer" className="text-blue underline">
                      {DOC[d.type] ?? d.type}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <Field label="Комментарий (виден продавцу при отклонении)">
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} className="min-h-16" />
            </Field>
            <div className="flex gap-2">
              <Button variant="primary" loading={verify.isPending} onClick={() => verify.mutate({ id: cur.id, status: 'VERIFIED', comment: comment || undefined })}>
                Подтвердить
              </Button>
              <Button variant="danger" disabled={!comment} onClick={() => verify.mutate({ id: cur.id, status: 'REJECTED', comment })}>
                Отклонить
              </Button>
            </div>
            <div className="flex items-end gap-2 border-t border-steel-light pt-3">
              <Field label="Лимит предложений в сутки" hint="Пусто — общий лимит из настроек">
                <Input type="number" min={0} value={limit} onChange={(e) => setLimit(e.target.value)} className="max-w-32" />
              </Field>
              <Button variant="outline" onClick={() => setLim.mutate({ id: cur.id, v: limit ? Number(limit) : null })}>
                Сохранить
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
}
