'use client';

import { api } from '@/shared/api/http';
import { useGet, useMut } from '@/shared/api/hooks';
import type { Paginated, Part } from '@/shared/api/types';

export interface CatalogQuery {
  page?: number;
  q?: string;
  oem?: string;
  categoryId?: string;
  vehicleId?: string;
  make?: string;
  model?: string;
  year?: number;
  condition?: string;
  country?: string;
  sort?: string;
  sellerId?: string;
}

export const useCatalog = (q: CatalogQuery) =>
  useGet<Paginated<Part>>(['catalog'], q.vehicleId ? '/catalog/parts/for-my-car' : '/catalog/parts', { limit: 24, ...q });
export const usePart = (id?: string) => useGet<Part>(['part', id], id ? `/catalog/parts/${id}` : null);

// ── продавец ──
export const useMyParts = (page = 1) => useGet<Paginated<Part>>(['my-parts'], '/seller/parts', { page, limit: 50 });
export const useSavePart = () =>
  useMut(({ id, ...body }: Record<string, unknown> & { id?: string }) => (id ? api.patch<Part>(`/seller/parts/${id}`, body) : api.post<Part>('/seller/parts', body)), {
    invalidate: [['my-parts'], ['catalog'], ['part']],
  });
export const useDeletePart = () => useMut((id: string) => api.del(`/seller/parts/${id}`), { invalidate: [['my-parts'], ['catalog']] });
export const importParts = (storeId: string, file: File) => {
  const f = new FormData();
  f.append('storeId', storeId);
  f.append('file', file);
  return api.upload<{ total: number; imported: number; failed: number; errors: { row: number; error: string }[] }>('/seller/parts/import', f);
};
