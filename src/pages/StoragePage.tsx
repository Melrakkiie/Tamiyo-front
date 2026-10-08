import { Alert, Anchor, Badge, Button, Center, Group, Loader, Stack, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';

import { ApiError, errorMessage } from '../api/errors';
import { CollectionExportMenu } from '../bulk/CollectionExportMenu';
import { CollectionImportModal } from '../bulk/CollectionImportModal';
import { CardBrowser } from '../cards/CardBrowser';
import { StorageFormModal } from '../storages/StorageFormModal';
import { useDeleteStorage, useStorage, useUpdateStorage } from '../storages/api';

const DECK_PAGE_SIZE = 100;

export function StoragePage() {
  const id = Number(useParams().id);
  return <StorageView key={id} id={id} />;
}

function StorageView({ id }: { id: number }) {
  const navigate = useNavigate();
  const storage = useStorage(id);
  const update = useUpdateStorage();
  const remove = useDeleteStorage();
  const [editOpened, setEditOpened] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [importOpened, setImportOpened] = useState(false);

  function closeEdit() {
    setEditOpened(false);
    update.reset();
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
    const notFound = storage.error instanceof ApiError && (storage.error.status === 404 || storage.error.status === 400);
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

  return (
    <Stack>
      {storage.error && <Alert color="orange">{errorMessage(storage.error)}</Alert>}
      <Anchor component={Link} to="/storages" size="sm">
        ← Rangements
      </Anchor>

      <Group justify="space-between" align="flex-start">
        <div>
          <Group gap="sm">
            <Title order={2}>{current.name}</Title>
            <Badge variant="light">{current.type}</Badge>
          </Group>
        </div>
        <Group gap="xs">
          <Button variant="default" onClick={() => setImportOpened(true)}>
            Importer
          </Button>
          <CollectionExportMenu storageId={current.id} />
          <Button variant="default" onClick={() => setEditOpened(true)}>
            Modifier
          </Button>
          {confirmingDelete ? (
            <>
              <Button color="red" onClick={deleteStorage} loading={remove.isPending}>
                Confirmer la suppression
              </Button>
              <Button variant="default" onClick={() => setConfirmingDelete(false)}>
                Annuler
              </Button>
            </>
          ) : (
            <Button color="red" variant="subtle" onClick={() => setConfirmingDelete(true)}>
              Supprimer
            </Button>
          )}
        </Group>
      </Group>

      {confirmingDelete && (
        <Alert color="orange">
          Supprimer ce rangement ne supprime pas ses cartes : elles restent dans ta collection, sans rangement.
        </Alert>
      )}
      {remove.error && <Alert color="red">{errorMessage(remove.error)}</Alert>}

      <CardBrowser
        storageId={current.id}
        pageSize={current.type.trim().toLowerCase() === 'deck' ? DECK_PAGE_SIZE : undefined}
      />

      <CollectionImportModal
        opened={importOpened}
        onClose={() => setImportOpened(false)}
        storage={{ id: current.id, name: current.name }}
      />

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
