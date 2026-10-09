'use client';

import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { setLocaleCookie } from '@/features/language/switcher';
import { PhoneLogin } from '@/features/auth/phone-login';
import { Logo } from '@/widgets/shell/logo';

export default function LoginView() {
  const t = useTranslations('auth');
  const router = useRouter();
  const next = useSearchParams().get('next');

  return (
    <div className="flex min-h-dvh flex-col items-center px-4 pt-10 sm:justify-center sm:pt-0">
      <div className="w-full max-w-sm">
        <Logo />
        <h1 className="mt-8 text-[26px] font-semibold">{t('title')}</h1>
        <p className="mt-1 mb-6 text-ink-soft">{t('lead')}</p>
        <PhoneLogin
          onDone={(u, isNew) => {
            setLocaleCookie(u.language);
            if (isNew) toast.success(t('welcome'));
            const staff = u.roles.includes('ADMIN') || u.roles.includes('SUPPORT');
            const target = next && next.startsWith('/') ? next : staff ? '/admin' : u.roles.includes('LOGISTICS') ? '/logistics' : '/';
            router.replace(target);
            router.refresh();
          }}
        />
      </div>
    </div>
  );
}
