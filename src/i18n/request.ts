import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { LOCALES, type Locale } from '@/shared/config/env';

type Messages = Record<string, unknown>;

/** Недостающие ключи ky/en берутся из ru */
function merge(base: Messages, over: Messages): Messages {
  const out: Messages = { ...base };
  for (const [k, v] of Object.entries(over)) {
    out[k] = v && typeof v === 'object' && !Array.isArray(v) ? merge((base[k] as Messages) ?? {}, v as Messages) : v;
  }
  return out;
}

export default getRequestConfig(async () => {
  const store = await cookies();
  const raw = store.get('locale')?.value as Locale | undefined;
  const locale: Locale = raw && LOCALES.includes(raw) ? raw : 'ru';
  const ru = (await import('../messages/ru.json')).default as Messages;
  const messages = locale === 'ru' ? ru : merge(ru, (await import(`../messages/${locale}.json`)).default as Messages);
  return { locale, messages, timeZone: 'Asia/Bishkek' };
});
