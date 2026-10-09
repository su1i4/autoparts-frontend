'use client';

import { Home, MessageCircle, Package, Plus, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/lib/cn';

/** Нижняя навигация на телефоне: главное действие — новый запрос — по центру */
export function BottomNav() {
  const t = useTranslations('nav');
  const path = usePathname();
  const items = [
    { href: '/', icon: Home, label: t('home'), exact: true },
    { href: '/catalog', icon: Search, label: t('catalog') },
    { href: '/requests/new', icon: Plus, label: t('requestShort'), main: true },
    { href: '/orders', icon: Package, label: t('orders') },
    { href: '/chats', icon: MessageCircle, label: t('chats') },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-steel-light bg-surface pb-[env(safe-area-inset-bottom)] md:hidden" aria-label="Навигация">
      <ul className="grid grid-cols-5">
        {items.map(({ href, icon: Icon, label, exact, main }) => {
          const active = exact ? path === href : path.startsWith(href);
          return (
            <li key={href}>
              <Link href={href} className={cn('flex flex-col items-center gap-0.5 py-2 text-[11px]', active ? 'text-blue' : 'text-ink-mute')}>
                {main ? (
                  <span className="-mt-5 flex size-12 items-center justify-center rounded-2xl bg-amber text-ink shadow-[0_2px_0_#d9a400]">
                    <Icon className="size-6" />
                  </span>
                ) : (
                  <Icon className="size-5" />
                )}
                <span className="max-w-full truncate px-1">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
