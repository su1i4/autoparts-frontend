'use client';

import { Camera, Loader2, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/shared/api/http';
import { errorMessage } from '@/shared/lib/errors';
import { Photo } from '@/shared/ui';

/** Загрузка фото (камера/галерея) → массив URL. Сжатие делает бэкенд. */
export function PhotoPicker({
  value,
  onChange,
  max = 10,
  accept = 'image/*',
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  accept?: string;
}) {
  const t = useTranslations('common');
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files).slice(0, max - value.length);
    setBusy(list.length);
    const urls: string[] = [];
    for (const f of list) {
      try {
        const form = new FormData();
        form.append('file', f);
        const r = await api.upload<{ url: string }>('/files/upload', form);
        urls.push(r.url);
      } catch (e) {
        toast.error(errorMessage(e));
      } finally {
        setBusy((b) => b - 1);
      }
    }
    onChange([...value, ...urls]);
    if (input.current) input.current.value = '';
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {value.map((u) => (
          <div key={u} className="relative">
            {u.endsWith('.pdf') ? (
              <div className="flex size-20 items-center justify-center rounded-lg border border-steel bg-paper text-xs text-ink-soft">PDF</div>
            ) : (
              <Photo src={u} className="size-20 rounded-lg border border-steel-light" />
            )}
            <button
              type="button"
              onClick={() => onChange(value.filter((x) => x !== u))}
              className="absolute -top-1.5 -right-1.5 rounded-full bg-ink p-0.5 text-white"
              aria-label={t('delete')}
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
        {Array.from({ length: busy }).map((_, i) => (
          <div key={i} className="flex size-20 items-center justify-center rounded-lg border border-dashed border-steel">
            <Loader2 className="size-5 animate-spin text-ink-mute" />
          </div>
        ))}
        {value.length + busy < max && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="flex size-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-ink-mute text-xs text-ink-soft hover:border-blue hover:text-blue"
          >
            <Camera className="size-5" />
            {t('addPhoto')}
          </button>
        )}
      </div>
      <p className="mt-1.5 text-sm text-ink-mute">{t('photosLimit', { max })}</p>
      <input ref={input} type="file" accept={accept} multiple hidden onChange={(e) => void upload(e.target.files)} />
    </div>
  );
}
