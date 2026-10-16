import { fetchCardsByIds, hasMisprintedFaces, type ScryfallCard, withSingleReversibleName } from './client';

const DATABASE = 'tamiyo-scryfall';
const STORE = 'cards';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

interface StoredCard {
  id: string;
  card: ScryfallCard;
  storedAt: number;
}

const memory = new Map<string, ScryfallCard | null>();
const loading = new Map<string, Promise<void>>();
let database: Promise<IDBDatabase | null> | undefined;

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function openDatabase(): Promise<IDBDatabase | null> {
  database ??= new Promise<IDBDatabase | null>((resolve) => {
    try {
      const open = indexedDB.open(DATABASE, 1);
      open.onupgradeneeded = () => open.result.createObjectStore(STORE, { keyPath: 'id' });
      open.onsuccess = () => {
        resolve(open.result);
        void pruneExpired(open.result);
      };
      open.onerror = () => resolve(null);
      open.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return database;
}

async function pruneExpired(db: IDBDatabase) {
  try {
    const store = db.transaction(STORE, 'readwrite').objectStore(STORE);
    const all = await request(store.getAll() as IDBRequest<StoredCard[]>);
    const expired = all.filter((entry) => Date.now() - entry.storedAt > MAX_AGE_MS);
    if (expired.length > 0) {
      const writable = db.transaction(STORE, 'readwrite').objectStore(STORE);
      for (const entry of expired) {
        writable.delete(entry.id);
      }
    }
  } catch {
    return;
  }
}

async function readStored(ids: string[]): Promise<ScryfallCard[]> {
  const db = await openDatabase();
  if (!db) {
    return [];
  }
  try {
    const store = db.transaction(STORE, 'readonly').objectStore(STORE);
    const entries = await Promise.all(ids.map((id) => request(store.get(id) as IDBRequest<StoredCard | undefined>)));
    return entries
      .filter((entry): entry is StoredCard => !!entry && Date.now() - entry.storedAt <= MAX_AGE_MS)
      .map((entry) => withSingleReversibleName(entry.card))
      .filter((card) => !hasMisprintedFaces(card));
  } catch {
    return [];
  }
}

async function writeStored(cards: ScryfallCard[]) {
  const db = await openDatabase();
  if (!db || cards.length === 0) {
    return;
  }
  try {
    const store = db.transaction(STORE, 'readwrite').objectStore(STORE);
    const storedAt = Date.now();
    for (const card of cards) {
      store.put({ id: card.id, card, storedAt } satisfies StoredCard);
    }
  } catch {
    return;
  }
}

export function rememberCards(cards: ScryfallCard[]) {
  for (const card of cards) {
    memory.set(card.id, card);
  }
  void writeStored(cards);
}

async function load(ids: string[]) {
  const stored = await readStored(ids);
  for (const card of stored) {
    memory.set(card.id, card);
  }
  const missing = ids.filter((id) => !memory.has(id));
  if (missing.length === 0) {
    return;
  }
  const fetched = await fetchCardsByIds(missing);
  rememberCards(fetched);
  for (const id of missing) {
    if (!memory.has(id)) {
      memory.set(id, null);
    }
  }
}

export async function loadCards(ids: string[]): Promise<Record<string, ScryfallCard>> {
  const missing = [...new Set(ids)].filter((id) => !memory.has(id) && !loading.has(id));
  if (missing.length > 0) {
    const pending = load(missing);
    for (const id of missing) {
      loading.set(id, pending);
    }
    const done = () => missing.forEach((id) => loading.delete(id));
    pending.then(done, done);
  }
  await Promise.all(ids.map((id) => loading.get(id)));

  const cards: Record<string, ScryfallCard> = {};
  for (const id of ids) {
    const card = memory.get(id);
    if (card) {
      cards[id] = card;
    }
  }
  return cards;
}
