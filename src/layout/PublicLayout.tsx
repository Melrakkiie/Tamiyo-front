import { AppShell, Burger, Button, Drawer, Group, NavLink, Title, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';

import { type AuthMode, AuthModal } from '../auth/AuthModal';
import { LunaMoth } from '../theme/LunaMoth';
import { pagesWithCards, showCardPreview } from './cardPreview';
import { CardPreviewPanel } from './CardPreviewPanel';
import { HeaderNavLink } from './HeaderNavLink';
import { PageWithFooter } from './PageWithFooter';

const navItems = [
  { label: 'Explorer', to: '/explorer' },
  { label: 'Aide', to: '/aide' },
];

export function PublicLayout() {
  const [opened, { toggle, close }] = useDisclosure();
  const location = useLocation();
  const navigate = useNavigate();
  const showPreview = pagesWithCards.test(location.pathname);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);

  useEffect(() => {
    showCardPreview(null);
    close();
  }, [location.pathname]);

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{
        width: { sm: 300, lg: 360 },
        breakpoint: 'sm',
        collapsed: { mobile: true, desktop: !showPreview },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="lg" wrap="nowrap">
            <Group gap="sm" wrap="nowrap">
              <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" aria-label="Menu" />
              <UnstyledButton component={Link} to="/" aria-label="Tamiyo">
                <Group gap={8} wrap="nowrap">
                  <LunaMoth size={30} />
                  <Title order={3} visibleFrom="xs">
                    Tamiyo
                  </Title>
                </Group>
              </UnstyledButton>
            </Group>
            <Group gap={4} visibleFrom="sm" wrap="nowrap">
              {navItems.map((item) => (
                <HeaderNavLink
                  key={item.to}
                  label={item.label}
                  to={item.to}
                  active={location.pathname.startsWith(item.to)}
                />
              ))}
            </Group>
          </Group>
          <Group gap="xs" wrap="nowrap">
            <Button variant="default" size="compact-sm" onClick={() => setAuthMode('login')}>
              Se connecter
            </Button>
            <Button size="compact-sm" onClick={() => setAuthMode('register')}>
              Créer un compte
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <Drawer opened={opened} onClose={close} title="Tamiyo" size={260}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            component={Link}
            to={item.to}
            label={item.label}
            active={location.pathname.startsWith(item.to)}
            onClick={close}
          />
        ))}
      </Drawer>

      <AppShell.Navbar p="md">{showPreview && <CardPreviewPanel />}</AppShell.Navbar>

      <AppShell.Main>
        <PageWithFooter />
      </AppShell.Main>

      <AuthModal
        mode={authMode}
        onModeChange={setAuthMode}
        onClose={() => setAuthMode(null)}
        onAuthenticated={() => {
          if (location.pathname.startsWith('/explorer') || location.pathname.startsWith('/aide')) {
            navigate('/', { replace: true });
          }
        }}
      />
    </AppShell>
  );
}
