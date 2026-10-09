import { Suspense } from 'react';
import View from '@/views/client/part';

export default function Page() {
  return (
    <Suspense>
      <View />
    </Suspense>
  );
}
