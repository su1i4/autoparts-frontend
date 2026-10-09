'use client';

import { Ban } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { useSession } from '@/entities/session/store';
import { api } from '@/shared/api/http';
import { useGet, useMut } from '@/shared/api/hooks';
import type { UserBlock } from '@/shared/api/types';
import { dateTime } from '@/shared/lib/format';
import { Button, Field, Loading, Note, Panel, Textarea } from '@/shared/ui';
import { AuthGuard } from '@/widgets/guard/auth-guard';

function Blocked() {
  const t = useTranslations('blocked');
  const tc = useTranslations('common');
  const logout = useSession((s) => s.logout);
  const { data: block, isLoading } = useGet<UserBlock | null>(['my-block'], '/users/me/block');
  const appeal = useMut((text: string) => api.post('/users/me/block/appeal', { text }), { invalidate: [['my-block']] });
  const [text, setText] = useState('');

  if (isLoading) return <Loading />;
  return (
    <div className="mx-auto max-w-lg">
      <Panel className="flex flex-col gap-4">
        <Ban className="size-10 text-danger" />
        <h1 className="text-[24px] font-semibold">{t('title')}</h1>
        {block && (
          <>
            <p>{t('reason', { reason: block.reason })}</p>
            <p className="text-ink-soft">{block.until ? t('until', { date: dateTime(block.until) }) : t('forever')}</p>
            {block.appealStatus === 'PENDING' ? (
              <Note>{t('appealPending')}</Note>
            ) : (
              <>
                <Field label={t('appealText')}>
                  <Textarea value={text} onChange={(e) => setText(e.target.value)} />
                </Field>
                <Button variant="blue" disabled={text.trim().length < 5} loading={appeal.isPending} onClick={() => appeal.mutate(text, { onSuccess: () => toast.success(t('appealSent')) })}>
                  {t('appeal')}
                </Button>
              </>
            )}
          </>
        )}
        <Button variant="ghost" onClick={() => (logout(), (window.location.href = '/'))}>
          {tc('logout')}
        </Button>
      </Panel>
    </div>
  );
}

export default function BlockedView() {
  return (
    <AuthGuard>
      <Blocked />
    </AuthGuard>
  );
}
