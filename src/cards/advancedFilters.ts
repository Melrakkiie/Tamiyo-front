import type { paths } from '../api/schema';

type CardsQuery = NonNullable<paths['/cards']['get']['parameters']['query']>;

export type ColorMode = NonNullable<CardsQuery['color_mode']>;
export type ManaValueOp = NonNullable<CardsQuery['mana_value_op']>;
export type TypeFilter = NonNullable<CardsQuery['type']>;

export const COLORLESS = 'C';

export interface AdvancedFilters {
  colors: string;
  colorMode: ColorMode;
  manaValue: number | null;
  manaValueOp: ManaValueOp;
  type: TypeFilter | null;
  subtype: string;
  legalIn: string | null;
  colorCount: number | null;
  identity: string;
  foil: boolean | null;
  storageType: string | null;
  storageId: number | null;
}

const keys = {
  colors: 'couleurs',
  colorMode: 'mode',
  manaValue: 'cmc',
  manaValueOp: 'cmcop',
  type: 'type',
  subtype: 'soustype',
  legalIn: 'format',
  colorCount: 'ncouleurs',
  identity: 'identite',
  foil: 'foil',
  storageType: 'typerangement',
  storageId: 'storage',
} as const;

export const advancedFilterKeys: string[] = Object.values(keys);

const colorModes: ColorMode[] = ['exact', 'include', 'within'];
const manaValueOps: ManaValueOp[] = ['eq', 'lt', 'lte', 'gt', 'gte'];
const typeFilters: TypeFilter[] = [
  'Creature',
  'Planeswalker',
  'Battle',
  'Instant',
  'Sorcery',
  'Artifact',
  'Enchantment',
  'Land',
];

function letters(raw: string | null, allowed: string) {
  return [...(raw ?? '').toUpperCase()]
    .filter((letter, index, all) => allowed.includes(letter) && all.indexOf(letter) === index)
    .join('');
}

function numberOrNull(raw: string | null) {
  if (raw === null || raw.trim() === '') {
    return null;
  }
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export function parseAdvancedFilters(params: URLSearchParams): AdvancedFilters {
  const colors = letters(params.get(keys.colors), 'WUBRGC');
  const colorCount = numberOrNull(params.get(keys.colorCount));
  const foil = params.get(keys.foil);
  return {
    colors: colors.includes(COLORLESS) ? COLORLESS : colors,
    colorMode: colorModes.find((mode) => mode === params.get(keys.colorMode)) ?? 'exact',
    manaValue: numberOrNull(params.get(keys.manaValue)),
    manaValueOp: manaValueOps.find((op) => op === params.get(keys.manaValueOp)) ?? 'eq',
    type: typeFilters.find((type) => type === params.get(keys.type)) ?? null,
    subtype: params.get(keys.subtype)?.trim() ?? '',
    legalIn: params.get(keys.legalIn) || null,
    colorCount:
      colorCount !== null && Number.isInteger(colorCount) && colorCount >= 0 && colorCount <= 5 ? colorCount : null,
    identity: letters(params.get(keys.identity), 'WUBRG'),
    foil: foil === 'oui' ? true : foil === 'non' ? false : null,
    storageType: params.get(keys.storageType) || null,
    storageId: numberOrNull(params.get(keys.storageId)),
  };
}

export function advancedFilterParams(filters: Partial<AdvancedFilters>): Record<string, string | null> {
  const changes: Record<string, string | null> = {};
  for (const [field, value] of Object.entries(filters) as [
    keyof AdvancedFilters,
    AdvancedFilters[keyof AdvancedFilters],
  ][]) {
    const key = keys[field];
    if (
      value === null ||
      value === '' ||
      (field === 'colorMode' && value === 'exact') ||
      (field === 'manaValueOp' && value === 'eq')
    ) {
      changes[key] = null;
    } else if (field === 'foil') {
      changes[key] = value ? 'oui' : 'non';
    } else {
      changes[key] = String(value);
    }
  }
  return changes;
}

export function activeFilterCount(filters: AdvancedFilters, withStorage: boolean) {
  return [
    filters.colors !== '',
    filters.manaValue !== null,
    filters.type !== null,
    filters.subtype !== '',
    filters.legalIn !== null,
    filters.colorCount !== null,
    filters.identity !== '',
    filters.foil !== null,
    withStorage && filters.storageType !== null,
    withStorage && filters.storageId !== null,
  ].filter(Boolean).length;
}

export function cardsQueryFilters(filters: AdvancedFilters): Partial<CardsQuery> {
  return {
    colors: filters.colors === '' ? undefined : filters.colors === COLORLESS ? '' : filters.colors,
    color_mode: filters.colors === '' ? undefined : filters.colors === COLORLESS ? 'exact' : filters.colorMode,
    mana_value: filters.manaValue ?? undefined,
    mana_value_op: filters.manaValue === null ? undefined : filters.manaValueOp,
    type: filters.type ?? undefined,
    subtype: filters.subtype || undefined,
    legal_in: filters.legalIn ?? undefined,
    color_count: filters.colorCount ?? undefined,
    foil: filters.foil ?? undefined,
    storage_type: filters.storageType ?? undefined,
    color_identity: filters.identity || undefined,
  };
}
