import { AxiosError } from 'axios';

export interface ApiErrorBody {
  statusCode?: number;
  message?: string | string[];
  code?: string;
  [k: string]: unknown;
}

/** Текст ошибки бэкенда для тоста */
export function errorMessage(e: unknown, fallback = 'Что-то пошло не так. Повторите попытку.'): string {
  const ax = e as AxiosError<ApiErrorBody>;
  const status = ax?.response?.status;
  const m = ax?.response?.data?.message;
  // собственные тексты бэкенда для 429 (OTP «через минуту», лимиты запросов) — показываем как есть
  if (status === 429 && (typeof m !== 'string' || m.startsWith('ThrottlerException'))) {
    return 'Слишком много попыток. Подождите минуту и повторите.';
  }
  if (status && status >= 500) return fallback;
  if (Array.isArray(m)) return m.join('\n');
  if (typeof m === 'string') return m;
  if (ax?.code === 'ERR_NETWORK') return 'Нет связи с сервером. Проверьте интернет.';
  return fallback;
}

export function errorBody(e: unknown): ApiErrorBody | undefined {
  return (e as AxiosError<ApiErrorBody>)?.response?.data;
}
