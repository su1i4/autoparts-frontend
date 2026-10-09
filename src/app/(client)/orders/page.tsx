import { Suspense } from 'react';
import View from '@/views/client/orders';

export const metadata = { title: 'Заказы' };

export default function Page() {
  return (
    <Suspense>
      <View />
    </Suspense>
  );
}
