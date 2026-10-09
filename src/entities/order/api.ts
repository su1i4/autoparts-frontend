'use client';

import { api } from '@/shared/api/http';
import { useGet, useMut } from '@/shared/api/hooks';
import type { Order, OrderStatus, Paginated, PayInit, PaymentMethod, PublicTracking, Quote, Shipment } from '@/shared/api/types';

export const useMyOrders = (q: { page?: number; status?: OrderStatus | '' } = {}) =>
  useGet<Paginated<Order>>(['orders', 'my'], '/orders/my', { limit: 20, ...q });

export const useOrder = (id?: string) => useGet<Order>(['order', id], id ? `/orders/${id}` : null);
export const useTracking = (id?: string) => useGet<Shipment[]>(['tracking', id], id ? `/orders/${id}/tracking` : null);

export const getQuote = (body: Record<string, unknown>) => api.post<Quote>('/orders/quote', body);

export const useCreateOrder = () =>
  useMut(({ partId, ...body }: Record<string, unknown>) => api.post<Order>(partId ? '/orders/from-part' : '/orders', partId ? { partId, ...body } : body), {
    invalidate: [['orders'], ['request'], ['offers'], ['requests']],
  });

export const usePay = () =>
  useMut(({ id, method }: { id: string; method: PaymentMethod }) => api.post<PayInit>(`/orders/${id}/pay`, { method }), { invalidate: [['order']] });

export const useMockConfirm = () =>
  useMut((paymentId: string) => api.post(`/payments/${paymentId}/mock-confirm`), { invalidate: [['order'], ['orders'], ['tracking']] });

const inv = [['order'], ['orders'], ['tracking'], ['seller-orders']];
export const useCancelOrder = () => useMut(({ id, reason }: { id: string; reason?: string }) => api.post(`/orders/${id}/cancel`, { reason }), { invalidate: inv });
export const useConfirmReceipt = () => useMut((id: string) => api.post(`/orders/${id}/confirm-receipt`), { invalidate: inv });

export const usePublicTracking = (num?: string) =>
  useGet<PublicTracking>(['public-tracking', num], num ? `/tracking/${encodeURIComponent(num)}` : null, undefined, { retry: false });

// ── продавец ──
export const useSellerOrders = (q: { page?: number; status?: OrderStatus | '' }) =>
  useGet<Paginated<Order>>(['seller-orders'], '/seller/orders', { limit: 20, ...q });
export const useSellerOrder = (id?: string) => useGet<Order>(['order', id], id ? `/seller/orders/${id}` : null);
export const useSellerConfirm = () => useMut((id: string) => api.post(`/seller/orders/${id}/confirm`), { invalidate: inv });
export const useSellerShip = () =>
  useMut(({ id, ...b }: { id: string; carrier?: string; externalTrackingNumber?: string; note?: string }) => api.post(`/seller/orders/${id}/ship`, b), { invalidate: inv });
export const useSellerDecline = () =>
  useMut(({ id, reason }: { id: string; reason: string }) => api.post(`/seller/orders/${id}/decline`, { reason }), { invalidate: inv });
