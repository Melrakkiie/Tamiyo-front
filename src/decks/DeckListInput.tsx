import { FileInput, SegmentedControl, Stack, Text, Textarea } from '@mantine/core';
import { useState } from 'react';

import { ApiError, errorMessage } from '../api/errors';
import type { ImportSummary } from '../api/types';

type DeckListMode = 'text' | 'file';

const modes: { value: DeckListMode; label: string }[] = [
  { value: 'text', label: 'Coller la liste' },
  { value: 'file', label: 'Fichier texte' },
];

export function useDeckList() {
  const [mode, setMode] = useState<DeckListMode>('text');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const source = mode === 'file' ? file : text.trim() ? new File([text], 'deck.txt', { type: 'text/plain' }) : null;

  function reset() {
    setText('');
    setFile(null);
  }

  return { mode, setMode, text, setText, file, setFile, source, reset };
}

export function DeckListInput({ list, minRows = 8 }: { list: ReturnType<typeof useDeckList>; minRows?: number }) {
  return (
    <Stack gap="xs">
      <Text size="xs" c="dimmed">
        Une carte par ligne : l'export d'un deck Moxfield (<b>More → Export → Plain Text</b>) ou une simple liste comme
        « 4 Lightning Bolt ». Rien n'est ajouté à ta collection : les cartes que tu possèdes vont dans le deck (dans
        l'édition indiquée quand la ligne la précise), les autres y apparaissent en orange.
      </Text>
      <SegmentedControl
        data={modes}
        value={list.mode}
        onChange={(value) => list.setMode(value as DeckListMode)}
        w="fit-content"
        size="xs"
      />
      {list.mode === 'text' ? (
        <Textarea
          aria-label="Liste de cartes"
          placeholder={"1 Atraxa, Praetors' Voice\n4 Lightning Bolt\n1 Sol Ring (SLD) 1011"}
          value={list.text}
          onChange={(event) => list.setText(event.currentTarget.value)}
          autosize
          minRows={minRows}
          maxRows={20}
          styles={{ input: { fontFamily: 'var(--mantine-font-family-monospace)' } }}
        />
      ) : (
        <FileInput
          aria-label="Fichier texte"
          placeholder="Choisis le fichier .txt"
          accept=".txt,text/plain"
          value={list.file}
          onChange={list.setFile}
          clearable
        />
      )}
    </Stack>
  );
}

export function deckListErrorMessage(err: unknown) {
  const unreadLine =
    err instanceof ApiError && err.status === 400 ? /line (\d+): unrecognized format "(.*)"/.exec(err.message) : null;
  if (unreadLine) {
    return `La ligne ${unreadLine[1]} n'a pas pu être lue : « ${unreadLine[2]} ».`;
  }
  return errorMessage(err, {
    400: "La liste n'a pas pu être lue : une carte par ligne, comme « 4 Lightning Bolt ».",
    502: "Scryfall n'a pas répondu, rien n'a été importé. Réessaie dans un moment.",
  });
}

export function deckListSummary(summary: ImportSummary) {
  const linked = summary.cards_linked ?? 0;
  const pending = summary.cards_pending ?? 0;
  const skipped = summary.cards_skipped ?? 0;
  return [
    `${linked} de ta collection`,
    `${pending} pas encore dans ta collection`,
    skipped > 0 ? `${skipped} introuvable${skipped > 1 ? 's' : ''} sur Scryfall` : null,
  ]
    .filter(Boolean)
    .join(', ');
}
