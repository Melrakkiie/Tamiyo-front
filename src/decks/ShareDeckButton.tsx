import { Anchor, Button, CopyButton, Group, Popover, Stack, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';

import { errorMessage } from '../api/errors';
import type { Deck } from '../api/types';
import { useUpdateDeck } from './api';
import { sharedDeckPath, sharedDeckUrl } from './shared';

export function ShareDeckButton({ deck }: { deck: Deck }) {
  const update = useUpdateDeck();
  const url = sharedDeckUrl(deck.id);
  const isPrivate = deck.visibility === 'private';

  function makeUnlisted() {
    update.mutate(
      { id: deck.id, changes: { visibility: 'unlisted' } },
      {
        onSuccess: () => notifications.show({ color: 'green', message: 'Le deck est maintenant non répertorié.' }),
        onError: (err) => notifications.show({ color: 'red', message: errorMessage(err) }),
      },
    );
  }

  return (
    <Popover width={380} position="bottom-end" withArrow shadow="md">
      <Popover.Target>
        <Button variant="default">Partager</Button>
      </Popover.Target>
      <Popover.Dropdown>
        {isPrivate ? (
          <Stack gap="sm">
            <Text size="sm">Ce deck est privé : personne d'autre que toi ne peut le voir, même avec son lien.</Text>
            <Button size="xs" onClick={makeUnlisted} loading={update.isPending}>
              Le rendre visible avec le lien
            </Button>
          </Stack>
        ) : (
          <Stack gap="sm">
            <Text size="sm">
              {deck.visibility === 'public'
                ? 'Toute personne qui a ce lien peut voir le deck, même sans compte. Il apparaît aussi sur ton profil.'
                : "Toute personne qui a ce lien peut voir le deck, même sans compte. Il n'apparaît nulle part ailleurs."}
            </Text>
            <Group gap="xs" wrap="nowrap">
              <TextInput
                value={url}
                readOnly
                onFocus={(event) => event.currentTarget.select()}
                aria-label="Lien de partage"
                style={{ flex: 1 }}
              />
              <CopyButton value={url}>
                {({ copied, copy }) => (
                  <Button color={copied ? 'teal' : undefined} onClick={copy} w={96}>
                    {copied ? 'Copié' : 'Copier'}
                  </Button>
                )}
              </CopyButton>
            </Group>
            <Text size="xs" c="dimmed">
              Pour ne plus le partager, passe-le en « Privé » depuis Modifier : le lien cessera de marcher.{' '}
              <Anchor href={sharedDeckPath(deck.id)} target="_blank" rel="noreferrer" size="xs">
                Voir la page partagée
              </Anchor>
            </Text>
          </Stack>
        )}
      </Popover.Dropdown>
    </Popover>
  );
}
