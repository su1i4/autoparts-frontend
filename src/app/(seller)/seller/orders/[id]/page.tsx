import { Suspense } from 'react';
import View from '@/views/seller/order';

export default function Page() {
  return (
    <Suspense>
      <View />
    </Suspense>
  );
}
