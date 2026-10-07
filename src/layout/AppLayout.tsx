import {
  AppShell,
  Box,
  Burger,
  Button,
  Drawer,
  Group,
  Menu,
  NavLink,
  Text,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router';

import { useAccount } from '../auth/account';
import { logout } from '../auth/actions';
import { UserAvatar } from '../auth/UserAvatar';
import { showCardPreview } from './cardPreview';
import { CardPreviewPanel } from './CardPreviewPanel';
import { FanContentNotice } from './FanContentNotice';

interface NavItem {
  label: string;
  to: string;
}

const navItems: NavItem[] = [
  { label: 'Accueil', to: '/' },
  { label: 'Collection', to: '/cards' },
  { label: 'Rangements', to: '/storages' },
  { label: 'Decks', to: '/decks' },
  { label: 'Import / export', to: '/import-export' },
];

const pagesWithCards = /^\/(cards|storages\/[^/]+|decks\/[^/]+)\/?$/;

function isActive(item: NavItem, pathname: string) {
  return item.to === '/' ? pathname === '/' : pathname.startsWith(item.to);
}

export function AppLayout() {
  const [opened, { toggle, close }] = useDisclosure();
  const { pathname } = useLocation();
  const account = useAccount();
  const displayName = account.data?.display_name;
  const showPreview = pagesWithCards.test(pathname);

  useEffect(() => {
    showCardPreview(null);
    close();
  }, [pathname]);

  function handleLogout() {
    void logout();
  }

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: { sm: 300, lg: 360 }, breakpoint: 'sm', collapsed: { mobile: true, desktop: !showPreview } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="lg" wrap="nowrap">
            <Group gap="sm" wrap="nowrap">
              <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" aria-label="Menu" />
              <Title order={3}>Tamiyo</Title>
            </Group>
            <Group gap={4} visibleFrom="sm" wrap="nowrap">
              {navItems.map((item) => (
                <Button
                  key={item.to}
                  component={Link}
                  to={item.to}
                  variant={isActive(item, pathname) ? 'light' : 'subtle'}
                  color={isActive(item, pathname) ? undefined : 'gray'}
                  size="compact-md"
                >
                  {item.label}
                </Button>
              ))}
            </Group>
          </Group>
          <Menu position="bottom-end" width={240}>
            <Menu.Target>
              <UnstyledButton aria-label="Mon compte" style={{ borderRadius: '50%' }}>
                <UserAvatar size={40} />
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Box px="sm" py={6}>
                <Text size="sm" fw={600} truncate>
                  {displayName || 'Mon compte'}
                </Text>
                {account.data && (
                  <Text size="xs" c="dimmed" truncate>
                    {account.data.email}
                  </Text>
                )}
              </Box>
              <Menu.Divider />
              {account.data && (
                <Menu.Item component={Link} to={`/users/${account.data.id}`}>
                  Mon profil
                </Menu.Item>
              )}
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

      <Drawer opened={opened} onClose={close} title="Tamiyo" size={260}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            component={Link}
            to={item.to}
            label={item.label}
            active={isActive(item, pathname)}
            onClick={close}
          />
        ))}
      </Drawer>

      <AppShell.Navbar p="md">{showPreview && <CardPreviewPanel />}</AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
        <FanContentNotice />
      </AppShell.Main>
    </AppShell>
  );
}
