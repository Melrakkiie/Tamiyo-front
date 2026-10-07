import { Alert, Button, Paper, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core';
import { isEmail, isNotEmpty, useForm } from '@mantine/form';
import { useMutation } from '@tanstack/react-query';

import { errorMessage } from '../api/errors';
import { useAccount } from './account';
import { requestEmailChange } from './actions';

type ChangeEmailValues = { newEmail: string; confirmEmail: string; currentPassword: string };

function normalizedEmail(value: string) {
  return value.trim().toLowerCase();
}

export function ChangeEmailSection() {
  const account = useAccount();
  const form = useForm<ChangeEmailValues>({
    mode: 'uncontrolled',
    initialValues: { newEmail: '', confirmEmail: '', currentPassword: '' },
    validate: {
      newEmail: isEmail('Adresse mail invalide'),
      confirmEmail: (value, values) =>
        normalizedEmail(value) === normalizedEmail(values.newEmail) ? null : 'Les deux adresses ne correspondent pas',
      currentPassword: isNotEmpty('Mot de passe actuel requis'),
    },
  });

  const mutation = useMutation({
    mutationFn: (values: ChangeEmailValues) => requestEmailChange(values.currentPassword, values.newEmail.trim()),
    onSuccess: () => form.reset(),
  });

  return (
    <Paper withBorder p="lg">
      <form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
        <Stack>
          <Title order={3} size="h4">
            Changer d'adresse mail
          </Title>
          <Text size="sm" c="dimmed">
            {account.data ? (
              <>
                Adresse actuelle : <strong>{account.data.email}</strong>.{' '}
              </>
            ) : null}
            Pour ta sécurité, on envoie un lien de confirmation à ton adresse actuelle : la nouvelle ne la remplace
            qu'une fois ce lien ouvert.
          </Text>

          {mutation.isSuccess && mutation.variables && (
            <Alert color="green">
              Lien de confirmation envoyé à {account.data?.email ?? 'ton adresse actuelle'}. Ouvre-le pour passer à{' '}
              {mutation.variables.newEmail.trim()} : d'ici là, tu continues à te connecter avec ton adresse actuelle.
            </Alert>
          )}
          {mutation.error && (
            <Alert color="red">
              {errorMessage(mutation.error, {
                400: "C'est déjà ton adresse actuelle.",
                401: 'Mot de passe actuel incorrect.',
                409: 'Cette adresse est déjà utilisée par un autre compte.',
              })}
            </Alert>
          )}

          <TextInput
            label="Nouvelle adresse mail"
            type="email"
            autoComplete="email"
            key={form.key('newEmail')}
            {...form.getInputProps('newEmail')}
          />
          <TextInput
            label="Confirmer la nouvelle adresse"
            type="email"
            autoComplete="email"
            key={form.key('confirmEmail')}
            {...form.getInputProps('confirmEmail')}
          />
          <PasswordInput
            label="Mot de passe actuel"
            autoComplete="current-password"
            key={form.key('currentPassword')}
            {...form.getInputProps('currentPassword')}
          />

          <Button type="submit" loading={mutation.isPending} w="fit-content">
            Envoyer le lien de confirmation
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}
