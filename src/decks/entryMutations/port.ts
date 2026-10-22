import type { DeckRequestKind, DeckResponses, RequestOf } from './requests';

// One function per request kind; each rejects when its request fails.
export type DeckApiPort = { [K in DeckRequestKind]: (request: RequestOf<K>) => Promise<DeckResponses[K]> };

// Refreshes the deck queries, with the collection and storages when the plan touched the collection.
export type Invalidate = (scope: { collection: boolean }) => Promise<unknown> | void;
