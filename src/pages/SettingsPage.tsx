import { Alert, Button, Paper, PasswordInput, Stack, Text, Title } from '@mantine/core';
import { hasLength, isNotEmpty, matchesField, useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useMutation } from '@tanstack/react-query';

import { errorMessage } from '../api/errors';
import { changePassword } from '../auth/actions';

type ChangePasswordValues = { currentPassword: string; newPassword: string; confirmPassword: string };

export function SettingsPage() {
  const form = useForm<ChangePasswordValues>({
    mode: 'uncontrolled',
    initialValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    validate: {
      currentPassword: isNotEmpty('Mot de passe actuel requis'),
      newPassword: hasLength({ min: 8 }, '8 caractères minimum'),
      confirmPassword: matchesField('newPassword', 'Les mots de passe ne correspondent pas'),
    },
  });

  const mutation = useMutation({
    mutationFn: (values: ChangePasswordValues) =>
      changePassword(values.currentPassword, values.newPassword),
    onSuccess: () => {
      notifications.show({
        color: 'green',
        title: 'Mot de passe modifié',
        message: 'Toutes tes sessions ont été fermées. Reconnecte-toi avec ton nouveau mot de passe.',
      });
    },
  });

  return (
    <Stack maw={480}>
      <Title order={2}>Paramètres</Title>

      <Paper withBorder p="lg">
        <form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
          <Stack>
            <Title order={3} size="h4">
              Changer de mot de passe
            </Title>
            <Text size="sm" c="dimmed">
              Toutes tes sessions seront fermées, y compris celle-ci : il faudra te reconnecter.
            </Text>

            {mutation.error && (
              <Alert color="red">
                {errorMessage(mutation.error, { 401: 'Mot de passe actuel incorrect.' })}
              </Alert>
            )}

            <PasswordInput
              label="Mot de passe actuel"
              autoComplete="current-password"
              key={form.key('currentPassword')}
              {...form.getInputProps('currentPassword')}
            />
            <PasswordInput
              label="Nouveau mot de passe"
              description="8 caractères minimum"
              autoComplete="new-password"
              key={form.key('newPassword')}
              {...form.getInputProps('newPassword')}
            />
            <PasswordInput
              label="Confirmer le nouveau mot de passe"
              autoComplete="new-password"
              key={form.key('confirmPassword')}
              {...form.getInputProps('confirmPassword')}
            />

            <Button type="submit" loading={mutation.isPending} w="fit-content">
              Changer mon mot de passe
            </Button>
          </Stack>
        </form>
      </Paper>
    </Stack>
  );
}
