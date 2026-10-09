'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useSession } from '@/entities/session/store';
import { api } from '@/shared/api/http';
import type { User } from '@/shared/api/types';
import { errorMessage } from '@/shared/lib/errors';
import { phone as fmtPhone } from '@/shared/lib/format';
import { Button, Field, Input, Note } from '@/shared/ui';

interface VerifyRes {
  accessToken: string;
  refreshToken: string;
  isNew: boolean;
  user: User;
}

const deviceId = () => {
  try {
    let id = localStorage.getItem('tetik-device');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('tetik-device', id);
    }
    return id;
  } catch {
    return undefined;
  }
};

export function PhoneLogin({ onDone }: { onDone: (u: User, isNew: boolean) => void }) {
  const t = useTranslations('auth');
  const { setTokens, setUser } = useSession();
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('+996 ');
  const [normalized, setNormalized] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [left, setLeft] = useState(0);

  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);

  const request = async () => {
    setLoading(true);
    try {
      const r = await api.post<{ phone: string; devCode?: string }>('/auth/otp/request', { phone, deviceId: deviceId() });
      setNormalized(r.phone);
      setDevCode(r.devCode ?? null);
      setStep('code');
      setLeft(60);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const verify = async (value = code) => {
    setLoading(true);
    try {
      const r = await api.post<VerifyRes>('/auth/otp/verify', { phone: normalized, code: value, deviceId: deviceId() });
      setTokens(r.accessToken, r.refreshToken);
      setUser(r.user);
      onDone(r.user, r.isNew);
    } catch (e) {
      toast.error(errorMessage(e));
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'phone') {
    return (
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          void request();
        }}
      >
        <Field label={t('phone')} htmlFor="phone">
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t('phonePlaceholder')}
            className="h-13 text-lg"
            autoFocus
          />
        </Field>
        <Button variant="primary" size="lg" loading={loading} disabled={phone.replace(/\D/g, '').length < 9}>
          {t('getCode')}
        </Button>
        <p className="text-sm text-ink-mute">{t('terms')}</p>
      </form>
    );
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        void verify();
      }}
    >
      <p className="text-ink-soft">{t('codeSent', { phone: fmtPhone(normalized) })}</p>
      {devCode && <Note tone="amber">{t('devCode', { code: devCode })}</Note>}
      <Field label={t('code')} htmlFor="code">
        <Input
          id="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '');
            setCode(v);
            if (v.length === 4) void verify(v);
          }}
          className="code h-14 text-center text-2xl tracking-[0.5em]"
          autoFocus
        />
      </Field>
      <Button variant="primary" size="lg" loading={loading} disabled={code.length < 4}>
        {t('verify')}
      </Button>
      <div className="flex justify-between text-sm">
        <button type="button" className="text-blue hover:underline" onClick={() => setStep('phone')}>
          {t('changePhone')}
        </button>
        {left > 0 ? (
          <span className="text-ink-mute">{t('resendIn', { sec: left })}</span>
        ) : (
          <button type="button" className="text-blue hover:underline" onClick={() => void request()}>
            {t('resend')}
          </button>
        )}
      </div>
    </form>
  );
}
