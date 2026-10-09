import { Suspense } from 'react';
import View from '@/views/seller/part-form';

export default function Page() {
  return (
    <Suspense>
      <View />
    </Suspense>
  );
}
