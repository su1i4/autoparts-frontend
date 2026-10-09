'use client';

import { ArrowLeft, Flag, ImagePlus, SendHorizontal, ShieldAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { checkText, markRead, useChat, useJoinChat, useMessages, useSendMessage } from '@/entities/chat/api';
import { useSession } from '@/entities/session/store';
import { api } from '@/shared/api/http';
import type { Message } from '@/shared/api/types';
import { cn } from '@/shared/lib/cn';
import { errorBody, errorMessage } from '@/shared/lib/errors';
import { dateTime } from '@/shared/lib/format';
import { Loading, Photo } from '@/shared/ui';
import { AuthGuard } from '@/widgets/guard/auth-guard';

function Bubble({ m, mine }: { m: Message; mine: boolean }) {
  const t = useTranslations('chat');
  if (m.senderRole === 'SYSTEM') {
    return <li className="mx-auto max-w-[85%] rounded-lg bg-steel-light px-3 py-1.5 text-center text-sm text-ink-soft">{m.text}</li>;
  }
  const blocked = m.status === 'BLOCKED';
  return (
    <li className={cn('group flex max-w-[85%] flex-col gap-1 sm:max-w-[70%]', mine ? 'self-end items-end' : 'self-start items-start')}>
      {m.senderRole === 'SUPPORT' && <span className="text-[12px] font-medium text-blue">{t('support')}</span>}
      <div
        className={cn(
          'rounded-2xl px-3.5 py-2 whitespace-pre-wrap break-words',
          blocked ? 'border border-dashed border-danger/50 bg-danger-tint/50 text-ink-soft' : mine ? 'rounded-br-md bg-blue text-white' : 'rounded-bl-md border border-steel-light bg-surface',
          m.senderRole === 'SUPPORT' && !mine && 'border-amber bg-amber-tint',
        )}
      >
        {m.text}
        {!!m.photos.length && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {m.photos.map((p) => (
              <a key={p} href={p} target="_blank" rel="noreferrer">
                <Photo src={p} className="size-24 rounded-lg" />
              </a>
            ))}
          </div>
        )}
      </div>
      <span className="flex items-center gap-2 text-[12px] text-ink-mute">
        {blocked && <span className="text-danger">{t('blockedLabel')}</span>}
        {dateTime(m.createdAt)}
        {!mine && m.senderId && (
          <button
            className="opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
            aria-label={t('report')}
            title={t('report')}
            onClick={() =>
              api
                .post('/reports', { targetType: 'MESSAGE', targetId: m.id, reason: 'Жалоба из чата' })
                .then(() => toast.success(t('reported')))
                .catch((e) => toast.error(errorMessage(e)))
            }
          >
            <Flag className="size-3.5" />
          </button>
        )}
      </span>
    </li>
  );
}

export function ChatThread({ backHref = '/chats' }: { backHref?: string }) {
  const t = useTranslations('chat');
  const tc = useTranslations('common');
  const { id } = useParams<{ id: string }>();
  const me = useSession((s) => s.user);
  const { data: chat } = useChat(id);
  const { data: messages, isLoading } = useMessages(id);
  const send = useSendMessage(id);
  const [text, setText] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [warn, setWarn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  useJoinChat(id);

  const ordered = useMemo(() => [...(messages ?? [])].reverse(), [messages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
    if (id && messages) void markRead(id).catch(() => undefined);
  }, [messages, id]);

  // предупреждаем до отправки (тот же фильтр, что на сервере)
  useEffect(() => {
    if (text.trim().length < 6) return setWarn(null);
    const h = setTimeout(() => {
      checkText(text)
        .then((r) => setWarn(r.blocked ? t('warnBeforeSend') : null))
        .catch(() => undefined);
    }, 500);
    return () => clearTimeout(h);
  }, [text, t]);

  const submit = () => {
    if (!text.trim() && !photos.length) return;
    setError(null);
    send.mutate(
      { text: text.trim() || undefined, photos },
      {
        onSuccess: () => {
          setText('');
          setPhotos([]);
          setWarn(null);
        },
        onError: (e) => {
          const b = errorBody(e);
          if (b?.code === 'CONTACTS_FORBIDDEN') {
            setError(`${t('blocked')} ${t('violations', { count: Number(b.violations ?? 1) })}`);
            setText('');
          } else if (b?.code === 'CHAT_RESTRICTED') setError(String(b.message));
          else toast.error(errorMessage(e));
        },
      },
    );
  };

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    for (const f of Array.from(files).slice(0, 5 - photos.length)) {
      const form = new FormData();
      form.append('file', f);
      try {
        const r = await api.upload<{ url: string }>('/files/upload', form);
        setPhotos((p) => [...p, r.url]);
      } catch (e) {
        toast.error(errorMessage(e));
      }
    }
  };

  const subtitle = chat?.orderNumber ? t('byOrder', { number: chat.orderNumber }) : chat?.requestTitle ? t('byRequest', { title: chat.requestTitle }) : '';

  return (
    <div className="mx-auto flex h-[calc(100dvh-170px)] max-w-3xl flex-col overflow-hidden rounded-xl border border-steel-light bg-paper md:h-[calc(100dvh-120px)]">
      <div className="flex items-center gap-3 border-b border-steel-light bg-surface px-3 py-2.5">
        <Link href={backHref} className="rounded-lg p-1.5 hover:bg-steel-light" aria-label="Назад">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0">
          <p className="truncate font-semibold">{chat?.counterpartName ?? '…'}</p>
          <p className="truncate text-sm text-ink-mute">{subtitle}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mx-auto mb-4 flex max-w-md items-start gap-2 rounded-lg bg-amber-tint px-3 py-2 text-[13px] text-[#5e4600]">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" /> {t('rule')}
        </p>
        {isLoading ? (
          <Loading />
        ) : (
          <ul className="flex flex-col gap-3">
            {ordered.map((m) => (
              <Bubble key={m.id} m={m} mine={m.senderId === me?.id} />
            ))}
          </ul>
        )}
        <div ref={endRef} />
      </div>

      <form
        className="border-t border-steel-light bg-surface p-2.5"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {(error || warn) && <p className={cn('mb-2 px-1 text-sm', error ? 'text-danger' : 'text-[#7a5a00]')}>{error ?? warn}</p>}
        {!!photos.length && (
          <div className="mb-2 flex gap-1.5 px-1">
            {photos.map((p) => (
              <button key={p} type="button" onClick={() => setPhotos(photos.filter((x) => x !== p))} aria-label="Убрать фото">
                <Photo src={p} className="size-12 rounded-md" />
              </button>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2">
          <button type="button" onClick={() => fileRef.current?.click()} className="rounded-lg p-2.5 text-ink-mute hover:bg-steel-light" aria-label="Фото">
            <ImagePlus className="size-5" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => void upload(e.target.files)} />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            placeholder={t('placeholder')}
            aria-label={t('placeholder')}
            className="max-h-32 min-h-11 flex-1 resize-none rounded-[10px] border border-steel px-3 py-2.5 text-[15px] focus:border-blue focus:outline-none"
          />
          <button
            disabled={send.isPending || (!text.trim() && !photos.length)}
            className="rounded-[10px] bg-blue p-2.5 text-white disabled:opacity-40"
            aria-label={tc('send')}
          >
            <SendHorizontal className="size-5" />
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ChatView() {
  return (
    <AuthGuard>
      <ChatThread />
    </AuthGuard>
  );
}
