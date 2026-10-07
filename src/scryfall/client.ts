import { ApiError } from '../api/errors';
import type { ScryfallRef } from './dragDrop';

const SCRYFALL_API = 'https://api.scryfall.com';
const COLLECTION_BATCH_SIZE = 75;
const MAX_SEARCH_PAGES = 5;
const DELAY_BETWEEN_REQUESTS_MS = 100;

type ImageSize = 'small' | 'normal';

interface ImageUris {
  small: string;
  normal: string;
  art_crop?: string;
}

export interface ScryfallCard {
  id: string;
  layout?: string;
  oracle_id?: string;
  name: string;
  set: string;
  set_name: string;
  collector_number: string;
  cmc?: number;
  released_at: string;
  finishes?: string[];
  type_line?: string;
  mana_cost?: string;
  oracle_text?: string;
  flavor_text?: string;
  lang?: string;
  printed_name?: string;
  printed_type_line?: string;
  printed_text?: string;
  power?: string;
  toughness?: string;
  loyalty?: string;
  defense?: string;
  rarity?: string;
  colors?: string[];
  color_identity?: string[];
  artist?: string;
  legalities?: Record<string, string>;
  image_uris?: ImageUris;
  card_faces?: {
    image_uris?: ImageUris;
    colors?: string[];
    artist?: string;
    name?: string;
    mana_cost?: string;
    type_line?: string;
    oracle_text?: string;
    flavor_text?: string;
    printed_name?: string;
    printed_type_line?: string;
    printed_text?: string;
    power?: string;
    toughness?: string;
    loyalty?: string;
    defense?: string;
  }[];
}

interface ScryfallList<T> {
  data: T[];
  has_more?: boolean;
  next_page?: string;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scryfall<T>(pathOrUrl: string, init?: RequestInit): Promise<T | null> {
  const url = pathOrUrl.startsWith('https://') ? pathOrUrl : `${SCRYFALL_API}${pathOrUrl}`;
  const headers: Record<string, string> = init?.body ? { 'Content-Type': 'application/json' } : {};

  const response = await fetch(url, { ...init, headers });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new ApiError(response.status, 'Scryfall request failed');
  }
  return (await response.json()) as T;
}

export function imageUrl(card: ScryfallCard, size: ImageSize): string | undefined {
  return card.image_uris?.[size] ?? card.card_faces?.[0]?.image_uris?.[size];
}

export interface CardArt {
  url: string;
  artist: string | null;
}

export function cardArt(card: ScryfallCard): CardArt | null {
  const face = card.card_faces?.[0];
  const url = card.image_uris?.art_crop ?? face?.image_uris?.art_crop;
  if (!url) {
    return null;
  }
  return { url, artist: card.artist ?? face?.artist ?? null };
}

export function cardColors(card: ScryfallCard): string[] {
  return card.colors ?? card.card_faces?.flatMap((face) => face.colors ?? []) ?? [];
}

export async function fetchCard(ref: ScryfallRef): Promise<ScryfallCard | null> {
  const path =
    'id' in ref ? `/cards/${ref.id}` : `/cards/${encodeURIComponent(ref.set)}/${encodeURIComponent(ref.number)}`;
  return scryfall<ScryfallCard>(path);
}

export interface CardSuggestion {
  name: string;
  typeLine?: string;
}

const MAX_SEARCH_SUGGESTIONS = 30;

export function isAdvancedQuery(query: string) {
  return /[:<>=]/.test(query) || /^[!"(-]/.test(query.trim());
}

export async function searchCardSuggestions(query: string): Promise<CardSuggestion[]> {
  const result = await scryfall<ScryfallList<ScryfallCard>>(
    `/cards/search?q=${encodeURIComponent(query)}&unique=cards&order=name`,
  );
  return (result?.data ?? []).slice(0, MAX_SEARCH_SUGGESTIONS).map((card) => ({
    name: card.name,
    typeLine: card.type_line ?? card.card_faces?.[0]?.type_line,
  }));
}

export async function fetchFrenchPrinting(card: ScryfallCard): Promise<ScryfallCard | null> {
  const sameEdition = await scryfall<ScryfallCard>(
    `/cards/${encodeURIComponent(card.set)}/${encodeURIComponent(card.collector_number)}/fr`,
  );
  if (sameEdition) {
    return sameEdition;
  }
  if (!card.oracle_id) {
    return null;
  }
  await delay(DELAY_BETWEEN_REQUESTS_MS);
  const query = encodeURIComponent(`oracleid:${card.oracle_id} lang:fr`);
  const other = await scryfall<ScryfallList<ScryfallCard>>(
    `/cards/search?q=${query}&unique=prints&order=released&dir=desc`,
  );
  return other?.data[0] ?? null;
}

export async function autocompleteCardNames(query: string): Promise<string[]> {
  const result = await scryfall<ScryfallList<string>>(
    `/cards/autocomplete?q=${encodeURIComponent(query)}`,
  );
  return result?.data ?? [];
}

export async function searchPrintings(name: string): Promise<ScryfallCard[]> {
  const card = await scryfall<ScryfallCard>(`/cards/named?exact=${encodeURIComponent(name)}`);
  if (!card?.oracle_id) {
    return [];
  }

  const query = encodeURIComponent(`oracleid:${card.oracle_id} game:paper`);
  const printings: ScryfallCard[] = [];
  let next: string | undefined = `/cards/search?q=${query}&unique=prints&order=released&dir=desc`;

  for (let page = 0; next && page < MAX_SEARCH_PAGES; page++) {
    if (page > 0) {
      await delay(DELAY_BETWEEN_REQUESTS_MS);
    }
    const result: ScryfallList<ScryfallCard> | null = await scryfall<ScryfallList<ScryfallCard>>(next);
    printings.push(...(result?.data ?? []));
    next = result?.has_more ? result.next_page : undefined;
  }

  return printings;
}

export async function fetchCardsByIds(ids: string[]): Promise<ScryfallCard[]> {
  const cards: ScryfallCard[] = [];
  for (let start = 0; start < ids.length; start += COLLECTION_BATCH_SIZE) {
    if (start > 0) {
      await delay(500);
    }
    const identifiers = ids.slice(start, start + COLLECTION_BATCH_SIZE).map((id) => ({ id }));
    const result = await scryfall<ScryfallList<ScryfallCard>>('/cards/collection', {
      method: 'POST',
      body: JSON.stringify({ identifiers }),
    });
    cards.push(...(result?.data ?? []));
  }
  return cards;
}
