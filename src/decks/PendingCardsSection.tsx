import { Alert, Button, Group, Paper, Select, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';

import { errorMessage } from '../api/errors';
import type { PendingCard } from '../api/types';
import { useStorageOptions } from '../storages/api';
import { useCommitPendingCards } from './api';

export function PendingCardsSection({ deckId, pending }: { deckId: string; pending: PendingCard[] }) {
  const storageOptions = useStorageOptions();
  const commit = useCommitPendingCards();
  const [storageId, setStorageId] = useState<string | null>(null);

  const total = pending.filter((item) => item.board !== 'considering').reduce((sum, item) => sum + item.quantity, 0);
  const considering = pending.some((item) => item.board === 'considering');
  if (total === 0) {
    return null;
  }

  function commitAll() {
    commit.mutate(
      { deckId, storageId: storageId ? Number(storageId) : null },
      {
        onSuccess: ({ cards_created }) => {
          notifications.show({
            color: 'green',
            message: `${cards_created} carte${cards_created > 1 ? 's' : ''} ajoutée${cards_created > 1 ? 's' : ''} à ta collection.`,
          });
        },
      },
    );
  }

  return (
    <Paper withBorder radius="md" p="md" style={{ borderColor: 'var(--mantine-color-orange-6)' }}>
      <Stack gap="sm">
        <Text size="sm">
          {total > 1
            ? `${total} cartes de ce deck ne sont pas encore dans ta collection`
            : "Une carte de ce deck n'est pas encore dans ta collection"}{' '}
          (marquée{total > 1 ? 's' : ''} « Manquante », ou « Autre édition » quand tu en as une autre version). Quand tu
          les as, ajoute-les toutes d'un coup.
          {considering && ' Celles de la section Considering restent de côté : ajoute-les une par une.'}
        </Text>
        {commit.error && (
          <Alert color="red">
            {errorMessage(commit.error, { 400: "Le rangement choisi n'existe plus. Choisis-en un autre." })}
          </Alert>
        )}
        <Group align="flex-end" justify="space-between">
          <Select
            label="Rangement des nouvelles cartes"
            placeholder="Aucun rangement"
            data={storageOptions}
            value={storageId}
            onChange={setStorageId}
            clearable
            searchable
            w={260}
          />
          <Button color="orange" onClick={commitAll} loading={commit.isPending}>
            Tout ajouter à ma collection
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}
