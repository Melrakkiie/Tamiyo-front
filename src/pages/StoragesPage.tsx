import { Alert, Badge, Button, Card, Center, Group, Loader, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';

import { errorMessage } from '../api/errors';
import { StorageFormModal } from '../storages/StorageFormModal';
import { useAllStorages, useCreateStorage } from '../storages/api';

export function StoragesPage() {
  const navigate = useNavigate();
  const storages = useAllStorages();
  const create = useCreateStorage();
  const [createOpened, setCreateOpened] = useState(false);

  function closeCreate() {
    setCreateOpened(false);
    create.reset();
  }

  return (
    <Stack>
      <Group justify="space-between">
        <div>
          <Title order={2}>Rangements</Title>
          {storages.data && (
            <Text size="sm" c="dimmed">
              {storages.data.length} rangement{storages.data.length > 1 ? 's' : ''}
            </Text>
          )}
        </div>
        <Button onClick={() => setCreateOpened(true)}>Nouveau rangement</Button>
      </Group>

      {storages.error && <Alert color="red">{errorMessage(storages.error)}</Alert>}

      {storages.isLoading ? (
        <Center p="xl">
          <Loader />
        </Center>
      ) : storages.data?.length === 0 ? (
        <Center p="xl">
          <Text c="dimmed">Aucun rangement pour le moment. Crée ton premier classeur ou ta première boîte.</Text>
        </Center>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
          {storages.data?.map((storage) => (
            <Card key={storage.id} withBorder component={Link} to={`/storages/${storage.id}`}>
              <Group justify="space-between" wrap="nowrap">
                <Text fw={600} lineClamp={1}>
                  {storage.name}
                </Text>
                <Badge variant="light">{storage.type}</Badge>
              </Group>
              <Text size="sm" c="dimmed">
                {storage.card_count} carte{storage.card_count > 1 ? 's' : ''}
              </Text>
            </Card>
          ))}
        </SimpleGrid>
      )}

      <StorageFormModal
        opened={createOpened}
        onClose={closeCreate}
        title="Nouveau rangement"
        submitLabel="Créer"
        pending={create.isPending}
        error={create.error}
        onSubmit={(values) =>
          create.mutate(values, {
            onSuccess: (created) => {
              notifications.show({ color: 'green', message: `${created.name} a été créé.` });
              closeCreate();
              navigate(`/storages/${created.id}`);
            },
          })
        }
      />
    </Stack>
  );
}
