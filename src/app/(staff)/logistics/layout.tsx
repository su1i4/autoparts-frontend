import { LogisticsShell } from '@/widgets/shell/staff-shells';

export const metadata = { title: 'Склад' };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <LogisticsShell>{children}</LogisticsShell>;
}
