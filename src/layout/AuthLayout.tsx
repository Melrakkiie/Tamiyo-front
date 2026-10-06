import { Center, Container, Paper, Stack, Text, Title } from '@mantine/core';
import { Outlet } from 'react-router';

export function AuthLayout() {
  return (
    <Center mih="100vh" p="md">
      <Container size={420} w="100%">
        <Stack gap="xs" align="center" mb="lg">
          <Title order={1}>Tamiyo</Title>
          <Text c="dimmed" size="sm">
            Ta collection Magic, rangée.
          </Text>
        </Stack>
        <Paper withBorder shadow="sm" p="xl">
          <Outlet />
        </Paper>
      </Container>
    </Center>
  );
}
