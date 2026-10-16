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

export interface PartnerAbility {
  partner: boolean;
  partnerWith: string | null;
  partnerQuality: string | null;
  friendsForever: boolean;
  chooseBackground: boolean;
  doctorsCompanion: boolean;
  background: boolean;
  timeLordDoctor: boolean;
  name: string;
}

export function partnerAbility(card: ScryfallCard): PartnerAbility {
  const face = frontFace(card);
  const [types, subtypes = ''] = face.typeLine.split('—');
  const typeWords = types.split(/\s+/);
  const legendary = typeWords.includes('Legendary');
  const ability: PartnerAbility = {
    partner: false,
    partnerWith: null,
    partnerQuality: null,
    friendsForever: false,
    chooseBackground: false,
    doctorsCompanion: false,
    background: legendary && subtypes.includes('Background'),
    timeLordDoctor:
      legendary && typeWords.includes('Creature') && subtypes.includes('Time Lord') && subtypes.includes('Doctor'),
    name: card.card_faces?.[0]?.name ?? card.name.split(' // ')[0],
  };
  for (const rawLine of face.oracleText.replace(/’/g, "'").split('\n')) {
    const line = rawLine.replace(/\s*\([^)]*\)/g, '').trim();
    const lower = line.toLowerCase();
    if (lower.startsWith('partner with ')) {
      ability.partnerWith = line.slice('partner with '.length).trim();
      continue;
    }
    for (const part of lower.split(',')) {
      const keyword = part.trim();
      if (keyword === 'partner') {
        ability.partner = true;
      } else if (keyword.startsWith('partner—')) {
        ability.partnerQuality = keyword.slice('partner—'.length).trim();
      } else if (keyword === 'friends forever') {
        ability.friendsForever = true;
      } else if (keyword === 'choose a background') {
        ability.chooseBackground = true;
      } else if (keyword === "doctor's companion") {
        ability.doctorsCompanion = true;
      }
    }
  }
  return ability;
}

function sameName(a: string | null, b: string) {
  return a !== null && a.toLowerCase() === b.toLowerCase();
}

export function canPair(first: ScryfallCard, second: ScryfallCard): boolean {
  const a = partnerAbility(first);
  const b = partnerAbility(second);
  return (
    (a.partner && b.partner) ||
    (sameName(a.partnerWith, b.name) && sameName(b.partnerWith, a.name)) ||
    (a.partnerQuality !== null && a.partnerQuality === b.partnerQuality) ||
    (a.friendsForever && b.friendsForever) ||
    (a.chooseBackground && b.background) ||
    (b.chooseBackground && a.background) ||
    (a.doctorsCompanion && b.timeLordDoctor) ||
    (b.doctorsCompanion && a.timeLordDoctor)
  );
}
