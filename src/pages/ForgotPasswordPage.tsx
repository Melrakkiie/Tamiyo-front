import { Alert, Anchor, Button, Stack, Text, TextInput, Title } from '@mantine/core';
import { isEmail, useForm } from '@mantine/form';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router';

import { errorMessage } from '../api/errors';
import { requestPasswordReset } from '../auth/actions';

type ForgotPasswordValues = { email: string };

export function ForgotPasswordPage() {
  const form = useForm<ForgotPasswordValues>({
    mode: 'uncontrolled',
    initialValues: { email: '' },
    validate: { email: isEmail('Email invalide') },
  });

  const mutation = useMutation({
    mutationFn: (values: ForgotPasswordValues) => requestPasswordReset(values.email),
  });

  return (
    <Stack>
      <Title order={2} size="h3">
        Mot de passe oublié
      </Title>

      {mutation.isSuccess ? (
        <Alert color="green">
          Si un compte existe avec cette adresse, un email avec un lien de réinitialisation vient
          d'être envoyé. Pense à vérifier tes spams.
        </Alert>
      ) : (
        <form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
          <Stack>
            <Text size="sm" c="dimmed">
              Indique ton email, on t'envoie un lien pour choisir un nouveau mot de passe.
            </Text>

            {mutation.error && <Alert color="red">{errorMessage(mutation.error)}</Alert>}

            <TextInput
              label="Email"
              type="email"
              autoComplete="email"
              key={form.key('email')}
              {...form.getInputProps('email')}
            />
            <Button type="submit" loading={mutation.isPending} fullWidth>
              Envoyer le lien
            </Button>
          </Stack>
        </form>
      )}

      <Text size="sm" ta="center">
        <Anchor component={Link} to="/login">
          Retour à la connexion
        </Anchor>
      </Text>
    </Stack>
  );
}
