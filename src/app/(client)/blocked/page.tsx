import { Suspense } from 'react';
import View from '@/views/client/blocked';

export const metadata = { title: 'Аккаунт заблокирован' };

export default function Page() {
  return (
    <Suspense>
      <View />
    </Suspense>
  );
}
