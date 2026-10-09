import { Suspense } from 'react';
import View from '@/views/seller/feed';

export default function Page() {
  return (
    <Suspense>
      <View />
    </Suspense>
  );
}
