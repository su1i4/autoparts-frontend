'use client';

import { useTranslations } from 'next-intl';
import type { OfferStatus, RequestStatus } from '@/shared/api/types';
import { Badge, Tone } from '@/shared/ui';

const REQ_TONE: Record<RequestStatus, Tone> = {
  DRAFT: 'neutral',
  PUBLISHED: 'blue',
  HAS_OFFERS: 'amber',
  OFFER_SELECTED: 'ok',
  CLOSED: 'neutral',
  EXPIRED: 'neutral',
  CANCELLED: 'neutral',
};
const OFFER_TONE: Record<OfferStatus, Tone> = {
  SENT: 'blue',
  VIEWED: 'blue',
  SELECTED: 'ok',
  REJECTED: 'neutral',
  WITHDRAWN: 'neutral',
  EXPIRED: 'neutral',
  REMOVED: 'danger',
};

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const t = useTranslations('status.request');
  return <Badge tone={REQ_TONE[status]}>{t(status)}</Badge>;
}

export function OfferStatusBadge({ status }: { status: OfferStatus }) {
  const t = useTranslations('status.offer');
  return <Badge tone={OFFER_TONE[status]}>{t(status)}</Badge>;
}
