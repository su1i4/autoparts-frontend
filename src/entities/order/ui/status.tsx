'use client';

import { useTranslations } from 'next-intl';
import type { OrderStatus, ShipmentStatus } from '@/shared/api/types';
import { Badge, Tone } from '@/shared/ui';

const ORDER_TONE: Record<OrderStatus, Tone> = {
  PENDING_PAYMENT: 'amber',
  PAID: 'blue',
  CONFIRMED: 'blue',
  SHIPPED: 'blue',
  IN_TRANSIT: 'blue',
  DELIVERED: 'ok',
  COMPLETED: 'ok',
  CANCELLED: 'neutral',
  DISPUTE: 'danger',
  RETURN: 'danger',
  REFUNDED: 'neutral',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const t = useTranslations('status.order');
  return <Badge tone={ORDER_TONE[status]}>{t(status)}</Badge>;
}

/** Шаги доставки для клиентской ленты (п.7 ТЗ) */
export const SHIPMENT_STEPS: ShipmentStatus[] = [
  'PENDING',
  'HANDED_BY_SELLER',
  'AT_ORIGIN_WAREHOUSE',
  'IN_TRANSIT',
  'AT_CUSTOMS',
  'AT_DESTINATION_WAREHOUSE',
  'HANDED_TO_COURIER',
  'DELIVERED',
];
