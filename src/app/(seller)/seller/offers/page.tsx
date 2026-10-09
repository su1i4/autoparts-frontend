import { Suspense } from 'react';
import View from '@/views/seller/offers';

export default function Page() {
  return (
    <Suspense>
      <View />
    </Suspense>
  );
}
