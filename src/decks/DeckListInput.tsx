import { FileInput, SegmentedControl, Stack, Text, Textarea } from '@mantine/core';
import { type ReactNode, useEffect, useMemo, useState } from 'react';

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
  const source = useMemo(
    () => (mode === 'file' ? file : text.trim() ? new File([text], 'deck.txt', { type: 'text/plain' }) : null),
    [mode, text, file],
  );

  function reset() {
    setText('');
    setFile(null);
  }

  return { mode, setMode, text, setText, file, setFile, source, reset };
}

export interface TamiyoDeckFile {
  name: string | null;
  format: string | null;
}

function parseTamiyoDeck(text: string): TamiyoDeckFile | null {
  if (!text.trimStart().startsWith('{')) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== 'object' || parsed === null || !('tamiyo' in parsed)) {
      return null;
    }
    const deck = 'deck' in parsed && typeof parsed.deck === 'object' && parsed.deck !== null ? parsed.deck : {};
    const name = 'name' in deck && typeof deck.name === 'string' ? deck.name.trim() : '';
    const format = 'format' in deck && typeof deck.format === 'string' ? deck.format.trim() : '';
    return { name: name || null, format: format || null };
  } catch {
    return null;
  }
}

export function useTamiyoDeckFile(source: File | null): TamiyoDeckFile | null {
  const [found, setFound] = useState<TamiyoDeckFile | null>(null);

  useEffect(() => {
    let current = true;
    if (!source) {
      setFound(null);
      return;
    }
    source
      .text()
      .then((text) => current && setFound(parseTamiyoDeck(text)))
      .catch(() => current && setFound(null));
    return () => {
      current = false;
    };
  }, [source]);

  return found;
}

const deckHint = (
  <>
    Une carte par ligne : l'export d'un deck Moxfield (<b>More → Export → Plain Text</b>) ou une simple liste comme « 4
    Lightning Bolt ». Rien n'est ajouté à ta collection : les cartes que tu possèdes vont dans le deck (dans l'édition
    indiquée quand la ligne la précise), les autres y apparaissent en orange. Les lignes sous « Sideboard » vont dans le
    sideboard, celles sous « Maybeboard » ou « Considering » dans la section Considering. Les tags en fin de ligne,
    comme « #ramp #food generator », sont ajoutés aux cartes. Un fichier exporté au format Tamiyo (.json) marche aussi :
    il garde les éditions, les sections, le commandant et les tags.
  </>
);

interface DeckListInputProps {
  list: ReturnType<typeof useDeckList>;
  minRows?: number;
  hint?: ReactNode;
}

export function DeckListInput({ list, minRows = 8, hint = deckHint }: DeckListInputProps) {
  return (
    <Stack gap="xs">
      <Text size="xs" c="dimmed">
        {hint}
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
          placeholder="Choisis le fichier .txt ou .json"
          accept=".txt,.json,text/plain,application/json"
          value={list.file}
          onChange={list.setFile}
          clearable
        />
      )}
    </Stack>
  );
}

export function tamiyoFileErrorMessage(err: unknown): string | null {
  if (!(err instanceof ApiError) || err.status !== 400) {
    return null;
  }
  if (err.message.includes('is a deck')) {
    return "Ce fichier Tamiyo contient un deck : importe-le depuis la page d'un deck.";
  }
  if (err.message.includes('is a collection or a storage')) {
    return "Ce fichier Tamiyo contient une collection ou un rangement : importe-le depuis la page Collection ou celle d'un rangement.";
  }
  if (err.message.includes('newer version of Tamiyo')) {
    return "Ce fichier vient d'une version plus récente de Tamiyo : recharge la page et réessaie.";
  }
  if (err.message.includes('invalid Tamiyo file')) {
    return "Ce fichier Tamiyo n'a pas pu être lu : il est peut-être incomplet ou a été modifié à la main.";
  }
  return null;
}

export function deckListErrorMessage(err: unknown) {
  const tamiyo = tamiyoFileErrorMessage(err);
  if (tamiyo) {
    return tamiyo;
  }
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
