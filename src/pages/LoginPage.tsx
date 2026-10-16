import { Stack, Title } from "@mantine/core";

import { LoginForm } from "../auth/LoginForm";
import { usePageTitle } from "../layout/usePageTitle";

export function LoginPage() {
  usePageTitle("Connexion");
  return (
    <Stack>
      <Title order={2} size="h3">
        Connexion
      </Title>
      <LoginForm />
    </Stack>
  );
}
