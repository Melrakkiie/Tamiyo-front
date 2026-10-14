import {
  ActionIcon,
  Box,
  Button,
  Group,
  Menu,
  Modal,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core';
import { useState } from 'react';

import type { Zone } from './engine';
import { CardFace } from './PlaytestCard';
import { useTable } from './table';

export type ViewedZone = 'library' | 'graveyard' | 'exile';

const zoneTitles: Record<ViewedZone, string> = {
  library: 'Chercher dans ta bibliothèque',
  graveyard: 'Cimetière',
  exile: 'Exil',
};

const destinations: { zone: Zone; position?: 'top' | 'bottom'; label: string }[] = [
  { zone: 'hand', label: 'En main' },
  { zone: 'battlefield', label: 'Sur le champ de bataille' },
  { zone: 'graveyard', label: 'Au cimetière' },
  { zone: 'exile', label: 'En exil' },
  { zone: 'library', position: 'top', label: 'Sur le dessus de la bibliothèque' },
  { zone: 'library', position: 'bottom', label: 'Sous la bibliothèque' },
];

const THUMB_WIDTH = 145;

function normalized(text: string) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

export function ZoneModal({ zone, onClose }: { zone: ViewedZone | null; onClose: () => void }) {
  const { state, act } = useTable();
  const [search, setSearch] = useState('');
  const shownZone = zone ?? 'graveyard';
  const searching = shownZone === 'library';
  const query = normalized(search.trim());
  const ids = state.zones[shownZone].filter((id) => !query || normalized(state.cards[id].name).includes(query));
  const shown = searching ? [...ids].sort((a, b) => state.cards[a].name.localeCompare(state.cards[b].name, 'fr')) : ids;

  function close() {
    setSearch('');
    onClose();
  }

  function moveTo(id: string, to: Zone, position?: 'top' | 'bottom') {
    act(searching ? { type: 'searchLibrary', id, to } : { type: 'move', id, to, position });
  }

  const choices = destinations.filter((destination) =>
    searching ? destination.zone !== 'library' : destination.zone !== shownZone,
  );

  return (
    <Modal opened={zone !== null} onClose={close} title={zoneTitles[shownZone]} size="xl">
      <Stack>
        <TextInput
          placeholder="Nom de la carte"
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
          data-autofocus
        />
        {searching && (
          <Text size="sm" c="dimmed">
            Ta bibliothèque est mélangée après chaque carte que tu prends.
          </Text>
        )}
        {shown.length === 0 ? (
          <Text c="dimmed" ta="center" py="lg">
            {state.zones[shownZone].length === 0 ? 'Cette zone est vide.' : 'Aucune carte ne correspond.'}
          </Text>
        ) : (
          <SimpleGrid cols={{ base: 2, xs: 3, sm: 5 }} spacing="sm">
            {shown.map((id) => (
              <Menu key={id} position="bottom" withinPortal shadow="md" width={240}>
                <Menu.Target>
                  <UnstyledButton aria-label={state.cards[id].name}>
                    <CardFace card={state.cards[id]} width={THUMB_WIDTH} />
                  </UnstyledButton>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Label>{state.cards[id].name}</Menu.Label>
                  {choices.map((destination) => (
                    <Menu.Item
                      key={`${destination.zone}:${destination.position}`}
                      onClick={() => moveTo(id, destination.zone, destination.position)}
                    >
                      {destination.label}
                    </Menu.Item>
                  ))}
                </Menu.Dropdown>
              </Menu>
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Modal>
  );
}

type ScryChoice = 'top' | 'bottom' | 'graveyard';

const scryChoices: { value: ScryChoice; label: string }[] = [
  { value: 'top', label: 'Dessus' },
  { value: 'bottom', label: 'Dessous' },
  { value: 'graveyard', label: 'Cimetière' },
];

export function ScryModal({ count, onClose }: { count: number | null; onClose: () => void }) {
  const { state } = useTable();
  return (
    <Modal opened={count !== null} onClose={onClose} title="Regarder le dessus de ta bibliothèque" size="xl">
      {count !== null && (
        <ScryChoices key={state.zones.library.slice(0, count).join()} count={count} onDone={onClose} />
      )}
    </Modal>
  );
}

function ScryChoices({ count, onDone }: { count: number; onDone: () => void }) {
  const { state, act } = useTable();
  const [order, setOrder] = useState(() => state.zones.library.slice(0, count));
  const [choices, setChoices] = useState<Record<string, ScryChoice>>({});

  function swap(index: number, offset: number) {
    setOrder((current) => {
      const next = [...current];
      [next[index], next[index + offset]] = [next[index + offset], next[index]];
      return next;
    });
  }

  function confirm() {
    const choiceOf = (id: string) => choices[id] ?? 'top';
    act({
      type: 'scry',
      result: {
        top: order.filter((id) => choiceOf(id) === 'top'),
        bottom: order.filter((id) => choiceOf(id) === 'bottom'),
        graveyard: order.filter((id) => choiceOf(id) === 'graveyard'),
      },
    });
    onDone();
  }

  if (order.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="lg">
        Ta bibliothèque est vide.
      </Text>
    );
  }

  return (
    <Stack>
      <Text size="sm" c="dimmed">
        Les cartes laissées dessus y restent dans cet ordre : celle de gauche sera piochée en premier.
      </Text>
      <SimpleGrid cols={{ base: 2, xs: 3, sm: 5 }} spacing="sm">
        {order.map((id, index) => (
          <Stack key={id} gap={6} align="center">
            <Box w={THUMB_WIDTH}>
              <CardFace card={state.cards[id]} width={THUMB_WIDTH} />
            </Box>
            <Group gap={4}>
              <ActionIcon
                variant="default"
                size="sm"
                aria-label="Avancer"
                disabled={index === 0}
                onClick={() => swap(index, -1)}
              >
                ←
              </ActionIcon>
              <ActionIcon
                variant="default"
                size="sm"
                aria-label="Reculer"
                disabled={index === order.length - 1}
                onClick={() => swap(index, 1)}
              >
                →
              </ActionIcon>
            </Group>
            <SegmentedControl
              size="xs"
              orientation="vertical"
              fullWidth
              w={THUMB_WIDTH}
              data={scryChoices}
              value={choices[id] ?? 'top'}
              onChange={(value) => setChoices((current) => ({ ...current, [id]: value as ScryChoice }))}
            />
          </Stack>
        ))}
      </SimpleGrid>
      <Group justify="flex-end">
        <Button onClick={confirm}>Valider</Button>
      </Group>
    </Stack>
  );
}
