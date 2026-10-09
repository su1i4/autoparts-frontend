import { Suspense } from 'react';
import View from '@/views/client/request';

export const metadata = { title: 'Запрос' };

export default function Page() {
  return (
    <Suspense>
      <View />
    </Suspense>
  );
}
