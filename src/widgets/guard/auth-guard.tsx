'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { hasRole, useHydrated, useSession } from '@/entities/session/store';
import type { Role } from '@/shared/api/types';
import { Empty, Loading } from '@/shared/ui';

/**
 * Требует вход (и при необходимости роль). Токены — в localStorage, поэтому проверка на клиенте.
 * deniedRedirect — куда отправить, если роли нет (например, не-продавца — на заявку продавца).
 */
export function AuthGuard({ children, roles, deniedRedirect }: { children: ReactNode; roles?: Role[]; deniedRedirect?: string }) {
  const { accessToken, user } = useSession();
  const hydrated = useHydrated();
  const router = useRouter();
  const path = usePathname();
  const denied = !!roles && !!user && !hasRole(user, ...roles);

  useEffect(() => {
    if (hydrated && !accessToken) router.replace(`/login?next=${encodeURIComponent(path + window.location.search)}`);
    else if (hydrated && denied && deniedRedirect) router.replace(deniedRedirect);
  }, [hydrated, accessToken, path, router, denied, deniedRedirect]);

  if (!hydrated || !accessToken) return <Loading />;
  if (denied) {
    return deniedRedirect ? <Loading /> : <Empty title="Нет доступа" text="Этот раздел доступен другой роли. Обратитесь к администратору." />;
  }
  return <>{children}</>;
}
