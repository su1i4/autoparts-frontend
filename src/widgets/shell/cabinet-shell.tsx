'use client';

import { LucideIcon, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { Logo } from './logo';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  badge?: number;
}

/** Каркас кабинетов (продавец, склад, админка): боковое меню, на мобилке — выезжающее */
export function CabinetShell({
  items,
  title,
  footer,
  children,
}: {
  items: NavItem[];
  title: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const nav = (
    <nav className="flex flex-col gap-0.5" aria-label={title}>
      {items.map(({ href, label, icon: Icon, exact, badge }) => {
        const active = exact ? path === href : path === href || path.startsWith(href + '/');
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={cn(
              'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[15px]',
              active ? 'bg-ink text-white' : 'text-ink-soft hover:bg-steel-light hover:text-ink',
            )}
          >
            <Icon className="size-4.5 shrink-0" />
            <span className="truncate">{label}</span>
            {!!badge && <span className="ml-auto rounded-full bg-amber px-1.5 text-[12px] font-semibold text-ink">{badge}</span>}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="hidden border-r border-steel-light bg-surface lg:flex lg:flex-col">
        <div className="flex h-16 items-center px-4">
          <Logo suffix={title} />
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-4">{nav}</div>
        {footer && <div className="border-t border-steel-light p-3">{footer}</div>}
      </aside>
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-steel-light bg-surface px-4 lg:hidden">
        <Logo suffix={title} />
        <button onClick={() => setOpen(true)} className="rounded-lg p-2" aria-label="Меню">
          <Menu className="size-5" />
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-surface p-3">
            <div className="mb-3 flex items-center justify-between px-1">
              <Logo suffix={title} />
              <button onClick={() => setOpen(false)} className="rounded-lg p-2" aria-label="Закрыть меню">
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{nav}</div>
            {footer && <div className="border-t border-steel-light pt-3">{footer}</div>}
          </div>
        </div>
      )}
      <main className="min-w-0 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">{children}</main>
    </div>
  );
}
