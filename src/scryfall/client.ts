import { ApiError } from '../api/errors';
import type { ScryfallRef } from './dragDrop';

const SCRYFALL_API = 'https://api.scryfall.com';
export const MAGIC_CARD_BACK_URL = 'https://backs.scryfall.io/normal/0/a/0aeebaf5-8c7d-4636-9e82-8c27447861f7.jpg';
const COLLECTION_BATCH_SIZE = 75;
const MAX_SEARCH_PAGES = 5;
const DELAY_BETWEEN_REQUESTS_MS = 100;
const RATE_LIMIT_RETRIES = 3;
const RATE_LIMIT_BACKOFF_MS = 1000;

type ImageSize = 'small' | 'normal';

interface ImageUris {
  small: string;
  normal: string;
  art_crop?: string;
}

export interface ScryfallCard {
  id: string;
  layout?: string;
  all_parts?: { id: string; component: string; name: string }[];
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
  keywords?: string[];
  colors?: string[];
  color_identity?: string[];
  artist?: string;
  legalities?: Record<string, string>;
  image_uris?: ImageUris;
  prices?: {
    eur?: string | null;
    eur_foil?: string | null;
    usd?: string | null;
    usd_foil?: string | null;
    usd_etched?: string | null;
  };
  card_faces?: {
    oracle_id?: string;
    image_uris?: ImageUris;
    colors?: string[];
    artist?: string;
    name?: string;
    mana_cost?: string;
    cmc?: number;
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
  total_cards?: number;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let nextRequestAt = 0;

async function waitForTurn() {
  const now = Date.now();
  const turn = Math.max(now, nextRequestAt);
  nextRequestAt = turn + DELAY_BETWEEN_REQUESTS_MS;
  if (turn > now) {
    await delay(turn - now);
  }
}

function retryAfterMs(response: Response, attempt: number) {
  const seconds = Number(response.headers.get('Retry-After'));
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : RATE_LIMIT_BACKOFF_MS * 2 ** attempt;
}

async function scryfall<T>(pathOrUrl: string, init?: RequestInit): Promise<T | null> {
  const url = pathOrUrl.startsWith('https://') ? pathOrUrl : `${SCRYFALL_API}${pathOrUrl}`;
  const headers: Record<string, string> = init?.body ? { 'Content-Type': 'application/json' } : {};

  let response: Response;
  for (let attempt = 0; ; attempt++) {
    await waitForTurn();
    response = await fetch(url, { ...init, headers });
    if (response.status !== 429 || attempt >= RATE_LIMIT_RETRIES) {
      break;
    }
    const wait = retryAfterMs(response, attempt);
    nextRequestAt = Math.max(nextRequestAt, Date.now() + wait);
  }
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new ApiError(response.status, 'Scryfall request failed');
  }
  return (await response.json()) as T;
}

interface ScryfallSet {
  code: string;
  icon_svg_uri?: string;
}

export async function fetchSetIcons(): Promise<Record<string, string>> {
  const result = await scryfall<ScryfallList<ScryfallSet>>('/sets');
  const icons: Record<string, string> = {};
  for (const set of result?.data ?? []) {
    if (set.icon_svg_uri) {
      icons[set.code.toLowerCase()] = set.icon_svg_uri;
    }
  }
  return icons;
}

export function imageUrl(card: ScryfallCard, size: ImageSize): string | undefined {
  return card.image_uris?.[size] ?? card.card_faces?.[0]?.image_uris?.[size];
}

export function cdnImageUrl(id: string, size: ImageSize): string {
  return `https://cards.scryfall.io/${size}/front/${id[0]}/${id[1]}/${id}.jpg`;
}

const doubleFacedLayouts = ['transform', 'modal_dfc', 'reversible_card'];

export function isDoubleFaced(card: ScryfallCard) {
  return !!card.layout && doubleFacedLayouts.includes(card.layout);
}

export function backImageUrl(card: ScryfallCard, size: ImageSize): string | undefined {
  return isDoubleFaced(card) ? card.card_faces?.[1]?.image_uris?.[size] : undefined;
}

export function meldResultId(card: ScryfallCard): string | undefined {
  if (card.layout !== 'meld') {
    return undefined;
  }
  const result = card.all_parts?.find((part) => part.component === 'meld_result');
  return result && result.id !== card.id ? result.id : undefined;
}

export interface CardArt {
  url: string;
  artist: string | null;
}

export type CardFace = 'front' | 'back';

export function cardArt(card: ScryfallCard, shown: CardFace = 'front'): CardArt | null {
  const back = shown === 'back' && isDoubleFaced(card) ? card.card_faces?.[1] : undefined;
  if (back?.image_uris?.art_crop) {
    return { url: back.image_uris.art_crop, artist: back.artist ?? card.artist ?? null };
  }
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

export function cardManaValue(card: ScryfallCard): number {
  return card.cmc ?? card.card_faces?.[0]?.cmc ?? 0;
}

export function withSingleReversibleName(card: ScryfallCard): ScryfallCard {
  if (card.layout !== 'reversible_card') {
    return card;
  }
  return { ...card, name: [...new Set(card.name.split(' // '))].join(' // ') };
}

export function hasMisprintedFaces(card: ScryfallCard) {
  const faces = card.card_faces ?? [];
  return (
    card.layout === 'reversible_card' &&
    faces.length > 1 &&
    new Set(faces.map((face) => face.name)).size > 1 &&
    new Set(faces.map((face) => face.oracle_text)).size === 1 &&
    !!faces[0].oracle_id
  );
}

async function fetchCollection(identifiers: Record<string, string>[]): Promise<ScryfallCard[]> {
  const cards: ScryfallCard[] = [];
  for (let start = 0; start < identifiers.length; start += COLLECTION_BATCH_SIZE) {
    const result = await scryfall<ScryfallList<ScryfallCard>>('/cards/collection', {
      method: 'POST',
      body: JSON.stringify({
        identifiers: identifiers.slice(start, start + COLLECTION_BATCH_SIZE),
      }),
    });
    cards.push(...(result?.data ?? []));
  }
  return cards;
}

function withOracleFaces(card: ScryfallCard, oracle: ScryfallCard | undefined): ScryfallCard {
  if (!oracle?.card_faces) {
    return card;
  }
  return {
    ...card,
    card_faces: card.card_faces?.map((face, index) => {
      const text = oracle.card_faces?.[index];
      if (!text) {
        return face;
      }
      return {
        ...face,
        name: text.name,
        mana_cost: text.mana_cost,
        cmc: text.cmc,
        type_line: text.type_line,
        oracle_text: text.oracle_text,
        power: text.power,
        toughness: text.toughness,
        loyalty: text.loyalty,
        defense: text.defense,
      };
    }),
  };
}

async function repairCards(cards: ScryfallCard[]): Promise<ScryfallCard[]> {
  const named = cards.map(withSingleReversibleName);
  const oracleIds = [...new Set(named.filter(hasMisprintedFaces).map((card) => card.card_faces?.[0]?.oracle_id ?? ''))];
  if (oracleIds.length === 0) {
    return named;
  }
  const fetched = await fetchCollection(oracleIds.map((oracle_id) => ({ oracle_id })));
  const oracles = new Map(fetched.map((oracle) => [oracle.oracle_id, oracle]));
  return named.map((card) =>
    hasMisprintedFaces(card) ? withOracleFaces(card, oracles.get(card.card_faces?.[0]?.oracle_id)) : card,
  );
}

export async function fetchCard(ref: ScryfallRef): Promise<ScryfallCard | null> {
  const path =
    'id' in ref ? `/cards/${ref.id}` : `/cards/${encodeURIComponent(ref.set)}/${encodeURIComponent(ref.number)}`;
  const card = await scryfall<ScryfallCard>(path);
  return card ? (await repairCards([card]))[0] : null;
}

export async function fetchCardByName(name: string): Promise<ScryfallCard | null> {
  const card = await scryfall<ScryfallCard>(`/cards/named?exact=${encodeURIComponent(name)}`);
  return card ? (await repairCards([card]))[0] : null;
}

export interface CardSuggestion {
  name: string;
  typeLine?: string;
}

const MAX_SEARCH_SUGGESTIONS = 30;

export function isAdvancedQuery(query: string) {
  return /[:<>=]/.test(query) || /^[!"(-]/.test(query.trim());
}

export interface CardSuggestions {
  suggestions: CardSuggestion[];
  total: number;
}

function searchByName(query: string) {
  return scryfall<ScryfallList<ScryfallCard>>(`/cards/search?q=${encodeURIComponent(query)}&unique=cards&order=name`);
}

export async function searchCardSuggestions(query: string): Promise<CardSuggestions> {
  const result = await searchByName(query);
  const data = result?.data ?? [];
  return {
    suggestions: data.slice(0, MAX_SEARCH_SUGGESTIONS).map((card) => ({
      name: card.name,
      typeLine: card.type_line ?? card.card_faces?.[0]?.type_line,
    })),
    total: result?.total_cards ?? data.length,
  };
}

export async function searchCards(query: string): Promise<ScryfallCard[]> {
  const result = await searchByName(query);
  return (result?.data ?? []).slice(0, MAX_SEARCH_SUGGESTIONS);
}

export async function fetchFrenchPrinting(card: ScryfallCard): Promise<ScryfallCard | null> {
  const sameEdition = await scryfall<ScryfallCard>(
    `/cards/${encodeURIComponent(card.set)}/${encodeURIComponent(card.collector_number)}/fr`,
  );
  if (sameEdition) {
    return sameEdition;
  }
  const oracleId = card.oracle_id ?? card.card_faces?.[0]?.oracle_id;
  if (!oracleId) {
    return null;
  }
  const query = encodeURIComponent(`oracleid:${oracleId} lang:fr`);
  const other = await scryfall<ScryfallList<ScryfallCard>>(
    `/cards/search?q=${query}&unique=prints&order=released&dir=desc`,
  );
  return other?.data[0] ?? null;
}

export async function autocompleteCardNames(query: string): Promise<string[]> {
  const result = await scryfall<ScryfallList<string>>(`/cards/autocomplete?q=${encodeURIComponent(query)}`);
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
    const result: ScryfallList<ScryfallCard> | null = await scryfall<ScryfallList<ScryfallCard>>(next);
    printings.push(...(result?.data ?? []));
    next = result?.has_more ? result.next_page : undefined;
  }

  return repairCards(printings);
}

export async function fetchCardsByIds(ids: string[]): Promise<ScryfallCard[]> {
  return repairCards(await fetchCollection(ids.map((id) => ({ id }))));
}
