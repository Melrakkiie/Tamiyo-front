import { Alert, Anchor, Button, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core';
import { hasLength, isNotEmpty, matchesField, useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router';

import { errorMessage } from '../api/errors';
import { resetPassword } from '../auth/actions';

type ResetPasswordValues = { token: string; password: string; confirmPassword: string };

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromLink = searchParams.get('token') ?? '';

  const form = useForm<ResetPasswordValues>({
    mode: 'uncontrolled',
    initialValues: { token: tokenFromLink, password: '', confirmPassword: '' },
    validate: {
      token: isNotEmpty('Code de réinitialisation requis'),
      password: hasLength({ min: 8 }, '8 caractères minimum'),
      confirmPassword: matchesField('password', 'Les mots de passe ne correspondent pas'),
    },
  });

  const mutation = useMutation({
    mutationFn: (values: ResetPasswordValues) => resetPassword(values.token, values.password),
    onSuccess: () => {
      notifications.show({
        color: 'green',
        title: 'Mot de passe modifié',
        message: 'Tu peux te connecter avec ton nouveau mot de passe.',
      });
      navigate('/login', { replace: true });
    },
  });

  return (
    <form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
      <Stack>
        <Title order={2} size="h3">
          Nouveau mot de passe
        </Title>

        {mutation.error && (
          <Alert color="red">
            {errorMessage(mutation.error, {
              401: 'Ce lien est invalide ou a expiré. Demande un nouveau lien.',
            })}
          </Alert>
        )}

        {!tokenFromLink && (
          <TextInput
            label="Code de réinitialisation"
            description="Le code reçu par email"
            key={form.key('token')}
            {...form.getInputProps('token')}
          />
        )}
        <PasswordInput
          label="Nouveau mot de passe"
          description="8 caractères minimum"
          autoComplete="new-password"
          key={form.key('password')}
          {...form.getInputProps('password')}
        />
        <PasswordInput
          label="Confirmer le mot de passe"
          autoComplete="new-password"
          key={form.key('confirmPassword')}
          {...form.getInputProps('confirmPassword')}
        />

        <Button type="submit" loading={mutation.isPending} fullWidth>
          Changer mon mot de passe
        </Button>

        <Text size="sm" ta="center">
          <Anchor component={Link} to="/forgot-password">
            Demander un nouveau lien
          </Anchor>
        </Text>
      </Stack>
    </form>
  );
}
