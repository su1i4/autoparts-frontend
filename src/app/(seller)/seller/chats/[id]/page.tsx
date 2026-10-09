import { Suspense } from 'react';
import { SellerChat as View } from '@/views/seller/chats';

export default function Page() {
  return (
    <Suspense>
      <View />
    </Suspense>
  );
}
