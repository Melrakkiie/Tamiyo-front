import { AppShell, Button, Group, Title } from '@mantine/core';
import { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router';

import { showCardPreview } from './cardPreview';
import { CardPreviewPanel } from './CardPreviewPanel';
import { FanContentNotice } from './FanContentNotice';

export function PublicLayout() {
  const location = useLocation();

  useEffect(() => {
    showCardPreview(null);
  }, [location.pathname]);

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: { sm: 300, lg: 360 }, breakpoint: 'sm', collapsed: { mobile: true } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Title order={3}>Tamiyo</Title>
          <Group gap="xs" wrap="nowrap">
            <Button component={Link} to="/login" state={{ from: location }} variant="default" size="compact-md">
              Se connecter
            </Button>
            <Button component={Link} to="/register" state={{ from: location }} size="compact-md">
              Créer un compte
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <CardPreviewPanel />
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
        <FanContentNotice />
      </AppShell.Main>
    </AppShell>
  );
}
