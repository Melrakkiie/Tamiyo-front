import { AppShell, Box, Burger, Divider, Drawer, Group, Menu, NavLink, Text, Title, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Fragment, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router';

import { useAccount } from '../auth/account';
import { logout } from '../auth/actions';
import { UserAvatar } from '../auth/UserAvatar';
import { showCardPreview } from './cardPreview';
import { LunaMoth } from '../theme/LunaMoth';
import { CardPreviewPanel } from './CardPreviewPanel';
import { FanContentNotice } from './FanContentNotice';
import { NavMoth } from './NavMoth';

interface NavItem {
  label: string;
  to: string;
  separated?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Accueil', to: '/' },
  { label: 'Collection', to: '/cards' },
  { label: 'Rangements', to: '/storages' },
  { label: 'Decks', to: '/decks' },
  { label: 'Explorer', to: '/explorer', separated: true },
];

const pagesWithCards = /^\/(cards|storages\/[^/]+|decks\/[^/]+(\/comparer\/[^/]+)?)\/?$/;

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
              <UnstyledButton component={Link} to="/">
                <Group gap={8} wrap="nowrap">
                  <LunaMoth size={30} />
                  <Title order={3}>Tamiyo</Title>
                </Group>
              </UnstyledButton>
            </Group>
            <Group gap={4} visibleFrom="sm" wrap="nowrap">
              {navItems.map((item) => (
                <Fragment key={item.to}>
                  {item.separated && <Divider orientation="vertical" mx={6} my={4} />}
                  <UnstyledButton
                    component={Link}
                    to={item.to}
                    className="tamiyo-nav-link"
                    data-active={isActive(item, pathname) || undefined}
                    aria-current={isActive(item, pathname) ? 'page' : undefined}
                  >
                    {isActive(item, pathname) ? (
                      <>
                        {item.label.slice(0, -1)}
                        <span className="tamiyo-nav-perch">
                          {item.label.slice(-1)}
                          <NavMoth />
                        </span>
                      </>
                    ) : (
                      item.label
                    )}
                  </UnstyledButton>
                </Fragment>
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
              {account.data && (
                <Menu.Item component={Link} to={`/users/${account.data.id}/connexions`}>
                  Mes connexions
                </Menu.Item>
              )}
              <Menu.Item component={Link} to="/decks-aimes">
                Decks aimés
              </Menu.Item>
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
          <Fragment key={item.to}>
            {item.separated && <Divider my="xs" />}
            <NavLink
              component={Link}
              to={item.to}
              label={item.label}
              active={isActive(item, pathname)}
              onClick={close}
            />
          </Fragment>
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
