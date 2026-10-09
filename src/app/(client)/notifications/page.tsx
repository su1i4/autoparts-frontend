import { Suspense } from 'react';
import View from '@/views/client/notifications';

export const metadata = { title: 'Уведомления' };

export default function Page() {
  return (
    <Suspense>
      <View />
    </Suspense>
  );
}
