'use client';

import { useLocale } from 'next-intl';
import { useGet } from '@/shared/api/hooks';
import type { CarMake, CarModel, Category, Currency, Warehouse } from '@/shared/api/types';

const DAY = 24 * 3600_000;

export const useCategories = () => useGet<Category[]>(['categories'], '/reference/categories', undefined, { staleTime: DAY });
export const useMakes = () => useGet<CarMake[]>(['makes'], '/reference/makes', undefined, { staleTime: DAY });
export const useModels = (makeId?: string) =>
  useGet<CarModel[]>(['models', makeId], makeId ? `/reference/makes/${makeId}/models` : null, undefined, { staleTime: DAY });
export const usePickupPoints = (city?: string) =>
  useGet<Warehouse[]>(['pickup-points'], '/logistics/pickup-points', { city }, { staleTime: DAY });
export const useRates = () => useGet<Record<Currency, number>>(['rates'], '/reference/exchange-rates', undefined, { staleTime: 3600_000 });

/** Название категории на языке интерфейса */
export function useCategoryName() {
  const locale = useLocale() as 'ru' | 'ky' | 'en';
  const { data } = useCategories();
  return (id?: string | null, fallback = '') => {
    const c = data?.find((x) => x.id === id);
    return c ? (c.name[locale] ?? c.name.ru) : fallback;
  };
}
