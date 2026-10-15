import { Alert, Button, Card, Center, Group, Loader, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';

import { errorMessage } from '../api/errors';
import { useCardContextMenu } from '../cards/CardContextMenu';
import { formatPrice, PriceText, usePriceCurrency } from '../cards/price';
import { capitalize, groupByRecent } from '../layout/groupByRecent';
import { StorageFormModal } from '../storages/StorageFormModal';
import { useAllStorages, useCreateStorage } from '../storages/api';
import { StorageArt } from '../storages/StorageArt';
import { LockIcon } from '../storages/StorageLabel';
import { useStorageTileMenu } from '../storages/useStorageTileMenu';
import { EmptyNote } from '../theme/EmptyNote';
import { SectionTitle } from '../theme/SectionTitle';
import { Sticker } from '../theme/Sticker';
import { tapeProps } from '../theme/tape';
import { usePageTitle } from '../layout/usePageTitle';

const storageTypeLabels: Record<string, string> = {
  binder: 'Classeurs',
  box: 'Boîtes',
  deckbox: 'Deckbox',
};

function storageTypeLabel(type: string) {
  return storageTypeLabels[type] ?? capitalize(type);
}

export function StoragesPage() {
  usePageTitle('Rangements');
  const navigate = useNavigate();
  const storages = useAllStorages();
  const create = useCreateStorage();
  const [createOpened, setCreateOpened] = useState(false);
  const contextMenu = useCardContextMenu();
  const storageMenu = useStorageTileMenu();
  const currency = usePriceCurrency();

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
        <EmptyNote
          title="Aucun rangement pour le moment"
          note="crée ton premier classeur ou ta première boîte, juste là"
          arrow="up-right"
        />
      ) : (
        <Stack gap="xl">
          {groupByRecent(storages.data ?? [], (storage) => storage.type, storageTypeLabel).map((group) => (
            <Stack key={group.key} gap="md">
              <SectionTitle count={group.items.length}>{group.label}</SectionTitle>
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl" verticalSpacing="xl" pt={6}>
                {group.items.map((storage) => (
                  <div key={storage.id} {...tapeProps(`storage-${storage.id}`)}>
                    <Card
                      withBorder
                      shadow="sm"
                      h="100%"
                      component={Link}
                      to={`/storages/${storage.id}`}
                      className="tamiyo-touch-menu"
                      onContextMenu={(event) => contextMenu.open(event, storageMenu.menuFor(storage))}
                    >
                      <Group gap="md" wrap="nowrap">
                        <StorageArt type={storage.type} />
                        <Stack gap={2} style={{ minWidth: 0 }}>
                          <Group gap={8} wrap="nowrap">
                            <Text ff="heading" fw={600} size="lg" lineClamp={1}>
                              {storage.name}
                            </Text>
                            {storage.locked && (
                              <Sticker
                                tone="prune"
                                size="xs"
                                tilt={-3}
                                icon={<LockIcon size={13} />}
                                title={
                                  storage.allowed_deck_ids.length > 0
                                    ? 'Verrouillé, sauf pour quelques decks'
                                    : 'Verrouillé pour tous les decks'
                                }
                              >
                                {storage.allowed_deck_ids.length > 0 ? 'réservé' : 'verrouillé'}
                              </Sticker>
                            )}
                          </Group>
                          <Text className="tamiyo-hand" size="lg" c="dimmed">
                            {storage.card_count === 0
                              ? 'encore vide'
                              : `${storage.card_count} carte${storage.card_count > 1 ? 's' : ''}`}
                            {currency && storage.card_count > 0 && (
                              <>
                                {' · '}
                                <PriceText span inherit>
                                  {formatPrice(storage.value[currency], currency)}
                                </PriceText>
                              </>
                            )}
                          </Text>
                        </Stack>
                      </Group>
                    </Card>
                  </div>
                ))}
              </SimpleGrid>
            </Stack>
          ))}
        </Stack>
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
      {storageMenu.modals}
      {contextMenu.element}
    </Stack>
  );
}
