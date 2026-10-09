import Link from 'next/link';
import { APP_NAME } from '@/shared/config/env';

/** Знак — шестигранная гайка: деталь, которую узнаёт любой водитель */
export function Logo({ href = '/', suffix }: { href?: string; suffix?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2" aria-label={APP_NAME}>
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden>
        <path d="M16 2.5 27.7 9.25v13.5L16 29.5 4.3 22.75V9.25Z" fill="#234e8c" />
        <circle cx="16" cy="16" r="5.2" fill="#f2b705" />
        <circle cx="16" cy="16" r="2.4" fill="#234e8c" />
      </svg>
      <span className="font-display text-[19px] font-bold tracking-tight">{APP_NAME}</span>
      {suffix && <span className="ml-1 rounded-md bg-ink px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap text-white">{suffix}</span>}
    </Link>
  );
}
