import { Suspense } from 'react';
import { SellerChats as View } from '@/views/seller/chats';

export default function Page() {
  return (
    <Suspense>
      <View />
    </Suspense>
  );
}
