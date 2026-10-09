'use client';

import { Bell, CircleUser, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUnreadCount } from '@/entities/notification/api';
import { hasRole, useHydrated, useSession } from '@/entities/session/store';
import { LanguageSwitcher } from '@/features/language/switcher';
import { cn } from '@/shared/lib/cn';
import { buttonClass } from '@/shared/ui';
import { Logo } from './logo';

const LINKS = [
  { href: '/catalog', key: 'catalog' },
  { href: '/requests', key: 'requests' },
  { href: '/orders', key: 'orders' },
  { href: '/chats', key: 'chats' },
] as const;

export function Header() {
  const t = useTranslations('nav');
  const tc = useTranslations('common');
  const path = usePathname();
  const { accessToken, user } = useSession();
  const hydrated = useHydrated();
  const { data: unread } = useUnreadCount();

  return (
    <header className="sticky top-0 z-30 border-b border-steel-light bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Logo />
        <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Основное меню">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'rounded-lg px-3 py-2 text-[15px] text-ink-soft hover:text-ink',
                path.startsWith(l.href) && 'bg-steel-light font-medium text-ink',
              )}
            >
              {t(l.key)}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher className="hidden sm:inline-flex" />
          {hydrated && accessToken ? (
            <>
              {hasRole(user, 'SELLER') && (
                <Link href="/seller" className={buttonClass('ghost', 'sm', 'hidden lg:inline-flex')}>
                  {t('sellerCabinet')}
                </Link>
              )}
              {hasRole(user, 'LOGISTICS') && (
                <Link href="/logistics" className={buttonClass('ghost', 'sm', 'hidden lg:inline-flex')}>
                  {t('logistics')}
                </Link>
              )}
              {hasRole(user, 'SUPPORT') && (
                <Link href="/admin" className={buttonClass('ghost', 'sm', 'hidden lg:inline-flex')}>
                  {t('admin')}
                </Link>
              )}
              <Link href="/requests/new" className={buttonClass('primary', 'sm', 'hidden md:inline-flex')}>
                <Plus className="size-4" /> {t('newRequest')}
              </Link>
              <Link href="/notifications" className="relative rounded-lg p-2 text-ink-soft hover:bg-steel-light" aria-label={t('notifications')}>
                <Bell className="size-5" />
                {!!unread?.count && (
                  <span className="absolute top-1 right-1 min-w-4 rounded-full bg-danger px-1 text-center text-[10px] leading-4 font-semibold text-white">
                    {unread.count > 99 ? '99+' : unread.count}
                  </span>
                )}
              </Link>
              <Link href="/profile" className="rounded-lg p-2 text-ink-soft hover:bg-steel-light" aria-label={t('profile')}>
                <CircleUser className="size-5" />
              </Link>
            </>
          ) : (
            hydrated && (
              <Link href={`/login?next=${encodeURIComponent(path)}`} className={buttonClass('outline', 'sm')}>
                {tc('login')}
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
}
