import { isDoubleFaced, type ScryfallCard } from './client';

export const cardTypes = [
  'Creature',
  'Planeswalker',
  'Battle',
  'Instant',
  'Sorcery',
  'Artifact',
  'Enchantment',
  'Land',
  'Other',
] as const;

export type CardType = (typeof cardTypes)[number];

const typesByPrecedence: CardType[] = [
  'Land',
  'Creature',
  'Planeswalker',
  'Battle',
  'Instant',
  'Sorcery',
  'Artifact',
  'Enchantment',
];

export function primaryType(typeLine: string): CardType {
  const types = typeLine.split('//')[0].split('—')[0].split(/\s+/);
  return typesByPrecedence.find((type) => types.includes(type)) ?? 'Other';
}

export function colorCode(colors: string[]): string {
  const upper = colors.map((color) => color.toUpperCase());
  return ['W', 'U', 'B', 'R', 'G'].filter((color) => upper.includes(color)).join('');
}

export function subtypes(card: ScryfallCard): string[] {
  const typeLine = card.type_line ?? (card.card_faces ?? []).map((face) => face.type_line ?? '').join(' // ');
  const words = typeLine
    .split(/\s*\/\/\s*/)
    .flatMap((face) => (face.split('—')[1] ?? '').trim().split(/\s+/))
    .filter((word) => word !== '');
  return [...new Set(words)];
}

export interface FaceTypes {
  front: CardType;
  back: CardType | null;
}

export function faceTypes(card: ScryfallCard): FaceTypes {
  const faces = card.card_faces ?? [];
  const front = primaryType(faces[0]?.type_line ?? card.type_line ?? '');
  const backTypeLine = faces[1]?.type_line;
  return { front, back: isDoubleFaced(card) && backTypeLine ? primaryType(backTypeLine) : null };
}
