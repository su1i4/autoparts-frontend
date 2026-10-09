'use client';

import { api } from '@/shared/api/http';
import { useGet, useMut } from '@/shared/api/hooks';
import type { Offer, Paginated, PartRequest, RequestStatus } from '@/shared/api/types';

export const useMyRequests = (q: { page?: number; status?: RequestStatus | '' } = {}) =>
  useGet<Paginated<PartRequest>>(['requests', 'my'], '/requests/my', { limit: 20, ...q });

export const useRequest = (id?: string) => useGet<PartRequest>(['request', id], id ? `/requests/${id}` : null);

export const useCreateRequest = () =>
  useMut((body: Record<string, unknown>) => api.post<PartRequest>('/requests', body), { invalidate: [['requests']] });

export const useCancelRequest = () =>
  useMut((id: string) => api.post<PartRequest>(`/requests/${id}/cancel`), { invalidate: [['requests'], ['request']] });

export const usePublishRequest = () =>
  useMut((id: string) => api.post<PartRequest>(`/requests/${id}/publish`), { invalidate: [['requests'], ['request']] });

export interface FeedQuery {
  page?: number;
  make?: string;
  categoryId?: string;
  city?: string;
  q?: string;
  matchesOnly?: boolean;
  hideAnswered?: boolean;
}
export const useFeed = (q: FeedQuery) => useGet<Paginated<PartRequest>>(['feed'], '/requests/feed', { limit: 20, ...q }, { refetchInterval: 60_000 });

// ── офферы ──

export type OfferSort = 'price' | 'delivery' | 'rating' | 'newest';

export const useOffers = (requestId?: string, sort: OfferSort = 'price') =>
  useGet<Offer[]>(['offers', requestId], requestId ? `/requests/${requestId}/offers` : null, { sort });

export const useRejectOffer = () => useMut((id: string) => api.post(`/offers/${id}/reject`), { invalidate: [['offers']] });

export const useCreateOffer = (requestId: string) =>
  useMut((body: Record<string, unknown>) => api.post<Offer>(`/requests/${requestId}/offers`, body), {
    invalidate: [['feed'], ['request', requestId], ['offers', requestId], ['seller-offers']],
  });

export const useUpdateOffer = () =>
  useMut(({ id, ...body }: { id: string } & Record<string, unknown>) => api.patch<Offer>(`/offers/${id}`, body), {
    invalidate: [['feed'], ['request'], ['offers'], ['seller-offers']],
  });

export const useWithdrawOffer = () =>
  useMut((id: string) => api.post(`/offers/${id}/withdraw`), { invalidate: [['feed'], ['request'], ['offers'], ['seller-offers']] });

export const useSellerOffers = (q: { page?: number; status?: string }) =>
  useGet<Paginated<Offer>>(['seller-offers'], '/seller/offers', { limit: 20, ...q });
