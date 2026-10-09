'use client';

import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Role, User } from '@/shared/api/types';

interface SessionState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  setTokens: (access: string, refresh: string) => void;
  setUser: (u: User | null) => void;
  logout: () => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setUser: (user) => set({ user }),
      logout: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    {
      name: 'tetik-session',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ accessToken: s.accessToken, refreshToken: s.refreshToken, user: s.user }),
    },
  ),
);

export const hasRole = (u: User | null | undefined, ...roles: Role[]) =>
  !!u && (u.roles.includes('ADMIN') || roles.some((r) => u.roles.includes(r)));

/** true после чтения сессии из localStorage (и после первого рендера — без hydration mismatch) */
export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => {
    setH(useSession.persist.hasHydrated());
    return useSession.persist.onFinishHydration(() => setH(true));
  }, []);
  return h;
}
