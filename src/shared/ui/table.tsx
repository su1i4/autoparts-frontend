'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { Empty, Loading } from './misc';

export interface Column<T> {
  key: string;
  title: ReactNode;
  render: (row: T) => ReactNode;
  className?: string;
}

/** Таблица для кабинетов: на мобилке превращается в список строк «ключ — значение» */
export function DataTable<T extends { id: string }>({
  rows,
  columns,
  loading,
  empty = 'Пока пусто',
  onRowClick,
}: {
  rows?: T[];
  columns: Column<T>[];
  loading?: boolean;
  empty?: string;
  onRowClick?: (row: T) => void;
}) {
  if (loading) return <Loading />;
  if (!rows?.length) return <Empty title={empty} />;
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-[14px]">
          <thead>
            <tr className="border-b border-steel-light text-ink-mute">
              {columns.map((c) => (
                <th key={c.key} className={cn('px-3 py-2 font-medium', c.className)}>
                  {c.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                onClick={onRowClick ? () => onRowClick(r) : undefined}
                className={cn('border-b border-steel-light/70 align-top last:border-0', onRowClick && 'cursor-pointer hover:bg-paper')}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cn('px-3 py-2.5', c.className)}>
                    {c.render(r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="divide-y divide-steel-light md:hidden">
        {rows.map((r) => (
          <li key={r.id} onClick={onRowClick ? () => onRowClick(r) : undefined} className={cn('py-3', onRowClick && 'cursor-pointer')}>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[14px]">
              {columns.map((c) => (
                <div key={c.key} className="contents">
                  <dt className="text-ink-mute">{c.title}</dt>
                  <dd className="min-w-0 text-right break-words">{c.render(r)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}

export function Pager({ page, total, limit, onPage }: { page: number; total: number; limit: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-ink-soft">
      <span>
        {total} всего · стр. {page} из {pages}
      </span>
      <div className="flex gap-1">
        <button className="rounded-lg border border-steel p-1.5 disabled:opacity-40" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Назад">
          <ChevronLeft className="size-4" />
        </button>
        <button className="rounded-lg border border-steel p-1.5 disabled:opacity-40" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Вперёд">
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

/** Вкладки-переключатель (сегменты) */
export function Segmented<V extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: V;
  onChange: (v: V) => void;
  options: { value: V; label: ReactNode }[];
  className?: string;
}) {
  return (
    <div role="radiogroup" className={cn('inline-flex flex-wrap gap-1 rounded-xl bg-steel-light p-1', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-lg px-3 py-1.5 text-sm transition-colors',
            o.value === value ? 'bg-surface font-medium text-ink shadow-[0_1px_0_rgb(24_33_43/0.08)]' : 'text-ink-soft hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
