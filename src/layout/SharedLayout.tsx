import { Center, Loader } from '@mantine/core';

import { useSession } from '../auth/useSession';
import { AppLayout } from './AppLayout';
import { PublicLayout } from './PublicLayout';

export function SharedLayout() {
  const { status } = useSession();

  if (status === 'unknown') {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }
  return status === 'authenticated' ? <AppLayout /> : <PublicLayout />;
}
