import { Stack, Title } from "@mantine/core";

import { RegisterForm } from "../auth/RegisterForm";
import { usePageTitle } from "../layout/usePageTitle";

export function RegisterPage() {
  usePageTitle("Inscription");
  return (
    <Stack>
      <Title order={2} size="h3">
        Créer un compte
      </Title>
      <RegisterForm />
    </Stack>
  );
}
