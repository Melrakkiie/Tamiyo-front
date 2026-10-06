import type { components, paths } from './schema';

export type Card = components['schemas']['Card'];
export type Storage = components['schemas']['Storage'];
export type CreateCardInput = components['schemas']['CreateCardRequest'];
export type UpdateCardInput = components['schemas']['UpdateCardRequest'];
export type CardSort = NonNullable<NonNullable<paths['/cards']['get']['parameters']['query']>['sort']>;
