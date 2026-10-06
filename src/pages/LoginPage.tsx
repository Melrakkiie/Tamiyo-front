import { Alert, Anchor, Button, Group, PasswordInput, Stack, Text, TextInput, Title } from '@mantine/core';
import { isEmail, isNotEmpty, useForm } from '@mantine/form';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router';

import { errorMessage } from '../api/errors';
import { login } from '../auth/actions';

type LoginValues = { email: string; password: string };

export function LoginPage() {
  const form = useForm<LoginValues>({
    mode: 'uncontrolled',
    initialValues: { email: '', password: '' },
    validate: {
      email: isEmail('Email invalide'),
      password: isNotEmpty('Mot de passe requis'),
    },
  });

  const mutation = useMutation({
    mutationFn: (values: LoginValues) => login(values.email, values.password),
  });

  return (
    <form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
      <Stack>
        <Title order={2} size="h3">
          Connexion
        </Title>

        {mutation.error && (
          <Alert color="red">
            {errorMessage(mutation.error, { 401: 'Email ou mot de passe incorrect.' })}
          </Alert>
        )}

        <TextInput
          label="Email"
          type="email"
          autoComplete="email"
          key={form.key('email')}
          {...form.getInputProps('email')}
        />
        <PasswordInput
          label="Mot de passe"
          autoComplete="current-password"
          key={form.key('password')}
          {...form.getInputProps('password')}
        />

        <Group justify="flex-end">
          <Anchor component={Link} to="/forgot-password" size="sm">
            Mot de passe oublié ?
          </Anchor>
        </Group>

        <Button type="submit" loading={mutation.isPending} fullWidth>
          Se connecter
        </Button>

        <Text size="sm" ta="center">
          Pas encore de compte ?{' '}
          <Anchor component={Link} to="/register">
            Créer un compte
          </Anchor>
        </Text>
      </Stack>
    </form>
  );
}
