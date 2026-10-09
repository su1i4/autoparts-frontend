import '@fontsource-variable/unbounded';
import '@fontsource-variable/onest';
import '@fontsource-variable/jetbrains-mono';
import './globals.css';
import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { APP_NAME } from '@/shared/config/env';
import { Providers } from './providers/providers';

export const metadata: Metadata = {
  title: { default: `${APP_NAME} — запчасти под заказ по VIN`, template: `%s · ${APP_NAME}` },
  description: 'Запрос по VIN и фото, предложения от магазинов и разборок, безопасная оплата и доставка из Китая.',
};

export const viewport: Viewport = { themeColor: '#f3f5f7', width: 'device-width', initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale}>
      <body className="min-h-dvh antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
