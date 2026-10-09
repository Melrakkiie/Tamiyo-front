import { Alert, Button, Group, Modal, Stack, Switch } from '@mantine/core';
import { useState } from 'react';

import type { Deck, ImportSummary } from '../api/types';
import { useImportIntoDeck } from '../bulk/api';
import { ImportResult } from '../bulk/ImportResult';
import { isCommanderFormat } from './api';
import { DeckListInput, deckListErrorMessage, useDeckList, useTamiyoDeckFile } from './DeckListInput';

interface ImportListModalProps {
  deck: Deck;
  opened: boolean;
  onClose: () => void;
}

export function ImportListModal({ deck, opened, onClose }: ImportListModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title="Importer une liste dans le deck" size="lg">
      {opened && <ImportListForm deck={deck} onClose={onClose} />}
    </Modal>
  );
}

function ImportListForm({ deck, onClose }: { deck: Deck; onClose: () => void }) {
  const list = useDeckList();
  const tamiyoFile = useTamiyoDeckFile(list.source);
  const mutation = useImportIntoDeck();
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const hasCommander = deck.commander_id != null || deck.commander_pending_id != null;
  const [commanderFromFirstLine, setCommanderFromFirstLine] = useState(isCommanderFormat(deck.format) && !hasCommander);

  function submit() {
    if (!list.source) {
      return;
    }
    setSummary(null);
    mutation.mutate(
      { deckId: deck.id, file: list.source, commanderFromFirstLine: commanderFromFirstLine && !hasCommander },
      {
        onSuccess: (result) => {
          setSummary(result);
          list.reset();
        },
      },
    );
  }

  return (
    <Stack>
      <DeckListInput list={list} />
      {!hasCommander && !tamiyoFile && (
        <Switch
          label="La première ligne est le commandant"
          checked={commanderFromFirstLine}
          onChange={(event) => setCommanderFromFirstLine(event.currentTarget.checked)}
        />
      )}
      {mutation.error && <Alert color="red">{deckListErrorMessage(mutation.error)}</Alert>}
      {summary && <ImportResult summary={summary} kind="deck-add" />}
      <Group justify="flex-end">
        <Button variant="default" onClick={onClose}>
          {summary ? 'Fermer' : 'Annuler'}
        </Button>
        <Button onClick={submit} disabled={!list.source} loading={mutation.isPending}>
          Importer
        </Button>
      </Group>
    </Stack>
  );
}
