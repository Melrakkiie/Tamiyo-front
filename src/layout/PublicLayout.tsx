import { AppShell, Button, Group, Title, UnstyledButton } from "@mantine/core";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

import { type AuthMode, AuthModal } from "../auth/AuthModal";
import { LunaMoth } from "../theme/LunaMoth";
import { pagesWithCards, showCardPreview } from "./cardPreview";
import { CardPreviewPanel } from "./CardPreviewPanel";
import { HeaderNavLink } from "./HeaderNavLink";
import { PageWithFooter } from "./PageWithFooter";

export function PublicLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const showPreview = pagesWithCards.test(location.pathname);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);

  useEffect(() => {
    showCardPreview(null);
  }, [location.pathname]);

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{
        width: { sm: 300, lg: 360 },
        breakpoint: "sm",
        collapsed: { mobile: true, desktop: !showPreview },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="lg" wrap="nowrap">
            <UnstyledButton component={Link} to="/">
              <Group gap={8} wrap="nowrap">
                <LunaMoth size={30} />
                <Title order={3}>Tamiyo</Title>
              </Group>
            </UnstyledButton>
            <Group gap={4} wrap="nowrap">
              <HeaderNavLink
                label="Explorer"
                to="/explorer"
                active={location.pathname.startsWith("/explorer")}
              />
              <HeaderNavLink
                label="Aide"
                to="/aide"
                active={location.pathname.startsWith("/aide")}
              />
            </Group>
          </Group>
          <Group gap="xs" wrap="nowrap">
            <Button
              variant="default"
              size="compact-md"
              onClick={() => setAuthMode("login")}
            >
              Se connecter
            </Button>
            <Button size="compact-md" onClick={() => setAuthMode("register")}>
              Créer un compte
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        {showPreview && <CardPreviewPanel />}
      </AppShell.Navbar>

      <AppShell.Main>
        <PageWithFooter />
      </AppShell.Main>

      <AuthModal
        mode={authMode}
        onModeChange={setAuthMode}
        onClose={() => setAuthMode(null)}
        onAuthenticated={() => {
          if (
            location.pathname.startsWith("/explorer") ||
            location.pathname.startsWith("/aide")
          ) {
            navigate("/", { replace: true });
          }
        }}
      />
    </AppShell>
  );
}
