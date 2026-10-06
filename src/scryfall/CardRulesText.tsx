import { Divider, Group, Paper, Skeleton, Stack, Text } from '@mantine/core';
import { Fragment } from 'react';

import type { ScryfallCard } from './client';
import { useScryfallCard } from './hooks';

const SYMBOL_BASE = 'https://svgs.scryfall.io/card-symbols';

function withSymbols(text: string) {
  return text.split(/(\{[^}]+\})/g).map((part, index) => {
    const symbol = /^\{([^}]+)\}$/.exec(part);
    if (!symbol) {
      return <Fragment key={index}>{part}</Fragment>;
    }
    const code = symbol[1].replace(/\//g, '').toUpperCase();
    return (
      <img
        key={index}
        src={`${SYMBOL_BASE}/${encodeURIComponent(code)}.svg`}
        alt={part}
        title={part}
        style={{ height: '1em', width: '1em', verticalAlign: '-0.15em', margin: '0 1px' }}
      />
    );
  });
}

function RulesParagraphs({ text }: { text: string }) {
  return (
    <Stack gap={6}>
      {text.split('\n').map((paragraph, index) => (
        <Text key={index} size="sm">
          {withSymbols(paragraph)}
        </Text>
      ))}
    </Stack>
  );
}

interface Face {
  name: string;
  manaCost?: string;
  typeLine?: string;
  oracleText?: string;
  flavorText?: string;
  stats?: string;
}

function stats(source: { power?: string; toughness?: string; loyalty?: string; defense?: string }) {
  if (source.power !== undefined && source.toughness !== undefined) {
    return `${source.power}/${source.toughness}`;
  }
  if (source.loyalty !== undefined) {
    return `Loyauté ${source.loyalty}`;
  }
  if (source.defense !== undefined) {
    return `Défense ${source.defense}`;
  }
  return undefined;
}

function facesOf(card: ScryfallCard): Face[] {
  if (card.card_faces && card.card_faces.length > 1 && card.card_faces.some((face) => face.oracle_text !== undefined)) {
    return card.card_faces.map((face) => ({
      name: face.name ?? card.name,
      manaCost: face.mana_cost,
      typeLine: face.type_line,
      oracleText: face.oracle_text,
      flavorText: face.flavor_text,
      stats: stats(face),
    }));
  }
  return [
    {
      name: card.name,
      manaCost: card.mana_cost,
      typeLine: card.type_line,
      oracleText: card.oracle_text,
      flavorText: card.flavor_text,
      stats: stats(card),
    },
  ];
}

const rarityLabels: Record<string, string> = {
  common: 'Commune',
  uncommon: 'Peu commune',
  rare: 'Rare',
  mythic: 'Mythique',
  special: 'Spéciale',
  bonus: 'Bonus',
};

export function CardRulesText({ scryfallId }: { scryfallId: string }) {
  const card = useScryfallCard(scryfallId);

  if (card.isLoading) {
    return (
      <Stack gap={6}>
        <Skeleton height={14} width="60%" />
        <Skeleton height={14} />
        <Skeleton height={14} width="80%" />
      </Stack>
    );
  }

  if (!card.data) {
    return (
      <Text size="sm" c="dimmed">
        Impossible de charger le texte de la carte depuis Scryfall pour le moment.
      </Text>
    );
  }

  const faces = facesOf(card.data);
  const showFaceNames = faces.length > 1;

  return (
    <Stack gap="xs">
      <Paper withBorder radius="md" p="sm">
        <Stack gap="sm">
          {faces.map((face, index) => (
            <Fragment key={index}>
              {index > 0 && <Divider />}
              <Stack gap={6}>
                <Group justify="space-between" wrap="nowrap" align="flex-start">
                  <Text size="sm" fw={600}>
                    {showFaceNames ? face.name : face.typeLine}
                  </Text>
                  {face.manaCost && (
                    <Text size="sm" style={{ whiteSpace: 'nowrap' }}>
                      {withSymbols(face.manaCost)}
                    </Text>
                  )}
                </Group>
                {showFaceNames && face.typeLine && (
                  <Text size="sm" c="dimmed">
                    {face.typeLine}
                  </Text>
                )}
                {face.oracleText && <RulesParagraphs text={face.oracleText} />}
                {face.flavorText && (
                  <Text size="xs" c="dimmed" fs="italic">
                    {face.flavorText}
                  </Text>
                )}
                {face.stats && (
                  <Text size="sm" fw={600} ta="right">
                    {face.stats}
                  </Text>
                )}
              </Stack>
            </Fragment>
          ))}
        </Stack>
      </Paper>
      <Text size="xs" c="dimmed">
        {card.data.set_name}
        {card.data.rarity ? ` · ${rarityLabels[card.data.rarity] ?? card.data.rarity}` : ''}
        {card.data.artist ? ` · Illustration : ${card.data.artist}` : ''}
      </Text>
    </Stack>
  );
}
