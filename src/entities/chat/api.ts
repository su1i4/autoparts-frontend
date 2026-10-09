'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { api } from '@/shared/api/http';
import { useGet, useMut } from '@/shared/api/hooks';
import type { AppNotification, Chat, Message, Paginated } from '@/shared/api/types';
import { WS_URL } from '@/shared/config/env';
import { useSession } from '../session/store';

export const useChats = () => useGet<Paginated<Chat>>(['chats'], '/chats', { limit: 50 }, { refetchInterval: 30_000 });
export const useChat = (id?: string) => useGet<Chat>(['chat', id], id ? `/chats/${id}` : null);
export const useMessages = (id?: string) => useGet<Message[]>(['messages', id], id ? `/chats/${id}/messages` : null, { limit: 100 });

export const openChat = (body: { requestId: string; sellerId?: string }) => api.post<Chat>('/chats', body);
export const useSendMessage = (chatId: string) =>
  useMut((body: { text?: string; photos?: string[] }) => api.post<Message>(`/chats/${chatId}/messages`, body), {
    invalidate: [['messages', chatId], ['chats']],
    silentError: true,
  });
export const checkText = (text: string) => api.post<{ blocked: boolean; kinds: string[] }>('/chats/check', { text });
export const markRead = (id: string) => api.post(`/chats/${id}/read`);

// ── realtime ──
let socket: Socket | null = null;
let socketToken: string | null = null;

function getSocket(token: string) {
  if (socket && socketToken === token) return socket;
  socket?.disconnect();
  socketToken = token;
  socket = io(`${WS_URL}/chat`, { auth: { token }, transports: ['websocket'] });
  return socket;
}

/** Подписка на события сокета: новые сообщения, уведомления, статусы заказов → инвалидация кэша */
export function useRealtime(onNotification?: (n: AppNotification) => void) {
  const token = useSession((s) => s.accessToken);
  const qc = useQueryClient();
  const cb = useRef(onNotification);
  cb.current = onNotification;

  useEffect(() => {
    if (!token) return;
    const s = getSocket(token);
    const onMessage = ({ chatId }: { chatId: string }) => {
      qc.invalidateQueries({ queryKey: ['messages', chatId] });
      qc.invalidateQueries({ queryKey: ['chats'] });
    };
    const onNotif = (n: AppNotification) => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      cb.current?.(n);
    };
    const onOrder = () => {
      qc.invalidateQueries({ queryKey: ['order'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['seller-orders'] });
    };
    const onOffer = ({ requestId }: { requestId: string }) => {
      qc.invalidateQueries({ queryKey: ['offers', requestId] });
      qc.invalidateQueries({ queryKey: ['request', requestId] });
    };
    s.on('message:new', onMessage);
    s.on('notification:new', onNotif);
    s.on('order:status', onOrder);
    s.on('offer:new', onOffer);
    return () => {
      s.off('message:new', onMessage);
      s.off('notification:new', onNotif);
      s.off('order:status', onOrder);
      s.off('offer:new', onOffer);
    };
  }, [token, qc]);
}

export function useJoinChat(chatId?: string) {
  const token = useSession((s) => s.accessToken);
  useEffect(() => {
    if (!token || !chatId) return;
    const s = getSocket(token);
    const join = () => s.emit('chat:join', { chatId });
    join();
    s.on('connect', join);
    return () => {
      s.off('connect', join);
      s.emit('chat:leave', { chatId });
    };
  }, [token, chatId]);
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
  socketToken = null;
}
