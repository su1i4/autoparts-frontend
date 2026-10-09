import { Loader2, Star } from 'lucide-react';
import { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

export type Tone = 'neutral' | 'blue' | 'amber' | 'ok' | 'danger';
const tones: Record<Tone, string> = {
  neutral: 'bg-steel-light text-ink-soft',
  blue: 'bg-blue-tint text-blue',
  amber: 'bg-amber-tint text-[#7a5a00]',
  ok: 'bg-ok-tint text-ok',
  danger: 'bg-danger-tint text-danger',
};

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[13px] font-medium whitespace-nowrap', tones[tone], className)}>
      {children}
    </span>
  );
}

/** Основной контейнер секции. Не «карточка на всё» — используется для логических блоков страницы. */
export function Panel({ children, className, as: Tag = 'section' }: { children: ReactNode; className?: string; as?: 'section' | 'div' | 'article' }) {
  return <Tag className={cn('rounded-xl border border-steel-light bg-surface p-4 sm:p-5', className)}>{children}</Tag>;
}

export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[22px] font-semibold sm:text-[26px]">{title}</h1>
        {subtitle && <p className="mt-1 text-ink-soft">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('size-5 animate-spin text-ink-mute', className)} aria-label="Загрузка" />;
}

export function Loading() {
  return (
    <div className="flex justify-center py-16">
      <Spinner className="size-6" />
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-steel-light', className)} />;
}

export function Empty({ title, text, action, icon }: { title: string; text?: ReactNode; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-4 py-12 text-center">
      {icon && <div className="mb-3 text-ink-mute">{icon}</div>}
      <p className="font-display text-lg font-medium">{title}</p>
      {text && <p className="mt-1 max-w-md text-ink-soft">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} из 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} style={{ width: size, height: size }} className={i <= Math.round(value) ? 'fill-amber text-amber' : 'text-steel'} />
      ))}
    </span>
  );
}

export function KeyValue({ items, className }: { items: [ReactNode, ReactNode][]; className?: string }) {
  return (
    <dl className={cn('grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[15px]', className)}>
      {items.map(([k, v], i) => (
        <div key={i} className="contents">
          <dt className="text-ink-mute">{k}</dt>
          <dd className="min-w-0 text-right break-words">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Photo({ src, alt = '', className }: { src?: string | null; alt?: string; className?: string }) {
  if (!src) return <div className={cn('bg-steel-light', className)} aria-hidden />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" className={cn('object-cover', className)} />;
}

export function ErrorBox({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-danger/30 bg-danger-tint px-3 py-2 text-sm text-danger">{children}</div>;
}

export function Note({ children, tone = 'blue' }: { children: ReactNode; tone?: 'blue' | 'amber' }) {
  return (
    <div className={cn('rounded-lg px-3 py-2.5 text-sm', tone === 'blue' ? 'bg-blue-tint text-blue-dark' : 'bg-amber-tint text-[#5e4600]')}>
      {children}
    </div>
  );
}
