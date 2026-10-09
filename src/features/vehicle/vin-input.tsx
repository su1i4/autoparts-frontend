'use client';

import { Check, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { carTitle, decodeVin, VIN_RE } from '@/entities/vehicle/api';
import type { VinDecode } from '@/shared/api/types';
import { cn } from '@/shared/lib/cn';

/**
 * Поле VIN в виде штампованной таблички. Латиница в верхнем регистре,
 * I/O/Q подменяются (типичные опечатки), при 17 символах — автодекодирование.
 */
export function VinInput({
  value,
  onChange,
  onDecoded,
  autoFocus,
  size = 'lg',
  id = 'vin',
}: {
  value: string;
  onChange: (v: string) => void;
  onDecoded?: (d: VinDecode | null) => void;
  autoFocus?: boolean;
  size?: 'md' | 'lg';
  id?: string;
}) {
  const t = useTranslations('home');
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'unknown' | 'invalid'>('idle');
  const [decoded, setDecoded] = useState<VinDecode | null>(null);

  useEffect(() => {
    if (value.length < 17) {
      setState('idle');
      setDecoded(null);
      onDecoded?.(null);
      return;
    }
    if (!VIN_RE.test(value)) {
      setState('invalid');
      return;
    }
    let alive = true;
    setState('loading');
    decodeVin(value)
      .then((d) => {
        if (!alive) return;
        setDecoded(d);
        setState(d.recognized ? 'done' : 'unknown');
        onDecoded?.(d);
      })
      .catch(() => alive && setState('unknown'));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // кириллица на русской раскладке → латинские двойники; I/O/Q в VIN не бывает → 1/0
  const CYR: Record<string, string> = { А: 'A', В: 'B', Е: 'E', К: 'K', М: 'M', Н: 'H', Р: 'P', С: 'C', Т: 'T', Х: 'X', У: 'Y' };
  const clean = (s: string) =>
    s
      .toUpperCase()
      .replace(/[АВЕКМНРСТХУ]/g, (c) => CYR[c])
      .replace(/[ІI]/g, '1')
      .replace(/[OО]/g, '0')
      .replace(/Q/g, '0')
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 17);

  return (
    <div>
      <div className={cn('vin-plate flex items-center px-8', size === 'lg' ? 'h-[76px]' : 'h-14')}>
        <label htmlFor={id} className="sr-only">
          VIN
        </label>
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(clean(e.target.value))}
          placeholder={t('vinPlaceholder')}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          autoFocus={autoFocus}
          aria-invalid={state === 'invalid'}
          className={cn(
            'vin-stamp w-full bg-transparent outline-none placeholder:font-sans placeholder:tracking-normal placeholder:normal-case placeholder:text-ink-mute placeholder:[text-shadow:none]',
            size === 'lg' ? 'text-[19px] sm:text-[24px]' : 'text-[16px] sm:text-[18px]',
          )}
        />
        <span className="ml-2 shrink-0 text-[13px] text-ink-mute num">{value.length}/17</span>
      </div>
      <div className="mt-2 min-h-6 text-sm" aria-live="polite">
        {state === 'idle' && <span className="text-ink-mute">{t('vinHint')}</span>}
        {state === 'loading' && (
          <span className="inline-flex items-center gap-1.5 text-ink-soft">
            <Loader2 className="size-4 animate-spin" /> {t('decoding')}
          </span>
        )}
        {state === 'done' && decoded && (
          <span className="inline-flex items-center gap-1.5 font-medium text-ok">
            <Check className="size-4" /> {t('decoded', { car: carTitle({ make: decoded.make ?? '', model: decoded.model, year: decoded.year }) })}
          </span>
        )}
        {state === 'unknown' && <span className="text-ink-soft">{t('notRecognized')}</span>}
        {state === 'invalid' && <span className="text-danger">{t('invalidVin')}</span>}
      </div>
    </div>
  );
}
