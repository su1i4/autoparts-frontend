'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useSession } from '@/entities/session/store';
import { api } from '@/shared/api/http';
import { LOCALES, type Locale } from '@/shared/config/env';
import { cn } from '@/shared/lib/cn';

const LABEL: Record<Locale, string> = { ru: 'Рус', ky: 'Кыр', en: 'Eng' };

export function setLocaleCookie(l: Locale) {
  document.cookie = `locale=${l}; path=/; max-age=31536000; samesite=lax`;
}

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const token = useSession((s) => s.accessToken);

  const change = (l: Locale) => {
    setLocaleCookie(l);
    if (token) void api.patch('/users/me', { language: l }).catch(() => undefined);
    router.refresh();
  };

  return (
    <div className={cn('inline-flex rounded-lg border border-steel p-0.5 text-[13px]', className)} role="group" aria-label="Язык">
      {LOCALES.map((l) => (
        <button
          key={l}
          onClick={() => change(l)}
          aria-pressed={l === locale}
          className={cn('rounded-md px-2 py-1', l === locale ? 'bg-ink text-white' : 'text-ink-soft hover:text-ink')}
        >
          {LABEL[l]}
        </button>
      ))}
    </div>
  );
}
