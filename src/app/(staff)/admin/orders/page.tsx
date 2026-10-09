import { Suspense } from 'react';
import View from '@/views/admin/orders';

export default function Page() {
  return (
    <Suspense>
      <View />
    </Suspense>
  );
}
