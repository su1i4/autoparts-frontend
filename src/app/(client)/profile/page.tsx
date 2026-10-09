import { Suspense } from 'react';
import View from '@/views/client/profile';

export const metadata = { title: 'Профиль' };

export default function Page() {
  return (
    <Suspense>
      <View />
    </Suspense>
  );
}
