import type { components, paths } from './schema';

export type Card = components['schemas']['Card'];
export type Storage = components['schemas']['Storage'];
export type CreateCardInput = components['schemas']['CreateCardRequest'];
export type UpdateCardInput = components['schemas']['UpdateCardRequest'];
export type DetailsRefreshSummary = components['schemas']['DetailsRefreshSummary'];
export type CardSort = NonNullable<NonNullable<paths['/cards']['get']['parameters']['query']>['sort']>;
export type DeckCardSort = NonNullable<
  NonNullable<paths['/deck/{id}/cards']['get']['parameters']['query']>['sort']
>;
export type Deck = components['schemas']['Deck'];
export type DeckStats = components['schemas']['DeckStats'];
export type LegalityReport = components['schemas']['LegalityReport'];
export type UpdateDeckInput = components['schemas']['UpdateDeckRequest'];
export type ImportSummary = components['schemas']['ImportSummary'];
export type PendingCard = components['schemas']['PendingCard'];
export type AddPendingCardInput = components['schemas']['AddPendingCardRequest'];
