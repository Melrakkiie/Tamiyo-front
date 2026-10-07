import { Alert, Button, Group, Paper, Stack, Text, TextInput, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';

import { errorMessage } from '../api/errors';
import { MAX_DISPLAY_NAME_LENGTH, useAccount, useUpdateDisplayName } from './account';

export function DisplayNameSection() {
  const account = useAccount();
  return (
    <Paper withBorder p="lg">
      <Stack>
        <Title order={3} size="h4">
          Pseudo
        </Title>
        <Text size="sm" c="dimmed">
          Le nom affiché dans Tamiyo à la place de ton adresse mail. Il ne sert pas à te connecter.
        </Text>
        {account.data ? (
          <DisplayNameForm key={account.data.display_name ?? ''} current={account.data.display_name} />
        ) : account.error ? (
          <Alert color="red">{errorMessage(account.error)}</Alert>
        ) : null}
      </Stack>
    </Paper>
  );
}

function DisplayNameForm({ current }: { current: string | null }) {
  const [value, setValue] = useState(current ?? '');
  const update = useUpdateDisplayName();
  const trimmed = value.trim();
  const unchanged = trimmed === (current ?? '');
  const length = [...trimmed].length;
  const tooLong = length > MAX_DISPLAY_NAME_LENGTH;

  function save(next: string | null) {
    update.mutate(next, {
      onSuccess: (account) =>
        notifications.show({
          color: 'green',
          message: account.display_name ? `Ton pseudo est maintenant ${account.display_name}.` : 'Pseudo retiré.',
        }),
    });
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!unchanged && !tooLong) {
          save(trimmed || null);
        }
      }}
    >
      <Stack>
        {update.error && <Alert color="red">{errorMessage(update.error)}</Alert>}
        <TextInput
          label="Pseudo"
          placeholder="Aucun pseudo"
          value={value}
          onChange={(event) => setValue(event.currentTarget.value)}
          error={tooLong ? `${MAX_DISPLAY_NAME_LENGTH} caractères maximum` : undefined}
          description={`${length}/${MAX_DISPLAY_NAME_LENGTH}`}
        />
        <Group>
          <Button type="submit" loading={update.isPending} disabled={unchanged || tooLong}>
            Enregistrer
          </Button>
          {current && (
            <Button variant="subtle" color="gray" onClick={() => save(null)} disabled={update.isPending}>
              Retirer le pseudo
            </Button>
          )}
        </Group>
      </Stack>
    </form>
  );
}
