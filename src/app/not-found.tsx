import Link from 'next/link';
import { ClientShell } from '@/widgets/shell/client-shell';

export default function NotFound() {
  return (
    <ClientShell>
      <div className="py-20 text-center">
        <p className="font-display text-[56px] font-bold text-steel num">404</p>
        <h1 className="mt-2 text-xl font-semibold">Страница не найдена</h1>
        <p className="mt-1 text-ink-soft">Возможно, ссылка устарела.</p>
        <Link href="/" className="mt-5 inline-block text-blue hover:underline">
          На главную
        </Link>
      </div>
    </ClientShell>
  );
}
