import type { ScryfallCard } from './client';

export type CommanderEligibility = 'eligible' | 'not_eligible' | 'banned';

function frontFace(card: ScryfallCard) {
  const face = card.card_faces?.[0];
  return {
    typeLine: face?.type_line ?? card.type_line ?? '',
    oracleText: face?.oracle_text ?? card.oracle_text ?? '',
    hasPowerToughness: (face?.power ?? card.power) !== undefined && (face?.toughness ?? card.toughness) !== undefined,
  };
}

export function commanderEligibility(card: ScryfallCard): CommanderEligibility {
  const legality = card.legalities?.commander;
  if (legality === 'banned') {
    return 'banned';
  }
  if (legality !== undefined && legality !== 'legal') {
    return 'not_eligible';
  }

  const face = frontFace(card);
  if (/can be your commander/i.test(face.oracleText)) {
    return 'eligible';
  }

  const [types, subtypes = ''] = face.typeLine.split('—');
  const typeWords = types.split(/\s+/);
  const subtypeWords = subtypes.split(/\s+/);
  if (!typeWords.includes('Legendary')) {
    return 'not_eligible';
  }
  if (typeWords.includes('Creature')) {
    return 'eligible';
  }
  const isVehicle = subtypeWords.includes('Vehicle') || subtypeWords.includes('Spacecraft');
  return isVehicle && face.hasPowerToughness ? 'eligible' : 'not_eligible';
}
