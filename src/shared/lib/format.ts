const nf = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });

export const CURRENCY_SIGN: Record<string, string> = { KGS: 'сом', USD: '$', CNY: '¥', RUB: '₽' };

/** 12 500 сом · 200 ¥ */
export function money(value: number | string | null | undefined, currency = 'KGS') {
  if (value === null || value === undefined || value === '') return '—';
  const n = typeof value === 'string' ? Number(value) : value;
  const sign = CURRENCY_SIGN[currency] ?? currency;
  return currency === 'KGS' || currency === 'RUB' ? `${nf.format(n)} ${sign}` : `${nf.format(n)} ${sign}`;
}

export function dateTime(v?: string | Date | null) {
  if (!v) return '—';
  return new Date(v).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function date(v?: string | Date | null) {
  if (!v) return '—';
  return new Date(v).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** «5 мин назад», «вчера» */
export function ago(v?: string | Date | null) {
  if (!v) return '';
  const diff = (Date.now() - new Date(v).getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat('ru', { numeric: 'auto' });
  if (diff < 60) return rtf.format(-Math.round(diff), 'second');
  if (diff < 3600) return rtf.format(-Math.round(diff / 60), 'minute');
  if (diff < 86400) return rtf.format(-Math.round(diff / 3600), 'hour');
  return rtf.format(-Math.round(diff / 86400), 'day');
}

export function phone(v?: string | null) {
  if (!v) return '';
  const m = v.match(/^\+996(\d{3})(\d{3})(\d{3})$/);
  return m ? `+996 ${m[1]} ${m[2]} ${m[3]}` : v;
}
