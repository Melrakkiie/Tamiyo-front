import { Alert, Button, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';

import { errorMessage } from '../api/errors';
import { type DetailsRefreshProgress, useRefreshCardDetails } from './api';

export function MissingDetailsAlert() {
  const [progress, setProgress] = useState<DetailsRefreshProgress | null>(null);
  const refreshDetails = useRefreshCardDetails(setProgress);

  function fillMissingDetails() {
    setProgress(null);
    refreshDetails.mutate(undefined, {
      onSuccess: ({ updated, notFound }) => {
        notifications.show({
          color: notFound > 0 ? 'yellow' : 'green',
          message:
            `${updated} carte${updated > 1 ? 's' : ''} complétée${updated > 1 ? 's' : ''}.` +
            (notFound > 0
              ? ` ${notFound} carte${notFound > 1 ? 's' : ''} introuvable${notFound > 1 ? 's' : ''} sur Scryfall.`
              : ''),
        });
      },
    });
  }

  return (
    <Alert color="yellow">
      <Stack gap="xs" align="flex-start">
        <Text size="sm">
          Certaines cartes ont été ajoutées avant que Tamiyo ne retienne leur couleur et leur type : elles sont
          classées à part. Tamiyo peut aller chercher ces informations sur Scryfall.
        </Text>
        {refreshDetails.isPending && progress && progress.remaining > 0 && (
          <Text size="sm">
            {progress.updated + progress.notFound} cartes traitées, encore {progress.remaining}…
          </Text>
        )}
        {refreshDetails.error && (
          <Text size="sm" c="red">
            {errorMessage(refreshDetails.error)}
            {progress && progress.updated > 0
              ? ` ${progress.updated} cartes ont quand même été complétées, relance pour finir.`
              : ''}
          </Text>
        )}
        <Button size="xs" onClick={fillMissingDetails} loading={refreshDetails.isPending}>
          Compléter depuis Scryfall
        </Button>
      </Stack>
    </Alert>
  );
}
