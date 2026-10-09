import type { ShipmentStatus } from '@/shared/api/types';

export const SHIP_LABEL: Record<ShipmentStatus, string> = {
  PENDING: 'Ждём от продавца',
  HANDED_BY_SELLER: 'Передано продавцом',
  AT_ORIGIN_WAREHOUSE: 'На складе в Китае',
  IN_TRANSIT: 'В пути',
  AT_CUSTOMS: 'На таможне',
  AT_DESTINATION_WAREHOUSE: 'На складе КР',
  HANDED_TO_COURIER: 'Передано курьеру',
  DELIVERED: 'Доставлено',
  CANCELLED: 'Отменено',
};

export const SHIP_FLOW: ShipmentStatus[] = [
  'PENDING',
  'HANDED_BY_SELLER',
  'AT_ORIGIN_WAREHOUSE',
  'IN_TRANSIT',
  'AT_CUSTOMS',
  'AT_DESTINATION_WAREHOUSE',
  'HANDED_TO_COURIER',
  'DELIVERED',
];
