import type { Card, PendingCard } from '../../api/types';
import type { DeckApiPort } from './port';
import { printingFields } from './printingFields';
import type { DeckRequest, DeckRequestKind, DeckResponses, RequestOf } from './requests';

type Responders = { [K in DeckRequestKind]: (request: RequestOf<K>) => DeckResponses[K] };

interface FakeOptions {
  failOn?: DeckRequestKind;
  nextPendingId?: number;
}

// An in-memory deck API port for tests: records every request and answers with plausible responses.
export function fakeDeckApi({ failOn, nextPendingId = 1000 }: FakeOptions = {}) {
  const calls: DeckRequest[] = [];
  const invalidations: { collection: boolean }[] = [];
  const addedPending: PendingCard[] = [];
  let pendingId = nextPendingId;
  let cardId = 5000;

  const responders: Responders = {
    removeCard: () => undefined,
    removeCopies: () => undefined,
    removePending: () => undefined,
    setPendingQuantity: () => undefined,
    moveCards: () => undefined,
    movePending: () => undefined,
    putCardOnBoard: () => undefined,
    patchDeck: () => undefined,
    addPending: ({ deckId, card }) => {
      const added: PendingCard = {
        id: pendingId++,
        deck_id: deckId,
        ...printingFields({ ...card, foil: card.foil ?? false, mana_value: card.mana_value ?? 0 }),
        proxy: card.proxy ?? false,
        quantity: card.quantity,
        board: card.board ?? 'main',
        price: null,
        game_changer: false,
        added: '2026-01-01T00:00:00Z',
        owned_copies: 0,
        owned_same_printing: 0,
      };
      addedPending.push(added);
      return added;
    },
    importDeckLine: ({ count }) => ({ cards_linked: count }),
    commitPending: ({ quantity }) => ({ cards_created: quantity ?? 1 }),
    createCards: ({ card, quantity }) =>
      Array.from({ length: quantity }, (): Card => ({ ...card, id: cardId++, added: '', updated: '' }) as Card),
    switchFinish: (request) => ({ cards_linked: 'cardIds' in request ? request.cardIds.length : 0 }),
    switchProxy: (request) => ({ cards_linked: 'cardIds' in request ? request.cardIds.length : 0 }),
  };

  const kinds = Object.keys(responders) as DeckRequestKind[];
  const port = Object.fromEntries(
    kinds.map((kind) => [
      kind,
      async (request: DeckRequest) => {
        calls.push(request);
        if (failOn === kind) {
          throw new Error(`${kind} failed`);
        }
        return (responders[kind] as (request: DeckRequest) => unknown)(request);
      },
    ]),
  ) as DeckApiPort;

  function invalidate(scope: { collection: boolean }) {
    invalidations.push(scope);
  }

  return { port, invalidate, calls, invalidations, addedPending };
}
