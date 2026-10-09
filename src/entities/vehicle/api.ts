'use client';

import { api } from '@/shared/api/http';
import { useGet, useMut } from '@/shared/api/hooks';
import type { Vehicle, VinDecode } from '@/shared/api/types';

export const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/;

export const useGarage = (enabled = true) => useGet<Vehicle[]>(['garage'], enabled ? '/garage' : null);
export const decodeVin = (vin: string) => api.post<VinDecode>('/vin/decode', { vin });
export const useAddVehicle = () =>
  useMut((body: Partial<Vehicle>) => api.post<Vehicle>('/garage', body), { invalidate: [['garage']], silentError: true });
export const useDeleteVehicle = () =>
  useMut((id: string) => api.del(`/garage/${id}`), { invalidate: [['garage']] });

export const carTitle = (v: { make: string; model?: string | null; year?: number | null }) =>
  [v.make, v.model, v.year].filter(Boolean).join(' ');
