import { Suspense } from 'react';
import View from '@/views/client/track';

export const metadata = { title: 'Отслеживание' };

export default function Page() {
  return (
    <Suspense>
      <View />
    </Suspense>
  );
}
