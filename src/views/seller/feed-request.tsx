'use client';

import { MessageCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { openChat } from '@/entities/chat/api';
import { useCategoryName } from '@/entities/reference/api';
import { useRequest } from '@/entities/request/api';
import { OfferStatusBadge, RequestStatusBadge } from '@/entities/request/ui/status';
import { carTitle } from '@/entities/vehicle/api';
import { VinPlate } from '@/entities/vehicle/ui/vin-plate';
import { errorMessage } from '@/shared/lib/errors';
import { dateTime, money } from '@/shared/lib/format';
import { Badge, Button, Loading, Panel, Photo } from '@/shared/ui';
import { OfferForm } from './offer-form';

export default function FeedRequestView() {
  const t = useTranslations('seller');
  const tr = useTranslations('request');
  const tc = useTranslations('common');
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: r, isLoading } = useRequest(id);
  const categoryName = useCategoryName();
  const [chatting, setChatting] = useState(false);
  if (isLoading || !r) return <Loading />;
  const open = r.status === 'PUBLISHED' || r.status === 'HAS_OFFERS';

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_480px]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <RequestStatusBadge status={r.status} />
          {r.categoryId && <Badge>{categoryName(r.categoryId)}</Badge>}
          <Badge>{tc(`condition.${r.condition}`)}</Badge>
          {r.originCountry !== 'ANY' && <Badge tone="blue">{tc(`country.${r.originCountry}`)}</Badge>}
        </div>
        <h1 className="text-[24px] font-semibold">{r.title}</h1>
        <p className="text-[17px] text-ink-soft">
          {carTitle(r)}
          {r.engine && <span className="ml-2 text-ink-mute">{r.engine}</span>}
        </p>
        {(r.vin || r.frameNumber) && <VinPlate vin={(r.vin ?? r.frameNumber)!} size="sm" className="self-start" />}
        {r.oemNumber && (
          <p>
            OEM: <span className="code">{r.oemNumber}</span>
          </p>
        )}
        {r.description && <p className="max-w-[65ch] whitespace-pre-line">{r.description}</p>}
        {!!r.photos.length && (
          <div className="flex flex-wrap gap-2">
            {r.photos.map((p) => (
              <a key={p} href={p} target="_blank" rel="noreferrer">
                <Photo src={p} className="size-28 rounded-lg border border-steel-light" />
              </a>
            ))}
          </div>
        )}
        <p className="flex flex-wrap gap-4 text-sm text-ink-mute">
          <span>{r.city ?? r.country}</span>
          {r.budget && <span>{tr('budget')}: {money(r.budget, r.budgetCurrency)}</span>}
          {r.expiresAt && <span>{tr('expires', { date: dateTime(r.expiresAt) })}</span>}
        </p>
        <Button
          variant="outline"
          className="self-start"
          loading={chatting}
          onClick={async () => {
            setChatting(true);
            try {
              const c = await openChat({ requestId: r.id });
              router.push(`/seller/chats/${c.id}`);
            } catch (e) {
              toast.error(errorMessage(e));
              setChatting(false);
            }
          }}
        >
          <MessageCircle className="size-4" /> {tr('ask')}
        </Button>
      </div>
      <Panel className="h-fit">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-[18px] font-semibold">{t('offer.title')}</h2>
          {r.myOffer && <OfferStatusBadge status={r.myOffer.status} />}
        </div>
        {open || r.myOffer ? <OfferForm requestId={r.id} existing={r.myOffer} defaultTitle={r.title} /> : <p className="text-ink-mute">{tr(`expires`, { date: dateTime(r.expiresAt) })}</p>}
      </Panel>
    </div>
  );
}
