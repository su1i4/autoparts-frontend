import { Suspense } from 'react';
import View from '@/views/client/order';

export const metadata = { title: 'Заказ' };

export default function Page() {
  return (
    <Suspense>
      <View />
    </Suspense>
  );
}
