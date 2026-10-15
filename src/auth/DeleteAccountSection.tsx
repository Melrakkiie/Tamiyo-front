import { Alert, Button, Paper, PasswordInput, Stack, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { errorMessage } from '../api/errors';
import { deleteAccount } from './actions';

const CONFIRMATION_WORD = 'SUPPRIMER';

export function DeleteAccountSection() {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');

  const mutation = useMutation({
    mutationFn: () => deleteAccount(password),
    onSuccess: () => {
      notifications.show({ color: 'green', message: 'Ton compte a été supprimé.' });
    },
  });

  const confirmed = password !== '' && confirmation.trim() === CONFIRMATION_WORD;

  return (
    <Paper withBorder p="lg" style={{ borderColor: 'var(--mantine-color-red-filled)' }}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (confirmed) mutation.mutate();
        }}
      >
        <Stack>
          <div>
            <Text fw={500}>Supprimer mon compte</Text>
            <Text size="sm" c="dimmed">
              Supprime définitivement ton compte et tout ce qu'il contient : ta collection, tes rangements, tes decks
              (avec leurs cartes à rajouter, tags, dossiers et liens de partage), tes likes, tes abonnements et tes
              abonnés, tes préférences et toutes tes sessions. Cette action est irréversible : pense à exporter ta
              collection et tes decks avant si tu veux les garder.
            </Text>
          </div>

          {mutation.error && (
            <Alert color="red">{errorMessage(mutation.error, { 401: 'Mot de passe incorrect.' })}</Alert>
          )}

          <PasswordInput
            maw={480}
            label="Mot de passe"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.currentTarget.value)}
          />
          <TextInput
            maw={480}
            label={`Pour confirmer, tape ${CONFIRMATION_WORD}`}
            value={confirmation}
            onChange={(event) => setConfirmation(event.currentTarget.value)}
            autoComplete="off"
          />
          <Button type="submit" color="red" disabled={!confirmed} loading={mutation.isPending} w="fit-content">
            Supprimer mon compte
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}
