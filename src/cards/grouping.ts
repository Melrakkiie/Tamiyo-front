import type { Card, CardSort } from '../api/types';
import type { CardType } from '../scryfall/classify';

export type CardGrouping = 'type' | 'color' | 'mana';

export const groupingOptions: { value: CardGrouping; label: string }[] = [
  { value: 'type', label: 'Type' },
  { value: 'color', label: 'Couleur' },
  { value: 'mana', label: 'Coût de mana' },
];

export function parseGrouping(raw: string | null): CardGrouping | null {
  return groupingOptions.find((option) => option.value === raw)?.value ?? null;
}

export const sortForGrouping: Record<CardGrouping, CardSort> = {
  type: 'type',
  color: 'color',
  mana: 'mana_value',
};

const typeLabels: Record<CardType, string> = {
  Creature: 'Créatures',
  Planeswalker: 'Planeswalkers',
  Battle: 'Batailles',
  Instant: 'Éphémères',
  Sorcery: 'Rituels',
  Artifact: 'Artefacts',
  Enchantment: 'Enchantements',
  Land: 'Terrains',
  Other: 'Autres',
};

const colorLabels: Record<string, string> = {
  W: 'Blanc',
  U: 'Bleu',
  B: 'Noir',
  R: 'Rouge',
  G: 'Vert',
};

function colorGroup(card: Card): string {
  if (card.card_type === 'Land') {
    return 'Terrains';
  }
  if (card.colors === null || card.colors === undefined) {
    return 'Couleur inconnue';
  }
  if (card.colors === '') {
    return 'Incolore';
  }
  if (card.colors.length > 1) {
    return 'Multicolore';
  }
  return colorLabels[card.colors] ?? 'Couleur inconnue';
}

export function groupLabel(card: Card, grouping: CardGrouping): string {
  switch (grouping) {
    case 'type':
      return card.card_type ? typeLabels[card.card_type] : 'Type inconnu';
    case 'color':
      return colorGroup(card);
    case 'mana':
      return `Coût de mana ${Math.floor(card.mana_value)}`;
  }
}

export interface CardGroup {
  label: string;
  cards: Card[];
}

export function groupCards(cards: Card[], grouping: CardGrouping): CardGroup[] {
  const groups: CardGroup[] = [];
  for (const card of cards) {
    const label = groupLabel(card, grouping);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.cards.push(card);
    } else {
      groups.push({ label, cards: [card] });
    }
  }
  return groups;
}

const typeRanks: Record<CardType, number> = {
  Creature: 1,
  Planeswalker: 2,
  Battle: 3,
  Instant: 4,
  Sorcery: 5,
  Artifact: 6,
  Enchantment: 7,
  Land: 8,
  Other: 9,
};

const colorRanks: Record<string, number> = { W: 1, U: 2, B: 3, R: 4, G: 5 };

function colorRank(card: Card): number {
  if (card.card_type === 'Land') {
    return 8;
  }
  if (card.colors === null || card.colors === undefined) {
    return 9;
  }
  if (card.colors === '') {
    return 7;
  }
  if (card.colors.length > 1) {
    return 6;
  }
  return colorRanks[card.colors] ?? 9;
}

function groupRank(card: Card, grouping: CardGrouping): number {
  switch (grouping) {
    case 'type':
      return card.card_type ? typeRanks[card.card_type] : 10;
    case 'color':
      return colorRank(card);
    case 'mana':
      return Math.floor(card.mana_value);
  }
}

export function sortIntoGroups(cards: Card[], grouping: CardGrouping): Card[] {
  return cards
    .map((card, index) => ({ card, index, rank: groupRank(card, grouping) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(({ card }) => card);
}

export function hasMissingDetails(cards: Card[]): boolean {
  return cards.some((card) => card.colors == null || card.card_type == null || card.color_identity == null);
}
