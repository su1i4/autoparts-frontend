import { ClientShell } from '@/widgets/shell/client-shell';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <ClientShell>{children}</ClientShell>;
}
