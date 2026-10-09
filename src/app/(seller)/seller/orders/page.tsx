import { Suspense } from 'react';
import View from '@/views/seller/orders';

export default function Page() {
  return (
    <Suspense>
      <View />
    </Suspense>
  );
}
