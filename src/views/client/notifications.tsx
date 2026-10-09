'use client';

import { Bell } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { notificationHref, useNotifications, useReadAll, useReadOne } from '@/entities/notification/api';
import { hasRole, useSession } from '@/entities/session/store';
import { cn } from '@/shared/lib/cn';
import { ago } from '@/shared/lib/format';
import { Button, Empty, Loading, PageHeader } from '@/shared/ui';
import { AuthGuard } from '@/widgets/guard/auth-guard';

function Notifications() {
  const t = useTranslations('notifications');
  const router = useRouter();
  const user = useSession((s) => s.user);
  const { data, isLoading } = useNotifications();
  const readAll = useReadAll();
  const readOne = useReadOne();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={t('title')}
        actions={
          !!data?.items.some((n) => !n.readAt) && (
            <Button variant="ghost" size="sm" onClick={() => readAll.mutate(undefined)}>
              {t('readAll')}
            </Button>
          )
        }
      />
      {isLoading ? (
        <Loading />
      ) : !data?.items.length ? (
        <Empty icon={<Bell className="size-10" />} title={t('empty')} />
      ) : (
        <ul className="divide-y divide-steel-light rounded-xl border border-steel-light bg-surface">
          {data.items.map((n) => {
            const href = notificationHref(n, hasRole(user, 'SELLER'));
            return (
              <li key={n.id}>
                <button
                  onClick={() => {
                    if (!n.readAt) readOne.mutate(n.id);
                    if (href) router.push(href);
                  }}
                  className={cn('flex w-full gap-3 p-4 text-left hover:bg-paper', !n.readAt && 'bg-blue-tint/40')}
                >
                  <span className={cn('mt-2 size-2 shrink-0 rounded-full', n.readAt ? 'bg-transparent' : 'bg-blue')} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{n.title}</span>
                    {n.body && <span className="block text-ink-soft">{n.body}</span>}
                    <span className="mt-0.5 block text-sm text-ink-mute">{ago(n.createdAt)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function NotificationsView() {
  return (
    <AuthGuard>
      <Notifications />
    </AuthGuard>
  );
}
