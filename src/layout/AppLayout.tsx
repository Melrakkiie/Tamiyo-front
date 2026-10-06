import { AppShell, Burger, Button, Group, Menu, NavLink, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Link, Outlet, useLocation } from 'react-router';

import { logout } from '../auth/actions';

interface NavItem {
  label: string;
  to: string;
  ready: boolean;
}

const navItems: NavItem[] = [
  { label: 'Accueil', to: '/', ready: true },
  { label: 'Collection', to: '/cards', ready: false },
  { label: 'Rangements', to: '/storages', ready: false },
  { label: 'Decks', to: '/decks', ready: false },
  { label: 'Import / export', to: '/import-export', ready: false },
];

export function AppLayout() {
  const [opened, { toggle, close }] = useDisclosure();
  const { pathname } = useLocation();
  function handleLogout() {
    void logout();
  }

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 240, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" aria-label="Menu" />
            <Title order={3}>Tamiyo</Title>
          </Group>
          <Menu position="bottom-end" width={200}>
            <Menu.Target>
              <Button variant="subtle">Mon compte</Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item component={Link} to="/settings">
                Paramètres
              </Menu.Item>
              <Menu.Item color="red" onClick={handleLogout}>
                Se déconnecter
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        {navItems.map((item) =>
          item.ready ? (
            <NavLink
              key={item.to}
              component={Link}
              to={item.to}
              label={item.label}
              active={pathname === item.to}
              onClick={close}
            />
          ) : (
            <NavLink key={item.to} label={item.label} description="Bientôt" disabled />
          ),
        )}
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
