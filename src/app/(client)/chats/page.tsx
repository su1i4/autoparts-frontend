import { Suspense } from 'react';
import View from '@/views/client/chats';

export const metadata = { title: 'Сообщения' };

export default function Page() {
  return (
    <Suspense>
      <View />
    </Suspense>
  );
}
