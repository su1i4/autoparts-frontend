import { SellerShell } from '@/widgets/shell/seller-shell';

export const metadata = { title: 'Кабинет продавца' };

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return <SellerShell>{children}</SellerShell>;
}
