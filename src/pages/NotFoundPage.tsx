import { Anchor, Center, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <Center mih="100vh">
      <Stack align="center" gap="xs">
        <Title order={2}>Page introuvable</Title>
        <Text c="dimmed">Cette page n'existe pas.</Text>
        <Anchor component={Link} to="/">
          Retour à l'accueil
        </Anchor>
      </Stack>
    </Center>
  );
}
