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

export function hasMissingDetails(cards: Card[]): boolean {
  return cards.some((card) => card.colors == null || card.card_type == null);
}
