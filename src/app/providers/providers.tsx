'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';
import { toast, Toaster } from 'sonner';
import { useRealtime } from '@/entities/chat/api';
import { useMe } from '@/entities/user/api';

function SessionBridge() {
  useMe();
  useRealtime((n) => {
    if (n.type !== 'CHAT_MESSAGE' || !window.location.pathname.startsWith('/chats')) {
      toast(n.title, { description: n.body });
    }
  });
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 10_000, refetchOnWindowFocus: true, retry: (n, e: unknown) => n < 1 && (e as { response?: { status?: number } })?.response?.status !== 404 },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <SessionBridge />
      {children}
      <Toaster position="top-center" richColors closeButton toastOptions={{ style: { fontFamily: 'var(--font-sans)' } }} />
    </QueryClientProvider>
  );
}
