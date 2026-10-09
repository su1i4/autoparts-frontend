import { Suspense } from 'react';
import View from '@/views/seller/apply';

export default function Page() {
  return (
    <Suspense>
      <View />
    </Suspense>
  );
}
