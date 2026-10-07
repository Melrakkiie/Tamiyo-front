import {
  Alert,
  Button,
  Center,
  Group,
  Image,
  Loader,
  Modal,
  Paper,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';

import { errorMessage } from '../api/errors';
import { artCredit } from '../decks/art';
import { cardArt, type ScryfallCard } from '../scryfall/client';
import { usePrintings } from '../scryfall/hooks';
import { ScryfallCardSearch } from '../scryfall/ScryfallCardSearch';
import { useAccount, useUpdateAvatar } from './account';
import { useAvatarArt, UserAvatar } from './UserAvatar';

export function AvatarSection() {
  const account = useAccount();
  const art = useAvatarArt(account.data?.avatar_scryfall_id);
  const update = useUpdateAvatar();
  const [picking, setPicking] = useState(false);

  function clear() {
    update.mutate(null, {
      onSuccess: () => notifications.show({ color: 'green', message: 'Image de profil retirée.' }),
    });
  }

  return (
    <Paper withBorder p="lg">
      <Stack>
        <Title order={3} size="h4">
          Image de profil
        </Title>
        <Group align="center" wrap="nowrap">
          <UserAvatar size={96} />
          <Stack gap="xs">
            <Text size="sm" c="dimmed">
              L'illustration d'une carte Magic de ton choix, cherchée sur Scryfall.
            </Text>
            {art && (
              <Text size="xs" c="dimmed">
                {artCredit(art.artist)}
              </Text>
            )}
            <Group gap="xs">
              <Button variant="light" onClick={() => setPicking(true)}>
                {account.data?.avatar_scryfall_id ? 'Changer' : 'Choisir une image'}
              </Button>
              {account.data?.avatar_scryfall_id && (
                <Button variant="subtle" color="gray" onClick={clear} loading={update.isPending}>
                  Retirer
                </Button>
              )}
            </Group>
          </Stack>
        </Group>
        {update.error && <Alert color="red">{errorMessage(update.error)}</Alert>}
      </Stack>
      <Modal opened={picking} onClose={() => setPicking(false)} title="Choisir une image de profil" size="xl">
        {picking && (
          <AvatarPicker current={account.data?.avatar_scryfall_id ?? null} onDone={() => setPicking(false)} />
        )}
      </Modal>
    </Paper>
  );
}

function AvatarPicker({ current, onDone }: { current: string | null; onDone: () => void }) {
  const [name, setName] = useState<string | null>(null);
  const printings = usePrintings(name);
  const withArt = (printings.data ?? []).flatMap((printing) => {
    const art = cardArt(printing);
    return art ? [{ printing, art }] : [];
  });
  const update = useUpdateAvatar();

  function choose(printing: ScryfallCard) {
    update.mutate(printing.id, {
      onSuccess: () => {
        notifications.show({ color: 'green', message: 'Image de profil mise à jour.' });
        onDone();
      },
    });
  }

  return (
    <Stack>
      <ScryfallCardSearch
        label="Carte"
        placeholder="Cherche une carte sur Scryfall (ex. Tamiyo, ou t:legendary c:u)"
        onSelect={setName}
      />

      {!name ? (
        <Text size="sm" c="dimmed">
          Choisis une carte, puis l'illustration de l'édition que tu préfères.
        </Text>
      ) : printings.isLoading ? (
        <Center p="lg">
          <Loader />
        </Center>
      ) : printings.error ? (
        <Alert color="red">{errorMessage(printings.error)}</Alert>
      ) : withArt.length === 0 ? (
        <Text size="sm" c="dimmed">
          Aucune illustration trouvée pour cette carte.
        </Text>
      ) : (
        <ScrollArea.Autosize mah={480} type="auto">
          <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
            {withArt.map(({ printing, art }) => (
              <UnstyledButton key={printing.id} onClick={() => choose(printing)} disabled={update.isPending}>
                <Paper
                  withBorder
                  p={4}
                  radius="md"
                  style={{
                    ...(current === printing.id
                      ? { borderColor: 'var(--mantine-primary-color-filled)', borderWidth: 2 }
                      : {}),
                    ...(update.isPending ? { opacity: 0.5 } : {}),
                  }}
                >
                  <Image src={art.url} alt={printing.name} radius="sm" loading="lazy" />
                  <Text size="xs" mt={4} lineClamp={1}>
                    {printing.set_name} · {printing.released_at.slice(0, 4)}
                  </Text>
                  <Text size="xs" c="dimmed" lineClamp={1}>
                    {art.artist ?? ' '}
                  </Text>
                </Paper>
              </UnstyledButton>
            ))}
          </SimpleGrid>
        </ScrollArea.Autosize>
      )}

      {update.error && <Alert color="red">{errorMessage(update.error)}</Alert>}
    </Stack>
  );
}
