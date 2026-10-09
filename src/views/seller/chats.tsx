'use client';

import { useTranslations } from 'next-intl';
import { PageHeader } from '@/shared/ui';
import { ChatThread } from '../client/chat';
import { ChatList } from '../client/chats';

export function SellerChats() {
  const t = useTranslations('chat');
  return (
    <div className="max-w-2xl">
      <PageHeader title={t('title')} />
      <ChatList base="/seller/chats" />
    </div>
  );
}

export function SellerChat() {
  return <ChatThread backHref="/seller/chats" />;
}
