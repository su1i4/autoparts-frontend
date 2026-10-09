import { Suspense } from 'react';
import View from '@/views/client/home';

export default function Page() {
  return (
    <Suspense>
      <View />
    </Suspense>
  );
}
