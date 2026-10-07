import { Divider, Group, Paper, SegmentedControl, Skeleton, Stack, Text } from '@mantine/core';
import { Fragment, useState } from 'react';

import type { ScryfallCard } from './client';
import { useFrenchPrinting, useScryfallCard } from './hooks';
import { withSymbols } from './manaSymbols';

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

function facesOf(card: ScryfallCard, french: ScryfallCard | null): Face[] {
  if (card.card_faces && card.card_faces.length > 1 && card.card_faces.some((face) => face.oracle_text !== undefined)) {
    return card.card_faces.map((face, index) => {
      const translated = french?.card_faces?.[index];
      return {
        name: translated?.printed_name ?? face.name ?? card.name,
        manaCost: face.mana_cost,
        typeLine: translated?.printed_type_line ?? face.type_line,
        oracleText: translated?.printed_text ?? face.oracle_text,
        flavorText: french ? translated?.flavor_text : face.flavor_text,
        stats: stats(face),
      };
    });
  }
  return [
    {
      name: french?.printed_name ?? card.name,
      manaCost: card.mana_cost,
      typeLine: french?.printed_type_line ?? card.type_line,
      oracleText: french?.printed_text ?? card.oracle_text,
      flavorText: french ? french.flavor_text : card.flavor_text,
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
  const french = useFrenchPrinting(card.data);
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');
  const frenchAvailable = !!french.data;
  const showFrench = frenchAvailable && language === 'fr';

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

  const faces = facesOf(card.data, showFrench ? (french.data ?? null) : null);
  const showFaceNames = faces.length > 1 || showFrench;

  return (
    <Stack gap="xs">
      {frenchAvailable && (
        <SegmentedControl
          size="xs"
          w={140}
          value={language}
          onChange={(value) => setLanguage(value as 'fr' | 'en')}
          data={[
            { value: 'fr', label: 'Français' },
            { value: 'en', label: 'English' },
          ]}
        />
      )}
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
      {showFrench && (
        <Text size="xs" c="dimmed">
          Texte imprimé sur la carte française
          {french.data?.set !== card.data.set ? ` (édition ${french.data?.set_name ?? ''})` : ''} : il peut différer du
          texte de règles officiel à jour, en anglais.
        </Text>
      )}
      <Text size="xs" c="dimmed">
        {card.data.set_name}
        {card.data.rarity ? ` · ${rarityLabels[card.data.rarity] ?? card.data.rarity}` : ''}
        {card.data.artist ? ` · Illustration : ${card.data.artist}` : ''}
      </Text>
    </Stack>
  );
}
