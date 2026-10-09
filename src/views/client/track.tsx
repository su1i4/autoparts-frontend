'use client';

import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { usePublicTracking } from '@/entities/order/api';
import { cn } from '@/shared/lib/cn';
import { dateTime } from '@/shared/lib/format';
import { Button, ErrorBox, Input, Loading, PageHeader, Panel } from '@/shared/ui';

export default function TrackView() {
  const t = useTranslations('track');
  const ts = useTranslations('status.shipment');
  const tsh = useTranslations('status.shipping');
  const params = useParams<{ number?: string }>();
  const router = useRouter();
  const number = params.number ? decodeURIComponent(params.number) : undefined;
  const [value, setValue] = useState(number ?? '');
  const { data, isLoading, isError } = usePublicTracking(number);

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title={t('title')} />
      <form
        className="mb-5 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) router.push(`/track/${encodeURIComponent(value.trim())}`);
        }}
      >
        <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder={t('placeholder')} className="code" aria-label={t('placeholder')} />
        <Button variant="blue">{t('find')}</Button>
      </form>
      {number && isLoading && <Loading />}
      {number && isError && <ErrorBox>{t('notFound')}</ErrorBox>}
      {data && (
        <Panel>
          <p className="code text-lg font-semibold">{data.trackingNumber}</p>
          <p className="text-ink-soft">
            {data.route} <span className="ml-2">{tsh(data.method)}</span>
          </p>
          <ol className="mt-4 flex flex-col gap-3">
            {[...data.events].reverse().map((e, i) => (
              <li key={i} className="flex gap-3">
                <span className={cn('mt-1.5 size-2.5 shrink-0 rounded-full', i === 0 ? 'bg-amber ring-2 ring-blue' : 'bg-steel')} />
                <div>
                  <p className={cn(i === 0 && 'font-semibold')}>{ts(e.status)}</p>
                  <p className="text-sm text-ink-mute">
                    {dateTime(e.at)}
                    {e.location && <span className="ml-2">{e.location}</span>}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Panel>
      )}
    </div>
  );
}
