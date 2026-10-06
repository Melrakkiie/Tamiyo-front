import { Alert, Button, Paper, Stack, Text, TextInput, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';

import { errorMessage } from '../api/errors';
import { useCards, useDeleteAllCards } from './api';

const CONFIRMATION_WORD = 'SUPPRIMER';

export function DeleteCollectionSection() {
  const collection = useCards({ page: 1, limit: 1, sort: '-updated', name: '', storageId: undefined });
  const remove = useDeleteAllCards();
  const [confirmation, setConfirmation] = useState('');

  const total = collection.data?.total ?? 0;
  const confirmed = confirmation.trim() === CONFIRMATION_WORD;

  function deleteCollection() {
    remove.mutate(undefined, {
      onSuccess: (deleted) => {
        notifications.show({
          color: 'green',
          message: `${deleted} carte${deleted > 1 ? 's' : ''} supprimée${deleted > 1 ? 's' : ''}. Tes rangements et tes decks sont conservés.`,
        });
        setConfirmation('');
      },
    });
  }

  return (
    <Paper withBorder p="lg" style={{ borderColor: 'var(--mantine-color-red-filled)' }}>
      <Stack>
        <Title order={3} size="h4" c="red">
          Zone de danger
        </Title>
        <div>
          <Text fw={500}>Supprimer toute la collection</Text>
          <Text size="sm" c="dimmed">
            Supprime définitivement tes {total} carte{total > 1 ? 's' : ''}. Tes rangements et tes decks sont
            conservés, mais vidés. Cette action est irréversible : pense à exporter ta collection avant si tu
            veux pouvoir la réimporter.
          </Text>
        </div>

        {remove.error && <Alert color="red">{errorMessage(remove.error)}</Alert>}

        <TextInput
          label={`Pour confirmer, tape ${CONFIRMATION_WORD}`}
          value={confirmation}
          onChange={(event) => setConfirmation(event.currentTarget.value)}
          disabled={total === 0}
          autoComplete="off"
        />
        <Button
          color="red"
          onClick={deleteCollection}
          disabled={!confirmed || total === 0}
          loading={remove.isPending}
          w="fit-content"
        >
          Supprimer {total} carte{total > 1 ? 's' : ''}
        </Button>
      </Stack>
    </Paper>
  );
}
