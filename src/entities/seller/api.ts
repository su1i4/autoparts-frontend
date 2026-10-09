'use client';

import { api } from '@/shared/api/http';
import { useGet, useMut } from '@/shared/api/hooks';
import type { Balance, LedgerEntry, Paginated, Payout, Review, Seller, SellerStats, Store } from '@/shared/api/types';

export const useMySeller = (enabled = true) => useGet<Seller>(['my-seller'], enabled ? '/sellers/me' : null, undefined, { retry: false });
export const useApplySeller = () => useMut((b: Record<string, unknown>) => api.post<Seller>('/sellers/apply', b), { invalidate: [['me'], ['my-seller']] });
export const useUpdateSeller = () => useMut((b: Record<string, unknown>) => api.patch<Seller>('/sellers/me', b), { invalidate: [['my-seller'], ['balance']] });
export const useAddSellerDoc = () => useMut((b: { type: string; url: string }) => api.post('/sellers/me/documents', b), { invalidate: [['my-seller']] });
export const useSellerStats = () => useGet<SellerStats>(['seller-stats'], '/sellers/me/stats');
export const useMyStores = () => useGet<Store[]>(['my-stores'], '/sellers/me/stores');
export const useSaveStore = () =>
  useMut(({ id, ...b }: Record<string, unknown> & { id?: string }) => (id ? api.patch<Store>(`/sellers/me/stores/${id}`, b) : api.post<Store>('/sellers/me/stores', b)), {
    invalidate: [['my-stores'], ['my-seller']],
  });

export const useBalance = () => useGet<Balance>(['balance'], '/seller/balance');
export const useBalanceHistory = (page = 1) => useGet<Paginated<LedgerEntry>>(['balance-history', page], '/seller/balance/history', { page, limit: 30 });
export const usePayouts = () => useGet<Paginated<Payout>>(['payouts'], '/seller/payouts', { limit: 30 });
export const useRequestPayout = () => useMut((amount: number) => api.post<Payout>('/seller/payouts', { amount }), { invalidate: [['balance'], ['payouts'], ['balance-history']] });

export const usePublicSeller = (id?: string) => useGet<Seller>(['public-seller', id], id ? `/sellers/${id}` : null);
export const useSellerReviews = (id?: string) => useGet<Paginated<Review>>(['reviews', id], id ? `/sellers/${id}/reviews` : null, { limit: 30 });
export const useReplyReview = () => useMut(({ id, text }: { id: string; text: string }) => api.post(`/reviews/${id}/reply`, { text }), { invalidate: [['reviews']] });
