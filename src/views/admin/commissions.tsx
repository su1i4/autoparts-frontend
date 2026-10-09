'use client';

import { useState } from 'react';
import { useCategories } from '@/entities/reference/api';
import { api } from '@/shared/api/http';
import { useGet, useMut } from '@/shared/api/hooks';
import type { CommissionRule, CommissionScope, CommissionType } from '@/shared/api/types';
import { date, money } from '@/shared/lib/format';
import { Badge, Button, Checkbox, DataTable, Dialog, Field, Input, Note, PageHeader, Panel, Select } from '@/shared/ui';

const SCOPE: Record<CommissionScope, string> = { GLOBAL: 'Базовая', COUNTRY: 'Страна продавца', CATEGORY: 'Категория', SELLER: 'Продавец' };

export default function AdminCommissions() {
  const [history, setHistory] = useState(false);
  const { data, isLoading } = useGet<CommissionRule[]>(['commissions', history], '/admin/commissions', { history: history ? 'true' : undefined });
  const { data: cats } = useCategories();
  const create = useMut((b: object) => api.post('/admin/commissions', b), { invalidate: [['commissions']], success: 'Правило добавлено' });
  const update = useMut(({ id, ...b }: { id: string; value: number; type?: CommissionType }) => api.patch(`/admin/commissions/${id}`, b), { invalidate: [['commissions']], success: 'Новая версия правила создана' });
  const off = useMut((id: string) => api.del(`/admin/commissions/${id}`), { invalidate: [['commissions']], success: 'Правило отключено' });
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ scope: 'CATEGORY' as CommissionScope, categoryId: '', sellerId: '', country: 'CN', type: 'PERCENT' as CommissionType, value: '8', note: '' });
  const [pv, setPv] = useState({ amount: '10000', categoryId: '', sellerId: '', country: '' });
  const { data: preview } = useGet<{ amount: number; ruleId: string | null }>(['commission-preview', pv], '/admin/commissions/preview', pv);
  const catName = (id: string | null) => cats?.find((c) => c.id === id)?.name.ru ?? '—';

  return (
    <>
      <PageHeader
        title="Комиссия"
        subtitle="Приоритет: продавец → категория → страна → базовая. Изменение создаёт новую версию, старая остаётся в истории."
        actions={
          <Button variant="primary" onClick={() => setOpen(true)}>
            Новое правило
          </Button>
        }
      />
      <Checkbox label="Показать историю версий" checked={history} onChange={(e) => setHistory(e.target.checked)} />
      <Panel className="mt-3">
        <DataTable<CommissionRule>
          loading={isLoading}
          rows={data}
          columns={[
            { key: 's', title: 'Область', render: (r) => SCOPE[r.scope] },
            {
              key: 'w',
              title: 'Для',
              render: (r) => (r.scope === 'CATEGORY' ? catName(r.categoryId) : r.scope === 'COUNTRY' ? r.country : r.scope === 'SELLER' ? <span className="code text-[13px]">{r.sellerId?.slice(0, 8)}</span> : 'все'),
            },
            { key: 'v', title: 'Ставка', render: (r) => <span className="font-medium num">{r.type === 'PERCENT' ? `${r.value}%` : money(r.value)}</span> },
            { key: 'p', title: 'Период', render: (r) => `${date(r.validFrom)} — ${r.validTo ? date(r.validTo) : '…'}` },
            { key: 'a', title: 'Статус', render: (r) => (r.isActive ? <Badge tone="ok">Действует</Badge> : <Badge>Архив</Badge>) },
            {
              key: 'x',
              title: '',
              render: (r) =>
                r.isActive && (
                  <span className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const v = prompt(r.type === 'PERCENT' ? 'Новый процент' : 'Новая фикс. сумма, сом', String(r.value));
                        if (v) update.mutate({ id: r.id, value: Number(v) });
                      }}
                    >
                      Изменить
                    </Button>
                    {r.scope !== 'GLOBAL' && (
                      <Button size="sm" variant="ghost" onClick={() => off.mutate(r.id)}>
                        Отключить
                      </Button>
                    )}
                  </span>
                ),
            },
          ]}
        />
      </Panel>

      <Panel className="mt-5">
        <h2 className="mb-3 font-semibold">Проверка расчёта</h2>
        <div className="grid gap-2 sm:grid-cols-4">
          <Field label="Сумма товара, сом">
            <Input type="number" value={pv.amount} onChange={(e) => setPv({ ...pv, amount: e.target.value })} />
          </Field>
          <Field label="Категория">
            <Select value={pv.categoryId} onChange={(e) => setPv({ ...pv, categoryId: e.target.value })}>
              <option value="">—</option>
              {cats?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name.ru}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Страна продавца">
            <Input value={pv.country} onChange={(e) => setPv({ ...pv, country: e.target.value.toUpperCase() })} maxLength={2} />
          </Field>
          <Field label="ID продавца">
            <Input value={pv.sellerId} onChange={(e) => setPv({ ...pv, sellerId: e.target.value.trim() })} className="code" />
          </Field>
        </div>
        {preview && <Note>Комиссия: {money(preview.amount)}</Note>}
      </Panel>

      <Dialog open={open} onClose={() => setOpen(false)} title="Новое правило">
        <div className="flex flex-col gap-3">
          <Field label="Область">
            <Select value={f.scope} onChange={(e) => setF({ ...f, scope: e.target.value as CommissionScope })}>
              {Object.entries(SCOPE).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          {f.scope === 'CATEGORY' && (
            <Field label="Категория">
              <Select value={f.categoryId} onChange={(e) => setF({ ...f, categoryId: e.target.value })}>
                <option value="">—</option>
                {cats?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name.ru}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          {f.scope === 'COUNTRY' && (
            <Field label="Страна (ISO-2)">
              <Input value={f.country} onChange={(e) => setF({ ...f, country: e.target.value.toUpperCase() })} maxLength={2} />
            </Field>
          )}
          {f.scope === 'SELLER' && (
            <Field label="ID продавца">
              <Input value={f.sellerId} onChange={(e) => setF({ ...f, sellerId: e.target.value.trim() })} className="code" />
            </Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Тип">
              <Select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as CommissionType })}>
                <option value="PERCENT">Процент</option>
                <option value="FIXED">Фикс, сом</option>
              </Select>
            </Field>
            <Field label="Значение">
              <Input type="number" min={0} step="0.1" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} />
            </Field>
          </div>
          <Field label="Заметка">
            <Input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
          </Field>
          <Button
            variant="primary"
            loading={create.isPending}
            onClick={() =>
              create.mutate(
                {
                  scope: f.scope,
                  type: f.type,
                  value: Number(f.value),
                  note: f.note || undefined,
                  ...(f.scope === 'CATEGORY' ? { categoryId: f.categoryId } : {}),
                  ...(f.scope === 'COUNTRY' ? { country: f.country } : {}),
                  ...(f.scope === 'SELLER' ? { sellerId: f.sellerId } : {}),
                },
                { onSuccess: () => setOpen(false) },
              )
            }
          >
            Добавить
          </Button>
        </div>
      </Dialog>
    </>
  );
}
