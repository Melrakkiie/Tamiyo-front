import { Alert, Anchor, Button, Center, Loader, Stack, Text, TextInput, Title } from '@mantine/core';
import { isNotEmpty, useForm } from '@mantine/form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router';

import { errorMessage } from '../api/errors';
import { confirmEmailChange } from '../auth/actions';
import { useSession } from '../auth/useSession';

export function ConfirmEmailPage() {
  const [searchParams] = useSearchParams();
  const tokenFromLink = searchParams.get('token') ?? '';
  const session = useSession();
  const queryClient = useQueryClient();
  const submitted = useRef(false);

  const form = useForm<{ token: string }>({
    mode: 'uncontrolled',
    initialValues: { token: tokenFromLink },
    validate: { token: isNotEmpty('Code de confirmation requis') },
  });

  const mutation = useMutation({
    mutationFn: (token: string) => confirmEmailChange(token.trim()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['account'] }),
  });

  useEffect(() => {
    if (tokenFromLink && !submitted.current) {
      submitted.current = true;
      mutation.mutate(tokenFromLink);
    }
  }, [tokenFromLink]);

  const authenticated = session.status === 'authenticated';

  if (mutation.isSuccess) {
    return (
      <Stack>
        <Title order={2} size="h3">
          Adresse mail changée
        </Title>
        <Text size="sm">
          Le changement est confirmé : c'est désormais avec ta nouvelle adresse que tu te connectes. Un mail de
          confirmation vient d'y être envoyé.
        </Text>
        <Button component={Link} to={authenticated ? '/settings' : '/login'} fullWidth>
          {authenticated ? 'Retour aux paramètres' : 'Se connecter'}
        </Button>
      </Stack>
    );
  }

  if (tokenFromLink && !mutation.error) {
    return (
      <Center p="lg">
        <Loader />
      </Center>
    );
  }

  return (
    <form onSubmit={form.onSubmit((values) => mutation.mutate(values.token))}>
      <Stack>
        <Title order={2} size="h3">
          Confirmer le changement d'adresse
        </Title>

        {mutation.error && (
          <Alert color="red">
            {errorMessage(mutation.error, {
              401: 'Ce lien est invalide, a expiré ou a déjà servi. Redemande un changement depuis tes paramètres.',
              409: 'Cette adresse a été prise par un autre compte entre-temps.',
            })}
          </Alert>
        )}

        {!tokenFromLink && (
          <>
            <TextInput
              label="Code de confirmation"
              description="Le code reçu par mail à ton adresse actuelle"
              key={form.key('token')}
              {...form.getInputProps('token')}
            />
            <Button type="submit" loading={mutation.isPending} fullWidth>
              Confirmer
            </Button>
          </>
        )}

        <Text size="sm" ta="center">
          <Anchor component={Link} to={authenticated ? '/settings' : '/login'}>
            {authenticated ? 'Retour aux paramètres' : 'Retour à la connexion'}
          </Anchor>
        </Text>
      </Stack>
    </form>
  );
}
