import { Suspense } from 'react';
import View from '@/views/seller/catalog';

export default function Page() {
  return (
    <Suspense>
      <View />
    </Suspense>
  );
}
