'use client';

import { api } from '@/shared/api/http';
import { useGet, useMut } from '@/shared/api/hooks';
import type { Dispute, Paginated, ReturnRequest } from '@/shared/api/types';

export const useMyDisputes = () => useGet<Paginated<Dispute>>(['disputes', 'my'], '/disputes/my', { limit: 50 });
export const useDispute = (id?: string) => useGet<Dispute>(['dispute', id], id ? `/disputes/${id}` : null);
export const useOpenDispute = () =>
  useMut(({ orderId, ...b }: { orderId: string; reason: string; description: string; photos?: string[] }) => api.post<Dispute>(`/orders/${orderId}/dispute`, b), {
    invalidate: [['order'], ['disputes']],
  });
export const useEvidence = () =>
  useMut(({ id, ...b }: { id: string; text?: string; photos?: string[] }) => api.post(`/disputes/${id}/evidence`, b), { invalidate: [['dispute'], ['disputes']] });
export const useRequestReturn = () =>
  useMut(({ orderId, ...b }: { orderId: string; reason: string; description?: string; photos?: string[]; method?: string }) =>
    api.post<ReturnRequest>(`/orders/${orderId}/return`, b), { invalidate: [['order'], ['returns']] });
export const useMyReturns = () => useGet<Paginated<ReturnRequest>>(['returns', 'my'], '/returns/my', { limit: 50 });
export const useCreateReview = () =>
  useMut(({ orderId, ...b }: { orderId: string; rating: number; text?: string; photos?: string[] }) => api.post(`/orders/${orderId}/review`, b), {
    invalidate: [['order']],
  });
