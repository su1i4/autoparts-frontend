'use client';

import { useEffect, useState } from 'react';
import { api } from '@/shared/api/http';
import { useGet, useMut } from '@/shared/api/hooks';
import type { AuditLog, CarMake, Category, Currency, Paginated, ShippingMethod, ShippingTariff, Warehouse, WarehouseType } from '@/shared/api/types';
import { dateTime, money } from '@/shared/lib/format';
import { SHIPPING_METHOD_LABEL } from './labels';
import { Badge, Button, DataTable, Dialog, Field, Input, Note, PageHeader, Pager, Panel, Segmented, Select, Textarea } from '@/shared/ui';

// ───────────── Склады и тарифы ─────────────

const WT: Record<WarehouseType, string> = { CONSOLIDATION: 'Склад консолидации', PICKUP_POINT: 'Пункт выдачи', SELLER: 'Склад продавца' };

export function AdminLogistics() {
  const [tab, setTab] = useState<'wh' | 'tariffs'>('wh');
  const { data: whs, isLoading } = useGet<Warehouse[]>(['warehouses'], '/logistics/warehouses');
  const { data: tariffs, isLoading: tl } = useGet<ShippingTariff[]>(['tariffs'], '/admin/logistics/tariffs');
  const saveWh = useMut(({ id, ...b }: Partial<Warehouse>) => (id ? api.patch(`/admin/logistics/warehouses/${id}`, b) : api.post('/admin/logistics/warehouses', b)), {
    invalidate: [['warehouses'], ['pickup-points']],
    success: 'Склад сохранён',
  });
  const saveT = useMut(({ id, ...b }: Partial<ShippingTariff>) => (id ? api.patch(`/admin/logistics/tariffs/${id}`, b) : api.post('/admin/logistics/tariffs', b)), {
    invalidate: [['tariffs']],
    success: 'Тариф сохранён',
  });
  const [wh, setWh] = useState<Partial<Warehouse> | null>(null);
  const [tf, setTf] = useState<Partial<ShippingTariff> | null>(null);

  return (
    <>
      <PageHeader
        title="Склады и тарифы"
        actions={
          <Button variant="primary" onClick={() => (tab === 'wh' ? setWh({ type: 'PICKUP_POINT', country: 'KG', city: 'Бишкек', isActive: true }) : setTf({ fromCountry: 'CN', toCountry: 'KG', method: 'TRUCK', volumetricDivisor: 6000, surchargePercent: 0, isActive: true }))}>
            Добавить
          </Button>
        }
      />
      <Segmented
        className="mb-4"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'wh', label: 'Склады и ПВЗ' },
          { value: 'tariffs', label: 'Тарифы доставки' },
        ]}
      />
      <Panel>
        {tab === 'wh' ? (
          <DataTable<Warehouse>
            loading={isLoading}
            rows={whs}
            onRowClick={setWh}
            columns={[
              { key: 'n', title: 'Название', render: (w) => <span className="font-medium">{w.name}</span> },
              { key: 't', title: 'Тип', render: (w) => WT[w.type] },
              { key: 'a', title: 'Адрес', render: (w) => `${w.country}, ${w.city}, ${w.address}` },
              { key: 's', title: '', render: (w) => (w.isActive ? <Badge tone="ok">Работает</Badge> : <Badge>Закрыт</Badge>) },
            ]}
          />
        ) : (
          <DataTable<ShippingTariff>
            loading={tl}
            rows={tariffs}
            onRowClick={setTf}
            columns={[
              { key: 'r', title: 'Направление', render: (t) => `${t.fromCountry} → ${t.toCountry}` },
              { key: 'm', title: 'Способ', render: (t) => SHIPPING_METHOD_LABEL[t.method] ?? t.method },
              { key: 'k', title: 'За кг', render: (t) => money(t.pricePerKg) },
              { key: 'min', title: 'Минимум', render: (t) => money(t.minPrice) },
              { key: 'v', title: 'Объёмный делитель', render: (t) => t.volumetricDivisor },
              { key: 'd', title: 'Срок', render: (t) => `${t.daysMin}–${t.daysMax} дн.` },
              { key: 's', title: '', render: (t) => (t.isActive ? <Badge tone="ok">Активен</Badge> : <Badge>Выключен</Badge>) },
            ]}
          />
        )}
      </Panel>

      <Dialog open={!!wh} onClose={() => setWh(null)} title={wh?.id ? wh.name ?? '' : 'Новый склад / ПВЗ'}>
        {wh && (
          <div className="flex flex-col gap-3">
            <Field label="Название">
              <Input value={wh.name ?? ''} onChange={(e) => setWh({ ...wh, name: e.target.value })} />
            </Field>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Тип">
                <Select value={wh.type} onChange={(e) => setWh({ ...wh, type: e.target.value as WarehouseType })}>
                  {Object.entries(WT).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Страна">
                <Input value={wh.country ?? ''} maxLength={2} onChange={(e) => setWh({ ...wh, country: e.target.value.toUpperCase() })} />
              </Field>
              <Field label="Город">
                <Input value={wh.city ?? ''} onChange={(e) => setWh({ ...wh, city: e.target.value })} />
              </Field>
            </div>
            <Field label="Адрес">
              <Input value={wh.address ?? ''} onChange={(e) => setWh({ ...wh, address: e.target.value })} />
            </Field>
            <Select value={wh.isActive ? '1' : '0'} onChange={(e) => setWh({ ...wh, isActive: e.target.value === '1' })} aria-label="Статус">
              <option value="1">Работает</option>
              <option value="0">Закрыт</option>
            </Select>
            <Button
              variant="primary"
              onClick={() =>
                saveWh.mutate({ id: wh.id, name: wh.name, type: wh.type, country: wh.country, city: wh.city, address: wh.address, isActive: wh.isActive }, { onSuccess: () => setWh(null) })
              }
            >
              Сохранить
            </Button>
          </div>
        )}
      </Dialog>

      <Dialog open={!!tf} onClose={() => setTf(null)} title="Тариф доставки">
        {tf && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-3 gap-2">
              <Field label="Откуда">
                <Input value={tf.fromCountry ?? ''} maxLength={2} onChange={(e) => setTf({ ...tf, fromCountry: e.target.value.toUpperCase() })} />
              </Field>
              <Field label="Куда">
                <Input value={tf.toCountry ?? ''} maxLength={2} onChange={(e) => setTf({ ...tf, toCountry: e.target.value.toUpperCase() })} />
              </Field>
              <Field label="Способ">
                <Select value={tf.method} onChange={(e) => setTf({ ...tf, method: e.target.value as ShippingMethod })}>
                  {['AIR', 'TRUCK', 'RAIL', 'LOCAL'].map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Цена за кг, сом">
                <Input type="number" value={tf.pricePerKg ?? ''} onChange={(e) => setTf({ ...tf, pricePerKg: Number(e.target.value) })} />
              </Field>
              <Field label="Минимум, сом">
                <Input type="number" value={tf.minPrice ?? ''} onChange={(e) => setTf({ ...tf, minPrice: Number(e.target.value) })} />
              </Field>
              <Field label="Объёмный делитель">
                <Input type="number" value={tf.volumetricDivisor ?? ''} onChange={(e) => setTf({ ...tf, volumetricDivisor: Number(e.target.value) })} />
              </Field>
              <Field label="Надбавка, %">
                <Input type="number" value={tf.surchargePercent ?? 0} onChange={(e) => setTf({ ...tf, surchargePercent: Number(e.target.value) })} />
              </Field>
              <Field label="Срок от, дн.">
                <Input type="number" value={tf.daysMin ?? ''} onChange={(e) => setTf({ ...tf, daysMin: Number(e.target.value) })} />
              </Field>
              <Field label="Срок до, дн.">
                <Input type="number" value={tf.daysMax ?? ''} onChange={(e) => setTf({ ...tf, daysMax: Number(e.target.value) })} />
              </Field>
            </div>
            <Button
              variant="primary"
              onClick={() =>
                saveT.mutate(
                  {
                    id: tf.id,
                    fromCountry: tf.fromCountry,
                    toCountry: tf.toCountry,
                    method: tf.method,
                    pricePerKg: tf.pricePerKg,
                    minPrice: tf.minPrice,
                    volumetricDivisor: tf.volumetricDivisor,
                    surchargePercent: tf.surchargePercent,
                    daysMin: tf.daysMin,
                    daysMax: tf.daysMax,
                    isActive: tf.isActive,
                  },
                  { onSuccess: () => setTf(null) },
                )
              }
            >
              Сохранить
            </Button>
          </div>
        )}
      </Dialog>
    </>
  );
}

// ───────────── Справочники ─────────────

export function AdminReference() {
  const [tab, setTab] = useState<'cats' | 'makes' | 'rates'>('rates');
  const { data: cats } = useGet<Category[]>(['admin-categories'], '/admin/reference/categories');
  const { data: makes } = useGet<CarMake[]>(['makes'], '/reference/makes');
  const { data: rates } = useGet<Record<Currency, number>>(['rates'], '/reference/exchange-rates');
  const saveCat = useMut(({ id, ...b }: Partial<Category>) => (id ? api.patch(`/admin/reference/categories/${id}`, b) : api.post('/admin/reference/categories', b)), {
    invalidate: [['admin-categories'], ['categories']],
    success: 'Категория сохранена',
  });
  const addMake = useMut((name: string) => api.post('/admin/reference/makes', { name }), { invalidate: [['makes']], success: 'Марка добавлена' });
  const addModel = useMut((b: { makeId: string; name: string }) => api.post('/admin/reference/models', b), { invalidate: [['models']], success: 'Модель добавлена' });
  const setRate = useMut((b: { currency: Currency; rateToKgs: number }) => api.post('/admin/reference/exchange-rates', b), { invalidate: [['rates']], success: 'Курс обновлён' });
  const [cat, setCat] = useState<Partial<Category> | null>(null);
  const [mk, setMk] = useState('');
  const [md, setMd] = useState({ makeId: '', name: '' });

  return (
    <>
      <PageHeader title="Справочники" />
      <Segmented
        className="mb-4"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'rates', label: 'Курсы валют' },
          { value: 'cats', label: 'Категории' },
          { value: 'makes', label: 'Марки и модели' },
        ]}
      />
      {tab === 'rates' && (
        <Panel className="flex max-w-md flex-col gap-3">
          <Note>Курс фиксируется в заказе на момент оформления. Новый курс применяется к новым заказам.</Note>
          {(['USD', 'CNY', 'RUB'] as Currency[]).map((c) => (
            <form
              key={c}
              className="flex items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const v = Number(new FormData(e.currentTarget).get('rate'));
                if (v > 0) setRate.mutate({ currency: c, rateToKgs: v });
              }}
            >
              <Field label={`1 ${c} = сом`} className="flex-1">
                <Input name="rate" type="number" step="0.0001" defaultValue={rates?.[c]} key={rates?.[c]} />
              </Field>
              <Button variant="outline">Сохранить</Button>
            </form>
          ))}
        </Panel>
      )}
      {tab === 'cats' && (
        <Panel>
          <Button variant="primary" size="sm" className="mb-3" onClick={() => setCat({ slug: '', name: { ru: '', ky: '', en: '' }, sort: 0, isActive: true })}>
            Новая категория
          </Button>
          <DataTable<Category>
            rows={cats}
            onRowClick={setCat}
            columns={[
              { key: 's', title: 'Slug', render: (c) => <span className="code">{c.slug}</span> },
              { key: 'ru', title: 'RU', render: (c) => c.name.ru },
              { key: 'ky', title: 'KY', render: (c) => c.name.ky },
              { key: 'en', title: 'EN', render: (c) => c.name.en },
              { key: 'a', title: '', render: (c) => (c.isActive ? '' : <Badge>скрыта</Badge>) },
            ]}
          />
        </Panel>
      )}
      {tab === 'makes' && (
        <Panel className="flex flex-col gap-4">
          <div className="flex items-end gap-2">
            <Field label="Новая марка">
              <Input value={mk} onChange={(e) => setMk(e.target.value)} />
            </Field>
            <Button variant="outline" disabled={!mk} onClick={() => addMake.mutate(mk, { onSuccess: () => setMk('') })}>
              Добавить
            </Button>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <Field label="Марка">
              <Select value={md.makeId} onChange={(e) => setMd({ ...md, makeId: e.target.value })}>
                <option value="">—</option>
                {makes?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Модель">
              <Input value={md.name} onChange={(e) => setMd({ ...md, name: e.target.value })} />
            </Field>
            <Button variant="outline" disabled={!md.makeId || !md.name} onClick={() => addModel.mutate(md, { onSuccess: () => setMd({ ...md, name: '' }) })}>
              Добавить модель
            </Button>
          </div>
          <p className="text-ink-soft">{makes?.map((m) => m.name).join(', ')}</p>
        </Panel>
      )}
      <Dialog open={!!cat} onClose={() => setCat(null)} title="Категория">
        {cat && (
          <div className="flex flex-col gap-3">
            <Field label="Slug (латиница)">
              <Input value={cat.slug ?? ''} onChange={(e) => setCat({ ...cat, slug: e.target.value })} className="code" disabled={!!cat.id} />
            </Field>
            {(['ru', 'ky', 'en'] as const).map((l) => (
              <Field key={l} label={l.toUpperCase()}>
                <Input value={cat.name?.[l] ?? ''} onChange={(e) => setCat({ ...cat, name: { ...cat.name!, [l]: e.target.value } })} />
              </Field>
            ))}
            <Select value={cat.isActive ? '1' : '0'} onChange={(e) => setCat({ ...cat, isActive: e.target.value === '1' })} aria-label="Видимость">
              <option value="1">Показывать</option>
              <option value="0">Скрыть</option>
            </Select>
            <Button variant="primary" onClick={() => saveCat.mutate({ id: cat.id, slug: cat.slug, name: cat.name, isActive: cat.isActive, sort: cat.sort }, { onSuccess: () => setCat(null) })}>
              Сохранить
            </Button>
          </div>
        )}
      </Dialog>
    </>
  );
}

// ───────────── Шаблоны уведомлений ─────────────

type Tpl = { title: string; body: string };
interface TemplatesRes {
  defaults: Record<string, { channels: string[]; ru: Tpl; ky: Tpl; en: Tpl }>;
  custom: (Tpl & { id: string; type: string; language: 'ru' | 'ky' | 'en'; channels: string[] })[];
}

export function AdminTemplates() {
  const { data } = useGet<TemplatesRes>(['templates'], '/admin/notification-templates');
  const save = useMut((b: object) => api.put('/admin/notification-templates', b), { invalidate: [['templates']], success: 'Шаблон сохранён' });
  const [edit, setEdit] = useState<{ type: string; language: 'ru' | 'ky' | 'en'; title: string; body: string; channels: string } | null>(null);
  if (!data) return null;
  const types = Object.keys(data.defaults);
  const current = (type: string, l: 'ru' | 'ky' | 'en') => data.custom.find((c) => c.type === type && c.language === l) ?? { ...data.defaults[type][l], channels: data.defaults[type].channels };

  return (
    <>
      <PageHeader title="Шаблоны уведомлений" subtitle="Переменные в фигурных скобках: {{number}}, {{status}}, {{title}}…" />
      <Panel>
        <DataTable<{ id: string }>
          rows={types.map((t) => ({ id: t }))}
          columns={[
            { key: 't', title: 'Событие', render: (r) => <span className="code">{r.id}</span> },
            { key: 'ru', title: 'Заголовок (RU)', render: (r) => current(r.id, 'ru').title },
            { key: 'c', title: 'Каналы', render: (r) => current(r.id, 'ru').channels.join(', ') },
            {
              key: 'x',
              title: '',
              render: (r) => (
                <span className="flex gap-1">
                  {(['ru', 'ky', 'en'] as const).map((l) => (
                    <Button key={l} size="sm" variant={data.custom.some((c) => c.type === r.id && c.language === l) ? 'blue' : 'outline'} onClick={() => setEdit({ type: r.id, language: l, ...current(r.id, l), channels: current(r.id, l).channels.join(',') })}>
                      {l.toUpperCase()}
                    </Button>
                  ))}
                </span>
              ),
            },
          ]}
        />
      </Panel>
      <Dialog open={!!edit} onClose={() => setEdit(null)} title={edit ? `${edit.type} · ${edit.language.toUpperCase()}` : ''}>
        {edit && (
          <div className="flex flex-col gap-3">
            <Field label="Заголовок">
              <Input value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
            </Field>
            <Field label="Текст">
              <Textarea value={edit.body} onChange={(e) => setEdit({ ...edit, body: e.target.value })} />
            </Field>
            <Field label="Каналы" hint="PUSH, TELEGRAM, SMS, EMAIL через запятую">
              <Input value={edit.channels} onChange={(e) => setEdit({ ...edit, channels: e.target.value })} />
            </Field>
            <Button
              variant="primary"
              onClick={() =>
                save.mutate(
                  { type: edit.type, language: edit.language, title: edit.title, body: edit.body, channels: edit.channels.split(',').map((s) => s.trim()).filter(Boolean) },
                  { onSuccess: () => setEdit(null) },
                )
              }
            >
              Сохранить
            </Button>
          </div>
        )}
      </Dialog>
    </>
  );
}

// ───────────── Настройки ─────────────

const SETTINGS: Record<string, string> = {
  'chat.violations.warnAt': 'Нарушений до предупреждения',
  'chat.violations.restrictAt': 'Нарушений до ограничения чата',
  'chat.violations.restrictHours': 'Ограничение чата, часов',
  'chat.violations.blockAt': 'Нарушений до автоблокировки',
  'requests.ttlDays': 'Срок жизни запроса, дней',
  'requests.maxPerDay': 'Запросов в сутки на клиента',
  'offers.maxPerDay': 'Предложений в сутки на продавца',
  'orders.paymentTimeoutHours': 'Отмена неоплаченного заказа, часов',
  'orders.autoCompleteDays': 'Автозавершение после доставки, дней',
  'orders.returnWindowDays': 'Окно возврата, дней',
  'payouts.minAmount': 'Минимальная выплата, сом',
  'logistics.courierFee': 'Курьерская доставка по городу, сом',
};

export function AdminSettings() {
  const { data } = useGet<Record<string, number>>(['settings'], '/admin/settings');
  const save = useMut((b: { key: string; value: number }) => api.patch('/admin/settings', b), { invalidate: [['settings']], success: 'Настройка сохранена' });
  const [vals, setVals] = useState<Record<string, string>>({});
  useEffect(() => {
    if (data) setVals(Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])));
  }, [data]);
  return (
    <>
      <PageHeader title="Настройки" subtitle="Меняются без деплоя, применяются в течение 30 секунд" />
      <Panel className="max-w-2xl">
        <ul className="divide-y divide-steel-light">
          {Object.entries(SETTINGS).map(([k, label]) => (
            <li key={k} className="flex items-center justify-between gap-3 py-2.5">
              <span>{label}</span>
              <span className="flex gap-2">
                <Input type="number" value={vals[k] ?? ''} onChange={(e) => setVals({ ...vals, [k]: e.target.value })} className="h-9 w-28" aria-label={label} />
                <Button size="sm" variant="outline" disabled={String(data?.[k]) === vals[k]} onClick={() => save.mutate({ key: k, value: Number(vals[k]) })}>
                  Сохранить
                </Button>
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}

// ───────────── Аудит ─────────────

export function AdminAudit() {
  const [q, setQ] = useState({ entityType: '', entityId: '', page: 1 });
  const { data, isLoading } = useGet<Paginated<AuditLog>>(['audit', q], '/admin/audit', { ...q, limit: 50 });
  return (
    <>
      <PageHeader title="Аудит-лог" subtitle="Все действия персонала и системы с деньгами и пользователями" />
      <div className="mb-4 grid gap-2 sm:grid-cols-2">
        <Input placeholder="Тип: order, user, commission, dispute…" value={q.entityType} onChange={(e) => setQ({ ...q, entityType: e.target.value.trim(), page: 1 })} />
        <Input placeholder="ID объекта" value={q.entityId} onChange={(e) => setQ({ ...q, entityId: e.target.value.trim(), page: 1 })} className="code" />
      </div>
      <Panel>
        <DataTable<AuditLog>
          loading={isLoading}
          rows={data?.items}
          columns={[
            { key: 'd', title: 'Когда', render: (a) => dateTime(a.createdAt) },
            { key: 'a', title: 'Действие', render: (a) => <span className="code text-[13px]">{a.action}</span> },
            { key: 'e', title: 'Объект', render: (a) => `${a.entityType} ${a.entityId?.slice(0, 8) ?? ''}` },
            { key: 'u', title: 'Кто', render: (a) => (a.actorId ? <span className="code text-[13px]">{a.actorId.slice(0, 8)}</span> : 'система') },
            { key: 'p', title: 'Данные', render: (a) => <span className="code line-clamp-2 text-[12px] text-ink-soft">{a.payload ? JSON.stringify(a.payload) : ''}</span> },
          ]}
        />
        {data && <Pager page={q.page} total={data.total} limit={data.limit} onPage={(page) => setQ({ ...q, page })} />}
      </Panel>
    </>
  );
}
