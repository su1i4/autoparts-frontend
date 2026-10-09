import { Suspense } from 'react';
import View from '@/views/client/chat';

export const metadata = { title: 'Чат' };

export default function Page() {
  return (
    <Suspense>
      <View />
    </Suspense>
  );
}
