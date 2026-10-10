import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { api, unwrap } from '../api/client';
import type { paths } from '../api/schema';
import { COLORLESS } from '../cards/advancedFilters';

type PublicDecksQuery = NonNullable<paths['/shared/decks']['get']['parameters']['query']>;

export type PublicDeckSort = NonNullable<PublicDecksQuery['sort']>;
export type PublicColorMode = NonNullable<PublicDecksQuery['color_mode']>;

export const PUBLIC_DECKS_PAGE_SIZE = 24;

export const DEFAULT_PUBLIC_SORT: PublicDeckSort = '-updated';

export const publicDeckSortOptions: { value: PublicDeckSort; label: string }[] = [
  { value: '-updated', label: 'Modifiés récemment' },
  { value: '-added', label: 'Créés récemment' },
  { value: '-likes', label: 'Les plus aimés' },
  { value: 'name', label: 'Nom (A → Z)' },
  { value: '-card_count', label: 'Le plus de cartes' },
  { value: 'card_count', label: 'Le moins de cartes' },
];

export interface PublicDeckFilters {
  name: string;
  format: string | null;
  commander: string;
  card: string;
  owner: string;
  colors: string;
  colorMode: PublicColorMode;
  colorCount: number | null;
  sort: PublicDeckSort;
  page: number;
}

const keys = {
  name: 'q',
  format: 'format',
  commander: 'commandant',
  card: 'carte',
  owner: 'joueur',
  colors: 'couleurs',
  colorMode: 'mode',
  colorCount: 'ncouleurs',
  sort: 'tri',
  page: 'page',
} as const;

const colorModes: PublicColorMode[] = ['exact', 'include', 'within'];

function letters(raw: string | null) {
  const picked = [...(raw ?? '').toUpperCase()].filter(
    (letter, index, all) => 'WUBRGC'.includes(letter) && all.indexOf(letter) === index,
  );
  return picked.includes(COLORLESS) ? COLORLESS : picked.join('');
}

function integer(raw: string | null, min: number, max: number) {
  const value = Number(raw);
  return raw !== null && raw.trim() !== '' && Number.isInteger(value) && value >= min && value <= max ? value : null;
}

export function parsePublicDeckFilters(params: URLSearchParams): PublicDeckFilters {
  return {
    name: params.get(keys.name)?.trim() ?? '',
    format: params.get(keys.format) || null,
    commander: params.get(keys.commander)?.trim() ?? '',
    card: params.get(keys.card)?.trim() ?? '',
    owner: params.get(keys.owner)?.trim() ?? '',
    colors: letters(params.get(keys.colors)),
    colorMode: colorModes.find((mode) => mode === params.get(keys.colorMode)) ?? 'exact',
    colorCount: integer(params.get(keys.colorCount), 0, 5),
    sort: publicDeckSortOptions.find((option) => option.value === params.get(keys.sort))?.value ?? DEFAULT_PUBLIC_SORT,
    page: integer(params.get(keys.page), 1, Number.MAX_SAFE_INTEGER) ?? 1,
  };
}

export function publicDeckFilterParams(changes: Partial<PublicDeckFilters>): Record<string, string | null> {
  const params: Record<string, string | null> = {};
  for (const [field, value] of Object.entries(changes) as [
    keyof PublicDeckFilters,
    PublicDeckFilters[keyof PublicDeckFilters],
  ][]) {
    const isDefault =
      value === null ||
      value === '' ||
      (field === 'colorMode' && value === 'exact') ||
      (field === 'sort' && value === DEFAULT_PUBLIC_SORT) ||
      (field === 'page' && value === 1);
    params[keys[field]] = isDefault ? null : String(value);
  }
  return params;
}

export function activePublicFilterCount(filters: PublicDeckFilters) {
  return [
    filters.format !== null,
    filters.commander !== '',
    filters.card !== '',
    filters.owner !== '',
    filters.colors !== '',
    filters.colorCount !== null,
  ].filter(Boolean).length;
}

function toQuery(filters: PublicDeckFilters): PublicDecksQuery {
  return {
    q: filters.name || undefined,
    format: filters.format ?? undefined,
    commander: filters.commander || undefined,
    card: filters.card || undefined,
    owner: filters.owner || undefined,
    colors: filters.colors || undefined,
    color_mode: filters.colors && filters.colors !== COLORLESS ? filters.colorMode : undefined,
    color_count: filters.colorCount ?? undefined,
    sort: filters.sort,
    page: filters.page,
    limit: PUBLIC_DECKS_PAGE_SIZE,
  };
}

export function usePublicDecks(filters: PublicDeckFilters) {
  const query = toQuery(filters);
  return useQuery({
    queryKey: ['shared', 'browse', query],
    queryFn: async () => unwrap(await api.GET('/shared/decks', { params: { query } })),
    placeholderData: keepPreviousData,
  });
}
