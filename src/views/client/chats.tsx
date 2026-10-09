'use client';

import { MessageCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useChats } from '@/entities/chat/api';
import { ago } from '@/shared/lib/format';
import { Badge, Empty, Loading, PageHeader } from '@/shared/ui';
import { AuthGuard } from '@/widgets/guard/auth-guard';

export function ChatList({ base = '/chats' }: { base?: string }) {
  const t = useTranslations('chat');
  const { data, isLoading } = useChats();
  if (isLoading) return <Loading />;
  if (!data?.items.length) return <Empty icon={<MessageCircle className="size-10" />} title={t('empty')} text={t('emptyText')} />;
  return (
    <ul className="divide-y divide-steel-light rounded-xl border border-steel-light bg-surface">
      {data.items.map((c) => (
        <li key={c.id}>
          <Link href={`${base}/${c.id}`} className="flex gap-3 p-4 hover:bg-paper">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-semibold">{c.counterpartName}</span>
                {c.type === 'DISPUTE' && <Badge tone="danger">{t('dispute')}</Badge>}
              </div>
              <p className="truncate text-sm text-ink-mute">
                {c.orderNumber ? t('byOrder', { number: c.orderNumber }) : c.requestTitle ? t('byRequest', { title: c.requestTitle }) : ''}
              </p>
              {c.lastMessagePreview && <p className="mt-0.5 truncate text-ink-soft">{c.lastMessagePreview}</p>}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="text-[13px] text-ink-mute">{ago(c.lastMessageAt ?? c.createdAt)}</span>
              {!!c.unread && <span className="rounded-full bg-blue px-1.5 text-[12px] font-semibold text-white num">{c.unread}</span>}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function ChatsView() {
  const t = useTranslations('chat');
  return (
    <AuthGuard>
      <div className="mx-auto max-w-2xl">
        <PageHeader title={t('title')} />
        <ChatList />
      </div>
    </AuthGuard>
  );
}
