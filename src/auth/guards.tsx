import { Center, Loader } from '@mantine/core';
import { Navigate, Outlet, useLocation, type Location } from 'react-router';

import { useSession } from './useSession';

function FullPageLoader() {
  return (
    <Center h="100vh">
      <Loader />
    </Center>
  );
}

export function RequireAuth() {
  const { status } = useSession();
  const location = useLocation();

  if (status === 'unknown') {
    return <FullPageLoader />;
  }
  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

export function GuestOnly() {
  const { status } = useSession();
  const location = useLocation();

  if (status === 'unknown') {
    return <FullPageLoader />;
  }
  if (status === 'authenticated') {
    const from = (location.state as { from?: Location } | null)?.from;
    return <Navigate to={from ?? '/'} replace />;
  }
  return <Outlet />;
}
