import { AdminShell } from '@/widgets/shell/staff-shells';

export const metadata = { title: 'Админка' };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
