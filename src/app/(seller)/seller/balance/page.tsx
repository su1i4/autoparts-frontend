import { Suspense } from 'react';
import View from '@/views/seller/balance';

export default function Page() {
  return (
    <Suspense>
      <View />
    </Suspense>
  );
}
