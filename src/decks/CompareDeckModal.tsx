import { Button, Group, Modal, SegmentedControl, Select, Stack, Text, TextInput } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router';

import { api, unwrap } from '../api/client';
import type { Deck } from '../api/types';
import { useSession } from '../auth/useSession';
import { useAllDecks } from './api';

type Source = 'mine' | 'public' | 'link';

const sources: { value: Source; label: string }[] = [
  { value: 'mine', label: 'Un de mes decks' },
  { value: 'public', label: 'Un deck public' },
  { value: 'link', label: "Le lien d'un deck" },
];

const PUBLIC_SEARCH_LIMIT = 20;

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

interface DeckOption {
  value: string;
  label: string;
}

function usePublicDeckSearch(search: string, excludedId: string, selected: DeckOption | null) {
  const [query] = useDebouncedValue(selected && search === selected.label ? '' : search.trim(), 300);
  const result = useQuery({
    queryKey: ['shared', 'browse', 'search', query],
    queryFn: async () =>
      unwrap(
        await api.GET('/shared/decks', {
          params: { query: { q: query || undefined, sort: query ? 'name' : '-updated', limit: PUBLIC_SEARCH_LIMIT } },
        }),
      ),
    placeholderData: keepPreviousData,
  });
  const options: DeckOption[] = (result.data?.data ?? [])
    .filter((deck) => deck.id !== excludedId)
    .map((deck) => ({
      value: deck.id,
      label: `${deck.name} · ${deck.owner.display_name || 'Sans pseudo'} (${deck.format})`,
    }));
  if (selected && !options.some((option) => option.value === selected.value)) {
    options.unshift(selected);
  }
  return { options, loading: result.isFetching };
}

interface CompareDeckModalProps {
  deckId: string;
  deckName: string;
  opened: boolean;
  onClose: () => void;
}

export function CompareDeckModal({ deckId, deckName, opened, onClose }: CompareDeckModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title={`Comparer « ${deckName} »`}>
      {opened && <CompareForm deckId={deckId} />}
    </Modal>
  );
}

function CompareForm({ deckId }: { deckId: string }) {
  const navigate = useNavigate();
  const signedIn = useSession().status === 'authenticated';
  const available = signedIn ? sources : sources.filter((option) => option.value !== 'mine');
  const decks = useAllDecks(signedIn);
  const [source, setSource] = useState<Source>(available[0].value);
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [publicDeck, setPublicDeck] = useState<DeckOption | null>(null);
  const [search, setSearch] = useState('');
  const [link, setLink] = useState('');
  const publicDecks = usePublicDeckSearch(search, deckId, publicDeck);
  const linkedId = deckIdFromLink(link);
  const otherId = { mine: chosenId, public: publicDeck?.value ?? null, link: linkedId }[source];
  const groups = deckOptionGroups(decks.data ?? [], deckId);

  function submit() {
    if (otherId) {
      navigate(compareUrl(deckId, otherId));
    }
  }

  return (
    <Stack>
      <SegmentedControl data={available} value={source} onChange={(value) => setSource(value as Source)} fullWidth />
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
      ) : source === 'public' ? (
        <Select
          label="Deck à comparer"
          placeholder="Cherche par nom"
          data={publicDecks.options}
          value={publicDeck?.value ?? null}
          onChange={(_value, option) => setPublicDeck(option ?? null)}
          searchable
          searchValue={search}
          onSearchChange={setSearch}
          filter={({ options }) => options}
          nothingFoundMessage={publicDecks.loading ? 'Recherche…' : 'Aucun deck public'}
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
