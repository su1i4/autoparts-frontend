import { Suspense } from 'react';
import View from '@/views/client/garage';

export const metadata = { title: 'Гараж' };

export default function Page() {
  return (
    <Suspense>
      <View />
    </Suspense>
  );
}
