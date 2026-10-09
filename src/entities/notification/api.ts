'use client';

import { api } from '@/shared/api/http';
import { useGet, useMut } from '@/shared/api/hooks';
import type { AppNotification, Paginated } from '@/shared/api/types';
import { useSession } from '../session/store';

export const useNotifications = (unread?: boolean) =>
  useGet<Paginated<AppNotification>>(['notifications', 'list'], '/notifications', { limit: 50, unread });

export function useUnreadCount() {
  const token = useSession((s) => s.accessToken);
  return useGet<{ count: number }>(['notifications', 'count'], token ? '/notifications/unread-count' : null, undefined, { refetchInterval: 60_000 });
}

export const useReadAll = () => useMut(() => api.post('/notifications/read-all'), { invalidate: [['notifications']] });
export const useReadOne = () => useMut((id: string) => api.post(`/notifications/${id}/read`), { invalidate: [['notifications']], silentError: true });

/** Куда ведёт уведомление */
export function notificationHref(n: AppNotification, isSeller: boolean): string | null {
  const d = n.data ?? {};
  if (d.chatId) return `/chats/${d.chatId}`;
  if (d.orderId) return isSeller && n.type === 'ORDER_PAID_SELLER' ? `/seller/orders/${d.orderId}` : `/orders/${d.orderId}`;
  if (n.type === 'REQUEST_NEW' && d.requestId) return `/seller/feed/${d.requestId}`;
  if (d.requestId) return `/requests/${d.requestId}`;
  return null;
}
