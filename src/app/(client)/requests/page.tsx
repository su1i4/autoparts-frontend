import { Suspense } from 'react';
import View from '@/views/client/requests';

export const metadata = { title: 'Мои запросы' };

export default function Page() {
  return (
    <Suspense>
      <View />
    </Suspense>
  );
}
