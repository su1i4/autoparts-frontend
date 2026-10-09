import { Suspense } from 'react';
import View from '@/views/client/seller-public';

export const metadata = { title: 'Продавец' };

export default function Page() {
  return (
    <Suspense>
      <View />
    </Suspense>
  );
}
