'use client';

import {
  Activity,
  Banknote,
  BookOpen,
  Boxes,
  ClipboardList,
  FileSearch,
  FileText,
  Gavel,
  LayoutDashboard,
  ListChecks,
  MessageSquareWarning,
  Package,
  Percent,
  Receipt,
  Settings,
  ShieldBan,
  Store,
  Truck,
  Undo2,
  Users,
  Warehouse,
} from 'lucide-react';
import Link from 'next/link';
import { ReactNode } from 'react';
import { useGet } from '@/shared/api/hooks';
import type { AdminStats } from '@/shared/api/types';
import { AuthGuard } from '../guard/auth-guard';
import { CabinetShell } from './cabinet-shell';

const footer = (
  <Link href="/" className="text-sm text-blue hover:underline">
    На сайт
  </Link>
);

export function LogisticsShell({ children }: { children: ReactNode }) {
  return (
    <AuthGuard roles={['LOGISTICS']}>
      <CabinetShell
        title="Склад"
        footer={footer}
        items={[
          { href: '/logistics', label: 'Отправки', icon: Package, exact: true },
          { href: '/logistics/consolidations', label: 'Консолидация', icon: Boxes },
          { href: '/logistics/tracking', label: 'Загрузка треков', icon: ListChecks },
        ]}
      >
        {children}
      </CabinetShell>
    </AuthGuard>
  );
}

function AdminNav({ children }: { children: ReactNode }) {
  const { data: s } = useGet<AdminStats>(['admin-stats'], '/admin/stats', undefined, { refetchInterval: 60_000, retry: false });
  return (
    <CabinetShell
      title="Админка"
      footer={footer}
      items={[
        { href: '/admin', label: 'Сводка', icon: LayoutDashboard, exact: true },
        { href: '/admin/users', label: 'Пользователи', icon: Users },
        { href: '/admin/sellers', label: 'Продавцы', icon: Store, badge: s?.sellersPending },
        { href: '/admin/requests', label: 'Запросы', icon: FileSearch },
        { href: '/admin/offers', label: 'Предложения', icon: FileText },
        { href: '/admin/orders', label: 'Заказы', icon: Package },
        { href: '/admin/payments', label: 'Платежи и сверка', icon: Receipt },
        { href: '/admin/payouts', label: 'Выплаты', icon: Banknote, badge: s?.payoutsPending },
        { href: '/admin/disputes', label: 'Споры', icon: Gavel, badge: s?.disputesOpen },
        { href: '/admin/returns', label: 'Возвраты', icon: Undo2 },
        { href: '/admin/moderation', label: 'Модерация', icon: ShieldBan },
        { href: '/admin/chats', label: 'Чаты', icon: MessageSquareWarning },
        { href: '/admin/commissions', label: 'Комиссия', icon: Percent },
        { href: '/admin/logistics', label: 'Склады и тарифы', icon: Warehouse },
        { href: '/admin/reference', label: 'Справочники', icon: BookOpen },
        { href: '/admin/templates', label: 'Шаблоны уведомлений', icon: ClipboardList },
        { href: '/admin/settings', label: 'Настройки', icon: Settings },
        { href: '/admin/audit', label: 'Аудит-лог', icon: Activity },
        { href: '/logistics', label: 'Панель склада', icon: Truck },
      ]}
    >
      {children}
    </CabinetShell>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <AuthGuard roles={['ADMIN', 'SUPPORT']}>
      <AdminNav>{children}</AdminNav>
    </AuthGuard>
  );
}
