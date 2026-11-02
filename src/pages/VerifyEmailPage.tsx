import { Alert, Anchor, Button, Center, Loader, Stack, Text, Title } from '@mantine/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router';

import { errorMessage } from '../api/errors';
import { verifyEmail } from '../auth/actions';
import { ResendVerificationButton } from '../auth/EmailVerification';
import { useSession } from '../auth/useSession';
import { usePageTitle } from '../layout/usePageTitle';

export function VerifyEmailPage() {
  usePageTitle("Confirmation de l'adresse mail");
  const token = useSearchParams()[0].get('token') ?? '';
  const authenticated = useSession().status === 'authenticated';
  const queryClient = useQueryClient();
  const submitted = useRef(false);

  const mutation = useMutation({
    mutationFn: verifyEmail,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['account'] }),
  });

  useEffect(() => {
    if (token && !submitted.current) {
      submitted.current = true;
      mutation.mutate(token);
    }
  }, [token]);

  const home = (
    <Button component={Link} to={authenticated ? '/decks' : '/login'} fullWidth>
      {authenticated ? 'Voir mes decks' : 'Se connecter'}
    </Button>
  );

  if (mutation.isSuccess) {
    return (
      <Stack>
        <Title order={2} size="h3">
          Adresse mail confirmée
        </Title>
        <Text size="sm">
          Merci ! Tes decks sont désormais partagés selon leur visibilité. Si tu viens de changer d'adresse, c'est avec
          elle que tu te connectes maintenant.
        </Text>
        {home}
      </Stack>
    );
  }

  if (token && !mutation.error) {
    return (
      <Center p="lg">
        <Loader />
      </Center>
    );
  }

  return (
    <Stack>
      <Title order={2} size="h3">
        Confirmer l'adresse mail
      </Title>
      <Alert color="red">
        {mutation.error
          ? errorMessage(mutation.error, {
              400: 'Ce lien est invalide, a expiré ou a déjà servi.',
              409: 'Cette adresse a été prise par un autre compte entre-temps.',
            })
          : 'Il manque le code de confirmation : ouvre le lien reçu par mail.'}
      </Alert>
      {authenticated ? (
        <ResendVerificationButton variant="filled" />
      ) : (
        <Text size="sm">
          <Anchor component={Link} to="/login">
            Connecte-toi
          </Anchor>{' '}
          pour recevoir un nouveau lien.
        </Text>
      )}
    </Stack>
  );
}
