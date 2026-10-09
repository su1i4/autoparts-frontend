'use client';

import type { Currency } from '@/shared/api/types';
import { cn } from '@/shared/lib/cn';
import { money } from '@/shared/lib/format';
import { useRates } from '../api';

/** «≈ 11 495 сом» под ценой в валюте — итог заказа всё равно считается в сомах по курсу на момент заказа */
export function ApproxKgs({ price, currency, className }: { price: number; currency: Currency | string; className?: string }) {
  const { data: rates } = useRates();
  if (currency === 'KGS' || !rates) return null;
  const rate = rates[currency as Currency];
  if (!rate) return null;
  return <span className={cn('text-[13px] text-ink-mute num', className)}>≈ {money(Math.round(price * rate), 'KGS')}</span>;
}
