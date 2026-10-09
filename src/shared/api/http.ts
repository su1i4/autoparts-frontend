'use client';

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useSession } from '@/entities/session/store';
import { API_URL } from '@/shared/config/env';

export const http = axios.create({ baseURL: API_URL, timeout: 30_000 });

http.interceptors.request.use((config) => {
  const token = useSession.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── refresh с очередью: параллельные 401 ждут один refresh ──
let refreshing: Promise<string | null> | null = null;

async function refreshTokens(): Promise<string | null> {
  const { refreshToken, setTokens, logout } = useSession.getState();
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
    setTokens(data.accessToken, data.refreshToken);
    return data.accessToken as string;
  } catch {
    logout();
    return null;
  }
}

http.interceptors.response.use(
  (r) => r,
  async (error: AxiosError<{ code?: string }>) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && original && !original._retry && !original.url?.includes('/auth/')) {
      original._retry = true;
      refreshing ??= refreshTokens().finally(() => (refreshing = null));
      const token = await refreshing;
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return http(original);
      }
    }
    if (error.response?.status === 403 && error.response.data?.code === 'USER_BLOCKED' && typeof window !== 'undefined') {
      if (!window.location.pathname.startsWith('/blocked')) window.location.href = '/blocked';
    }
    return Promise.reject(error);
  },
);

/** GET с распаковкой data */
export const api = {
  get: <T>(url: string, params?: object) => http.get<T>(url, { params }).then((r) => r.data),
  post: <T>(url: string, body?: unknown) => http.post<T>(url, body).then((r) => r.data),
  patch: <T>(url: string, body?: unknown) => http.patch<T>(url, body).then((r) => r.data),
  put: <T>(url: string, body?: unknown) => http.put<T>(url, body).then((r) => r.data),
  del: <T>(url: string) => http.delete<T>(url).then((r) => r.data),
  upload: <T>(url: string, form: FormData) => http.post<T>(url, form).then((r) => r.data),
};

/** Убирает пустые строки/undefined из query-параметров */
export const clean = <T extends object>(o: T) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== '' && v !== undefined && v !== null)) as Partial<T>;
