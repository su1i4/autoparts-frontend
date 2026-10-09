'use client';

import { useEffect } from 'react';
import { api } from '@/shared/api/http';
import { useGet, useMut } from '@/shared/api/hooks';
import type { User } from '@/shared/api/types';
import { useSession } from '../session/store';

/** Профиль из API + синхронизация в сессию (роли, sellerId после заявки) */
export function useMe() {
  const token = useSession((s) => s.accessToken);
  const setUser = useSession((s) => s.setUser);
  const q = useGet<User>(['me'], token ? '/users/me' : null, undefined, { staleTime: 30_000 });
  useEffect(() => {
    if (q.data) setUser(q.data);
  }, [q.data, setUser]);
  return q;
}

export const useUpdateMe = () =>
  useMut((body: Partial<User>) => api.patch<User>('/users/me', body), { invalidate: [['me']] });
