import { Alert, Anchor, Button, Center, Group, Loader, Menu, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';

import { ApiError, errorMessage } from '../api/errors';
import { type CollectionExport, useExportCollection } from '../bulk/api';
import { CollectionImportModal } from '../bulk/CollectionImportModal';
import { CardBrowser } from '../cards/CardBrowser';
import { formatPrice, PriceText, usePriceCurrency } from '../cards/price';
import { useAllDecks } from '../decks/api';
import { Sticker } from '../theme/Sticker';
import { SettingsMenu } from '../layout/SettingsMenu';
import { StorageFormModal } from '../storages/StorageFormModal';
import { LockIcon } from '../storages/StorageLabel';
import { StorageLockModal } from '../storages/StorageLockModal';
import { useDeleteStorage, useStorage, useUpdateStorage } from '../storages/api';
import { usePageTitle } from '../layout/usePageTitle';

const DECK_PAGE_SIZE = 96;

export function StoragePage() {
  const id = Number(useParams().id);
  return <StorageView key={id} id={id} />;
}

function StorageView({ id }: { id: number }) {
  const navigate = useNavigate();
  const storage = useStorage(id);
  usePageTitle(storage.data?.name ?? 'Rangement');
  const update = useUpdateStorage();
  const remove = useDeleteStorage();
  const [editOpened, setEditOpened] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [importOpened, setImportOpened] = useState(false);
  const [lockOpened, setLockOpened] = useState(false);
  const decks = useAllDecks();
  const currency = usePriceCurrency();
  const exportStorage = useExportCollection(id);

  function closeEdit() {
    setEditOpened(false);
    update.reset();
  }

  function runExport(kind: CollectionExport) {
    exportStorage.mutate(kind, {
      onError: (err) => notifications.show({ color: 'red', message: errorMessage(err) }),
    });
  }

  function deleteStorage() {
    remove.mutate(id, {
      onSuccess: () => {
        notifications.show({
          color: 'green',
          message: `${storage.data?.name ?? 'Le rangement'} a été supprimé. Ses cartes restent dans ta collection.`,
        });
        navigate('/storages', { replace: true });
      },
    });
  }

  if (storage.isLoading) {
    return (
      <Center p="xl">
        <Loader />
      </Center>
    );
  }

  if (!storage.data) {
    const notFound =
      storage.error instanceof ApiError && (storage.error.status === 404 || storage.error.status === 400);
    return (
      <Stack align="flex-start">
        <Alert color="red">
          {notFound ? "Ce rangement n'existe pas ou a été supprimé." : errorMessage(storage.error)}
        </Alert>
        <Anchor component={Link} to="/storages">
          Retour aux rangements
        </Anchor>
      </Stack>
    );
  }

  const current = storage.data;
  const deckNames = new Map((decks.data ?? []).map((deck) => [deck.id, deck.name]));
  const allowedNames = current.allowed_deck_ids.flatMap((deckId) => deckNames.get(deckId) ?? []);

  return (
    <Stack>
      {storage.error && <Alert color="orange">{errorMessage(storage.error)}</Alert>}
      <Anchor component={Link} to="/storages" size="sm">
        ← Rangements
      </Anchor>

      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <div style={{ minWidth: 0 }}>
          <Group gap="sm">
            <Title order={2}>{current.name}</Title>
            <Sticker tone="paper" tilt={-2}>
              {current.type}
            </Sticker>
          </Group>
          {currency && <PriceText mt={4}>Valeur : {formatPrice(current.value[currency], currency)}</PriceText>}
          {current.locked && (
            <Group gap={6} wrap="nowrap" c="dimmed" mt={4}>
              <LockIcon size={14} />
              <Text size="sm" c="dimmed">
                {allowedNames.length > 0
                  ? `Verrouillé · réservé à ${allowedNames.join(', ')}`
                  : 'Verrouillé pour tous les decks'}
              </Text>
            </Group>
          )}
        </div>
        <SettingsMenu label="Actions sur le rangement">
          <Menu.Item onClick={() => setImportOpened(true)}>Importer des cartes</Menu.Item>
          <Menu.Label>Exporter ce rangement (CSV)</Menu.Label>
          <Menu.Item onClick={() => runExport('manabox')} disabled={exportStorage.isPending}>
            Pour ManaBox
          </Menu.Item>
          <Menu.Item onClick={() => runExport('moxfield')} disabled={exportStorage.isPending}>
            Pour Moxfield
          </Menu.Item>
          <Menu.Label>Exporter ce rangement (JSON)</Menu.Label>
          <Menu.Item onClick={() => runExport('tamiyo')} disabled={exportStorage.isPending}>
            Pour Tamiyo
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item onClick={() => setEditOpened(true)}>Modifier</Menu.Item>
          <Menu.Item onClick={() => setLockOpened(true)}>Verrouiller pour les decks…</Menu.Item>
          <Menu.Item color="red" onClick={() => setConfirmingDelete(true)}>
            Supprimer
          </Menu.Item>
        </SettingsMenu>
      </Group>

      {confirmingDelete && (
        <Alert color="orange" title="Supprimer ce rangement ?">
          <Stack gap="sm">
            <Text size="sm">Ses cartes ne sont pas supprimées : elles restent dans ta collection, sans rangement.</Text>
            <Group gap="xs">
              <Button color="red" onClick={deleteStorage} loading={remove.isPending}>
                Confirmer la suppression
              </Button>
              <Button variant="default" onClick={() => setConfirmingDelete(false)}>
                Annuler
              </Button>
            </Group>
          </Stack>
        </Alert>
      )}
      {remove.error && <Alert color="red">{errorMessage(remove.error)}</Alert>}

      <CardBrowser
        storageId={current.id}
        pageSize={current.type.trim().toLowerCase() === 'deckbox' ? DECK_PAGE_SIZE : undefined}
      />

      <CollectionImportModal
        opened={importOpened}
        onClose={() => setImportOpened(false)}
        storage={{ id: current.id, name: current.name }}
      />

      <StorageLockModal storage={current} opened={lockOpened} onClose={() => setLockOpened(false)} />

      <StorageFormModal
        opened={editOpened}
        onClose={closeEdit}
        title="Modifier le rangement"
        submitLabel="Enregistrer"
        initial={current}
        pending={update.isPending}
        error={update.error}
        onSubmit={(values) =>
          update.mutate(
            { id: current.id, changes: values },
            {
              onSuccess: () => {
                notifications.show({ color: 'green', message: 'Rangement mis à jour.' });
                closeEdit();
              },
            },
          )
        }
      />
    </Stack>
  );
}
