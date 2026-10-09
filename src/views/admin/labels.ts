import type { OrderStatus, PaymentStatus, RequestStatus, Role } from '@/shared/api/types';

export const ORDER_LABEL: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'Ожидает оплаты',
  PAID: 'Оплачен',
  CONFIRMED: 'Подтверждён',
  SHIPPED: 'Передан в доставку',
  IN_TRANSIT: 'В пути',
  DELIVERED: 'Доставлен',
  COMPLETED: 'Завершён',
  CANCELLED: 'Отменён',
  DISPUTE: 'Спор',
  RETURN: 'Возврат',
  REFUNDED: 'Возвращён',
};

export const REQUEST_LABEL: Record<RequestStatus, string> = {
  DRAFT: 'Черновик',
  PUBLISHED: 'Опубликован',
  HAS_OFFERS: 'Есть предложения',
  OFFER_SELECTED: 'Выбран оффер',
  CLOSED: 'Закрыт',
  EXPIRED: 'Истёк',
  CANCELLED: 'Отменён',
};

export const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  CREATED: 'Создан',
  HOLD: 'Удержан (эскроу)',
  CAPTURED: 'Проведён',
  PAID_OUT: 'Выплачен',
  REFUNDED: 'Возвращён',
  PARTIALLY_REFUNDED: 'Частичный возврат',
  FAILED: 'Ошибка',
};

export const ROLE_LABEL: Record<Role, string> = {
  CLIENT: 'Клиент',
  SELLER: 'Продавец',
  ADMIN: 'Админ',
  LOGISTICS: 'Склад',
  SUPPORT: 'Саппорт',
};

export const DISPUTE_REASON: Record<string, string> = {
  NOT_RECEIVED: 'Не получил',
  WRONG_ITEM: 'Не та деталь',
  DAMAGED: 'Повреждена',
  NOT_AS_DESCRIBED: 'Не соответствует описанию',
  COUNTERFEIT: 'Подделка',
  NOT_FIT: 'Не подошла',
  CHANGED_MIND: 'Передумал',
  OTHER: 'Другое',
};

export const SENDER_LABEL: Record<string, string> = {
  CLIENT: 'Покупатель',
  SELLER: 'Продавец',
  SUPPORT: 'Поддержка',
  SYSTEM: 'Система',
};

export const MESSAGE_STATUS_LABEL: Record<string, string> = {
  SENT: 'Доставлено',
  BLOCKED: 'Заблокировано фильтром',
  HIDDEN: 'Скрыто модератором',
};

export const PAYOUT_LABEL: Record<string, string> = {
  REQUESTED: 'В обработке',
  PAID: 'Выплачено',
  REJECTED: 'Отклонено',
};

export const OFFER_LABEL: Record<string, string> = {
  SENT: 'Отправлено',
  VIEWED: 'Просмотрено',
  SELECTED: 'Выбрано',
  REJECTED: 'Отклонено',
  WITHDRAWN: 'Отозвано',
  EXPIRED: 'Истекло',
  REMOVED: 'Удалено модератором',
};

export const VERIFICATION_LABEL: Record<string, string> = {
  PENDING: 'На проверке',
  VERIFIED: 'Проверен',
  REJECTED: 'Отклонён',
};

export const LEDGER_OP_LABEL: Record<string, string> = {
  HOLD: 'Оплата в эскроу',
  SETTLE: 'Закрытие эскроу',
  PAYOUT_REQUEST: 'Заявка на вывод',
  PAYOUT_PAID: 'Выплата',
  PAYOUT_REJECTED: 'Отказ в выплате',
};

export const BLACKLIST_LABEL: Record<string, string> = { PHONE: 'Телефон', DEVICE: 'Устройство' };

export const RETURN_LABEL: Record<string, string> = {
  REQUESTED: 'Ждёт решения',
  APPROVED: 'Одобрен',
  REJECTED: 'Отклонён',
  RECEIVED: 'Товар получен',
  REFUNDED: 'Деньги возвращены',
};

export const SHIPPING_METHOD_LABEL: Record<string, string> = {
  AIR: 'Авиа',
  TRUCK: 'Авто',
  RAIL: 'Ж/д',
  LOCAL: 'По КР',
};

export const RESOLUTION_LABEL: Record<string, string> = {
  REFUND_FULL: 'Полный возврат покупателю',
  REFUND_PARTIAL: 'Частичный возврат покупателю',
  PAYOUT_SELLER: 'Оплата продавцу',
};
