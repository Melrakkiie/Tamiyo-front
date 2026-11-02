import { Alert, Button, Text } from '@mantine/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { errorMessage } from '../api/errors';
import { useAccount } from './account';
import { resendVerificationEmail } from './actions';

export const unverifiedDecksNote =
  "Ton adresse mail n'est pas encore confirmée : tes decks ne sont partagés avec personne. Dès que tu la confirmes, ils le sont selon leur visibilité.";

export function useEmailUnverified() {
  return useAccount().data?.email_verified === false;
}

export function ResendVerificationButton({ variant = 'default' }: { variant?: string }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: resendVerificationEmail,
    // 409 means the address got verified elsewhere: refresh the account so the notice goes away.
    onError: () => queryClient.invalidateQueries({ queryKey: ['account'] }),
  });

  return (
    <>
      <Button size="xs" variant={variant} loading={mutation.isPending} onClick={() => mutation.mutate()}>
        Renvoyer le lien de confirmation
      </Button>
      {mutation.isSuccess && (
        <Text size="xs" c="green">
          Lien envoyé : regarde ta boîte mail.
        </Text>
      )}
      {mutation.error && (
        <Text size="xs" c="red">
          {errorMessage(mutation.error, { 409: 'Ton adresse est déjà confirmée.' })}
        </Text>
      )}
    </>
  );
}

export function UnverifiedEmailNotice() {
  if (!useEmailUnverified()) {
    return null;
  }

  return (
    <Alert color="yellow" title="Confirme ton adresse mail" mb="md">
      <Text size="sm" mb="xs">
        {unverifiedDecksNote} Le lien t'a été envoyé par mail.
      </Text>
      <ResendVerificationButton />
    </Alert>
  );
}
