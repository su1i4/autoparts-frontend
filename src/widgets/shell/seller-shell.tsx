'use client';

import { Banknote, Boxes, FileText, Inbox, LayoutDashboard, MessageCircle, Package, Store } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ReactNode } from 'react';
import { useSellerOrders } from '@/entities/order/api';
import { useMySeller } from '@/entities/seller/api';
import { LanguageSwitcher } from '@/features/language/switcher';
import { Note } from '@/shared/ui';
import { AuthGuard } from '../guard/auth-guard';
import { CabinetShell } from './cabinet-shell';

function Shell({ children }: { children: ReactNode }) {
  const t = useTranslations('seller');
  const tn = useTranslations('nav');
  const { data: seller } = useMySeller();
  const { data: paid } = useSellerOrders({ status: 'PAID' });
  const items = [
    { href: '/seller', label: t('nav.dashboard'), icon: LayoutDashboard, exact: true },
    { href: '/seller/feed', label: t('nav.feed'), icon: Inbox },
    { href: '/seller/offers', label: t('nav.offers'), icon: FileText },
    { href: '/seller/orders', label: t('nav.orders'), icon: Package, badge: paid?.total },
    { href: '/seller/chats', label: t('nav.chats'), icon: MessageCircle },
    { href: '/seller/catalog', label: t('nav.catalog'), icon: Boxes },
    { href: '/seller/balance', label: t('nav.balance'), icon: Banknote },
    { href: '/seller/profile', label: t('nav.profile'), icon: Store },
  ];
  return (
    <CabinetShell
      items={items}
      title={t('cabinetShort')}
      footer={
        <div className="flex items-center justify-between gap-2">
          <Link href="/" className="text-sm text-blue hover:underline">
            {tn('toClient')}
          </Link>
          <LanguageSwitcher />
        </div>
      }
    >
      {seller?.verificationStatus === 'PENDING' && (
        <div className="mb-5">
          <Note tone="amber">{t('pending')}</Note>
        </div>
      )}
      {seller?.verificationStatus === 'REJECTED' && (
        <div className="mb-5">
          <Note tone="amber">{t('rejected', { comment: seller.verificationComment ?? '' })}</Note>
        </div>
      )}
      {children}
    </CabinetShell>
  );
}

export function SellerShell({ children }: { children: ReactNode }) {
  return (
    <AuthGuard roles={['SELLER']} deniedRedirect="/seller/apply">
      <Shell>{children}</Shell>
    </AuthGuard>
  );
}
