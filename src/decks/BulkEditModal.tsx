import { Alert, Button, Center, Group, Loader, Modal, Stack, Text, Textarea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useState } from 'react';

import { errorMessage } from '../api/errors';
import { useBulkEditDeck, useDeckExport } from '../bulk/api';
import { deckListErrorMessage } from './DeckListInput';

interface BulkEditModalProps {
  deckId: string;
  deckName: string;
  opened: boolean;
  onClose: () => void;
}

export function BulkEditModal({ deckId, deckName, opened, onClose }: BulkEditModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title={`Édition en masse de ${deckName}`} size="xl">
      {opened && <BulkEditForm deckId={deckId} onClose={onClose} />}
    </Modal>
  );
}

function plural(count: number, word: string) {
  return `${count} ${word}${count > 1 ? 's' : ''}`;
}

function BulkEditForm({ deckId, onClose }: { deckId: string; onClose: () => void }) {
  const current = useDeckExport(
    deckId,
    { format: 'moxfield', withTags: true, onlyPending: false, printings: false, boards: [] },
    true,
  );
  const edit = useBulkEditDeck();
  const [text, setText] = useState<string | null>(null);
  const list = text ?? current.data ?? '';

  function submit() {
    edit.mutate(
      { deckId, list },
      {
        onSuccess: (summary) => {
          const linked = summary.cards_linked ?? 0;
          const pending = summary.cards_pending ?? 0;
          const removed = summary.cards_removed ?? 0;
          const skipped = summary.cards_skipped ?? 0;
          const parts = [
            linked > 0 ? `${plural(linked, 'carte')} de ta collection ajoutée${linked > 1 ? 's' : ''}` : null,
            pending > 0 ? `${plural(pending, 'carte')} en attente` : null,
            removed > 0 ? `${plural(removed, 'carte')} retirée${removed > 1 ? 's' : ''}` : null,
            skipped > 0 ? `${plural(skipped, 'carte')} introuvable${skipped > 1 ? 's' : ''} sur Scryfall` : null,
          ].filter(Boolean);
          notifications.show({
            color: skipped > 0 || (summary.warnings?.length ?? 0) > 0 ? 'yellow' : 'green',
            message:
              parts.length > 0 ? `Deck mis à jour : ${parts.join(', ')}.` : 'Le deck correspond déjà à la liste.',
          });
          onClose();
        },
      },
    );
  }

  if (current.isLoading) {
    return (
      <Center p="xl">
        <Loader />
      </Center>
    );
  }
  if (current.error) {
    return <Alert color="red">{errorMessage(current.error)}</Alert>;
  }

  return (
    <Stack>
      <Text size="sm" c="dimmed">
        Le deck tel qu'il est, une ligne par carte. Modifie la liste : ce qui y est entre dans le deck, ce qui n'y est
        plus en sort (en restant dans ta collection). Les lignes sous « SIDEBOARD: » et « MAYBEBOARD: » vont dans ces
        sections, et les tags en fin de ligne (« #ramp ») remplacent ceux de la carte. Une ligne sans édition, comme « 4
        Lightning Bolt », accepte n'importe quelle édition.
      </Text>
      <Textarea
        aria-label="Liste du deck"
        value={list}
        onChange={(event) => setText(event.currentTarget.value)}
        autosize
        minRows={12}
        maxRows={24}
        data-autofocus
        styles={{ input: { fontFamily: 'var(--mantine-font-family-monospace)' } }}
      />
      {edit.error && <Alert color="red">{deckListErrorMessage(edit.error)}</Alert>}
      <Group justify="space-between">
        <Button variant="subtle" onClick={() => setText(null)} disabled={text === null || edit.isPending}>
          Revenir au deck actuel
        </Button>
        <Group gap="xs">
          <Button variant="default" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={submit} loading={edit.isPending} disabled={list.trim() === ''}>
            Appliquer
          </Button>
        </Group>
      </Group>
    </Stack>
  );
}
