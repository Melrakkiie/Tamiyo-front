import type {
  AddPendingCardInput,
  Card,
  CreateCardInput,
  Deck,
  DeckBoard,
  ImportSummary,
  PendingCard,
  UpdateDeckInput,
} from '../../api/types';
import type { components } from '../../api/schema';
import type { DeckCommanders } from '../commanders';
import type { DeckEntry } from '../deckEntries';

// What a planner reads of the deck.
export type PlanDeck = Pick<Deck, 'id'> & DeckCommanders;

export type PendingCommitSummary = components['schemas']['PendingCommitSummary'];

type CardSources = { cardIds: number[] } | { pendingIds: number[] };

export type DeckLineCard = Pick<Card, 'name' | 'set_code' | 'collector_number' | 'foil'>;

// One request the deck API port runs. Each kind maps to one port function.
export type DeckRequest =
  | { kind: 'removeCard'; deckId: string; cardId: number }
  | { kind: 'removeCopies'; deckId: string; cardIds: number[] }
  | { kind: 'removePending'; deckId: string; pendingId: number }
  | { kind: 'setPendingQuantity'; deckId: string; pendingId: number; quantity: number }
  | { kind: 'moveCards'; deckId: string; cardIds: number[]; board: DeckBoard }
  | { kind: 'movePending'; deckId: string; pendingId: number; board: DeckBoard }
  | { kind: 'putCardOnBoard'; deckId: string; cardId: number; board: DeckBoard }
  | { kind: 'patchDeck'; deckId: string; changes: UpdateDeckInput }
  | { kind: 'addPending'; deckId: string; card: AddPendingCardInput }
  | { kind: 'importDeckLine'; deckId: string; card: DeckLineCard; count: number; board: DeckBoard }
  | { kind: 'commitPending'; deckId: string; storageId: number | null; pendingId: number; quantity?: number }
  | { kind: 'createCards'; card: CreateCardInput; quantity: number }
  | ({ kind: 'switchFinish'; deckId: string; foil: boolean } & CardSources)
  | ({ kind: 'switchProxy'; deckId: string; proxy: boolean } & CardSources);

export type DeckRequestKind = DeckRequest['kind'];

export type RequestOf<K extends DeckRequestKind> = Extract<DeckRequest, { kind: K }>;

export interface DeckResponses {
  removeCard: void;
  removeCopies: void;
  removePending: void;
  setPendingQuantity: void;
  moveCards: void;
  movePending: void;
  putCardOnBoard: void;
  patchDeck: void;
  addPending: PendingCard;
  importDeckLine: ImportSummary;
  commitPending: PendingCommitSummary;
  createCards: Card[];
  switchFinish: ImportSummary;
  switchProxy: ImportSummary;
}

export type DeckResponse = DeckResponses[DeckRequestKind];

// Which requests change the collection, so that the collection and storages are refreshed with the deck.
export const touchesCollection: Record<DeckRequestKind, boolean> = {
  removeCard: false,
  removeCopies: false,
  removePending: false,
  setPendingQuantity: false,
  moveCards: false,
  movePending: false,
  putCardOnBoard: false,
  patchDeck: false,
  addPending: false,
  importDeckLine: true,
  commitPending: true,
  createCards: true,
  switchFinish: true,
  switchProxy: true,
};

// Stands for the id of the pending card an earlier addPending step of the same plan returned.
export interface AddedPendingId {
  addedPendingOf: number;
}

export function addedPendingId(step: number): AddedPendingId {
  return { addedPendingOf: step };
}

type PlannedChanges = { [K in keyof UpdateDeckInput]: UpdateDeckInput[K] | AddedPendingId };

// A step of a plan: a deck request, whose commander slot changes may name a pending card added by an earlier step.
export type PlannedRequest =
  | Exclude<DeckRequest, { kind: 'patchDeck' }>
  | {
      kind: 'patchDeck';
      deckId: string;
      changes: PlannedChanges;
    };

export interface Plan {
  steps: PlannedRequest[];
  // Copies the change adds, removes or moves, for messages.
  affected: number;
  // The entry once the plan has run: null when it left the deck, or the pending card an addPending step added.
  entry: DeckEntry | null | AddedPendingId;
}
