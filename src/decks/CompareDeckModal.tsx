import { Button, Group, Modal, SegmentedControl, Select, Stack, Text, TextInput } from '@mantine/core';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import type { Deck } from '../api/types';
import { useAllDecks } from './api';

type Source = 'mine' | 'link';

const sources: { value: Source; label: string }[] = [
  { value: 'mine', label: 'Un de mes decks' },
  { value: 'link', label: "Le lien d'un deck" },
];

const deckIdPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

function deckIdFromLink(link: string) {
  return deckIdPattern.exec(link)?.[0].toLowerCase() ?? null;
}

export function compareUrl(deckId: string, otherId: string) {
  return `/decks/${deckId}/comparer/${otherId}`;
}

function deckOptionGroups(decks: Deck[], excludedId: string) {
  const byFormat = new Map<string, Deck[]>();
  for (const deck of decks) {
    if (deck.id === excludedId) {
      continue;
    }
    const format = deck.format.toLowerCase();
    byFormat.set(format, [...(byFormat.get(format) ?? []), deck]);
  }
  return [...byFormat.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([format, formatDecks]) => ({
      group: format,
      items: [...formatDecks]
        .sort((a, b) => b.updated.localeCompare(a.updated))
        .map((deck) => ({ value: deck.id, label: deck.name })),
    }));
}

interface CompareDeckModalProps {
  deck: Deck;
  opened: boolean;
  onClose: () => void;
}

export function CompareDeckModal({ deck, opened, onClose }: CompareDeckModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title={`Comparer « ${deck.name} »`}>
      {opened && <CompareForm deck={deck} />}
    </Modal>
  );
}

function CompareForm({ deck }: { deck: Deck }) {
  const navigate = useNavigate();
  const decks = useAllDecks();
  const [source, setSource] = useState<Source>('mine');
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [link, setLink] = useState('');
  const linkedId = deckIdFromLink(link);
  const otherId = source === 'mine' ? chosenId : linkedId;
  const groups = deckOptionGroups(decks.data ?? [], deck.id);

  function submit() {
    if (otherId) {
      navigate(compareUrl(deck.id, otherId));
    }
  }

  return (
    <Stack>
      <SegmentedControl data={sources} value={source} onChange={(value) => setSource(value as Source)} fullWidth />
      {source === 'mine' ? (
        <Select
          label="Deck à comparer"
          placeholder={decks.isLoading ? 'Chargement…' : 'Choisis un deck'}
          data={groups}
          value={chosenId}
          onChange={setChosenId}
          searchable
          nothingFoundMessage="Aucun deck"
          maxDropdownHeight={320}
        />
      ) : (
        <TextInput
          label="Lien du deck"
          description="Le lien d'un deck public ou non répertorié, le tien ou celui de quelqu'un d'autre."
          placeholder="https://tamiyo.alangelier.com/decks/…"
          value={link}
          onChange={(event) => setLink(event.currentTarget.value)}
          error={link.trim() !== '' && !linkedId ? "Ce lien ne contient pas d'identifiant de deck." : undefined}
        />
      )}
      <Text size="xs" c="dimmed">
        Les cartes sont comparées par nom, quelle que soit leur édition.
      </Text>
      <Group justify="flex-end">
        <Button onClick={submit} disabled={!otherId}>
          Comparer
        </Button>
      </Group>
    </Stack>
  );
}
