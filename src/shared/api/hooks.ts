'use client';

import { QueryKey, useMutation, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { errorMessage } from '@/shared/lib/errors';
import { api, clean } from './http';

/** GET-запрос. url = null → запрос выключен */
export function useGet<T>(
  key: QueryKey,
  url: string | null,
  params?: object,
  opts?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>,
) {
  return useQuery<T>({
    queryKey: params ? [...key, clean(params)] : key,
    queryFn: () => api.get<T>(url!, params ? clean(params) : undefined),
    enabled: !!url && (opts?.enabled ?? true),
    ...opts,
  });
}

/** Мутация с инвалидацией кэша и тостами */
export function useMut<V, R = unknown>(
  fn: (v: V) => Promise<R>,
  o: { invalidate?: QueryKey[]; success?: string | ((r: R) => string); silentError?: boolean; onSuccess?: (r: R, v: V) => void } = {},
) {
  const qc = useQueryClient();
  return useMutation<R, unknown, V>({
    mutationFn: fn,
    onSuccess: async (r, v) => {
      await Promise.all((o.invalidate ?? []).map((k) => qc.invalidateQueries({ queryKey: k })));
      if (o.success) toast.success(typeof o.success === 'function' ? o.success(r) : o.success);
      o.onSuccess?.(r, v);
    },
    onError: (e) => {
      if (!o.silentError) toast.error(errorMessage(e));
    },
  });
}
