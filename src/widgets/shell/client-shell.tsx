import { ReactNode } from 'react';
import { BottomNav } from './bottom-nav';
import { Header } from './header';

export function ClientShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 pt-5 pb-28 md:pb-16">{children}</main>
      <BottomNav />
    </>
  );
}
