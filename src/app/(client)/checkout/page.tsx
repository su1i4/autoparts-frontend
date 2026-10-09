import { Suspense } from 'react';
import View from '@/views/client/checkout';

export const metadata = { title: 'Оформление' };

export default function Page() {
  return (
    <Suspense>
      <View />
    </Suspense>
  );
}
