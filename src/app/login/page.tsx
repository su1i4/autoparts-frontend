import { Suspense } from 'react';
import View from '@/views/client/login';

export const metadata = { title: 'Вход' };

export default function Page() {
  return (
    <Suspense>
      <View />
    </Suspense>
  );
}
