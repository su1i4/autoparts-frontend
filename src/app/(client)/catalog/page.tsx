import { Suspense } from 'react';
import View from '@/views/client/catalog';

export const metadata = { title: 'Каталог' };

export default function Page() {
  return (
    <Suspense>
      <View />
    </Suspense>
  );
}
