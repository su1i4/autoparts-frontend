import { Suspense } from 'react';
import View from '@/views/client/new-request';

export const metadata = { title: 'Новый запрос' };

export default function Page() {
  return (
    <Suspense>
      <View />
    </Suspense>
  );
}
