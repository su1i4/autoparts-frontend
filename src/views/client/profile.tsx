'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { disconnectSocket } from '@/entities/chat/api';
import { hasRole, useSession } from '@/entities/session/store';
import { useMe, useUpdateMe } from '@/entities/user/api';
import { LanguageSwitcher } from '@/features/language/switcher';
import { api } from '@/shared/api/http';
import { phone } from '@/shared/lib/format';
import { Button, buttonClass, Field, Input, Loading, PageHeader, Panel } from '@/shared/ui';
import { AuthGuard } from '@/widgets/guard/auth-guard';

function Profile() {
  const t = useTranslations('profile');
  const tc = useTranslations('common');
  const tn = useTranslations('nav');
  const router = useRouter();
  const { data: me, isLoading } = useMe();
  const update = useUpdateMe();
  const { refreshToken, logout } = useSession();
  const [f, setF] = useState({ name: '', email: '', city: '', telegramChatId: '' });

  useEffect(() => {
    if (me) setF({ name: me.name ?? '', email: me.email ?? '', city: me.city ?? '', telegramChatId: me.telegramChatId ?? '' });
  }, [me]);

  if (isLoading || !me) return <Loading />;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <PageHeader title={t('title')} subtitle={phone(me.phone)} />
      <Panel>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            update.mutate(
              { name: f.name || undefined, email: f.email || undefined, city: f.city || undefined, telegramChatId: f.telegramChatId || undefined } as never,
              { onSuccess: () => toast.success(tc('saved')) },
            );
          }}
        >
          <Field label={t('name')}>
            <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" />
          </Field>
          <Field label={t('city')}>
            <Input value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} />
          </Field>
          <Field label={t('email')}>
            <Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" />
          </Field>
          <Field label={t('telegram')} hint={t('telegramHint')}>
            <Input value={f.telegramChatId} onChange={(e) => setF({ ...f, telegramChatId: e.target.value })} inputMode="numeric" />
          </Field>
          <div className="flex items-center justify-between gap-3 sm:col-span-2">
            <div className="flex items-center gap-3">
              <span className="text-sm text-ink-soft">{t('language')}</span>
              <LanguageSwitcher />
            </div>
            <Button variant="blue" loading={update.isPending}>
              {tc('save')}
            </Button>
          </div>
        </form>
      </Panel>

      <nav className="flex flex-col divide-y divide-steel-light rounded-xl border border-steel-light bg-surface" aria-label={t('title')}>
        <Link href="/garage" className="px-4 py-3 hover:bg-paper">
          {tn('garage')}
        </Link>
        <Link href="/notifications" className="px-4 py-3 hover:bg-paper">
          {tn('notifications')}
        </Link>
        <Link href="/track" className="px-4 py-3 hover:bg-paper">
          {tn('track')}
        </Link>
        {hasRole(me, 'LOGISTICS') && (
          <Link href="/logistics" className="px-4 py-3 hover:bg-paper">
            {tn('logistics')}
          </Link>
        )}
        {hasRole(me, 'SUPPORT') && (
          <Link href="/admin" className="px-4 py-3 hover:bg-paper">
            {tn('admin')}
          </Link>
        )}
      </nav>

      <Panel>
        <h2 className="text-[17px] font-semibold">{t('seller')}</h2>
        <p className="mt-1 text-ink-soft">{t('sellerText')}</p>
        <Link href={me.seller ? '/seller' : '/seller/apply'} className={buttonClass('outline', 'md', 'mt-3')}>
          {me.seller ? tn('sellerCabinet') : tn('becomeSeller')}
        </Link>
      </Panel>

      <Button
        variant="ghost"
        className="self-start"
        onClick={async () => {
          if (refreshToken) await api.post('/auth/logout', { refreshToken }).catch(() => undefined);
          disconnectSocket();
          logout();
          router.replace('/');
        }}
      >
        {tc('logout')}
      </Button>
    </div>
  );
}

export default function ProfileView() {
  return (
    <AuthGuard>
      <Profile />
    </AuthGuard>
  );
}
