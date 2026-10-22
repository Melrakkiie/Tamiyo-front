import { api, unwrap } from '../../api/client';
import { importIntoDeck } from '../../bulk/api';
import { createCopies } from '../../cards/api';
import { deckLineFile } from '../AddCopiesToDeckModal';
import type { DeckApiPort } from './port';

function cardPath(deckId: string, cardId: number) {
  return { params: { path: { id: deckId, card_id: cardId } } };
}

function pendingPath(deckId: string, pendingId: number) {
  return { params: { path: { id: deckId, pending_id: pendingId } } };
}

function deckPath(deckId: string) {
  return { params: { path: { id: deckId } } };
}

function sources(request: { cardIds: number[] } | { pendingIds: number[] }) {
  return 'cardIds' in request ? { card_ids: request.cardIds } : { pending_ids: request.pendingIds };
}

// The deck API port on the Tamiyo API.
export const deckApi: DeckApiPort = {
  async removeCard({ deckId, cardId }) {
    unwrap(await api.DELETE('/deck/{id}/cards/{card_id}', cardPath(deckId, cardId)));
  },
  async removeCopies({ deckId, cardIds }) {
    for (const cardId of cardIds) {
      unwrap(await api.DELETE('/deck/{id}/cards/{card_id}', cardPath(deckId, cardId)));
    }
  },
  async removePending({ deckId, pendingId }) {
    unwrap(await api.DELETE('/deck/{id}/pending/{pending_id}', pendingPath(deckId, pendingId)));
  },
  async setPendingQuantity({ deckId, pendingId, quantity }) {
    unwrap(
      await api.PATCH('/deck/{id}/pending/{pending_id}', { ...pendingPath(deckId, pendingId), body: { quantity } }),
    );
  },
  async moveCards({ deckId, cardIds, board }) {
    for (const cardId of cardIds) {
      unwrap(await api.PUT('/deck/{id}/cards/{card_id}', { ...cardPath(deckId, cardId), body: { board } }));
    }
  },
  async movePending({ deckId, pendingId, board }) {
    unwrap(await api.PATCH('/deck/{id}/pending/{pending_id}', { ...pendingPath(deckId, pendingId), body: { board } }));
  },
  async putCardOnBoard({ deckId, cardId, board }) {
    unwrap(await api.PUT('/deck/{id}/cards/{card_id}', { ...cardPath(deckId, cardId), body: { board } }));
  },
  async patchDeck({ deckId, changes }) {
    unwrap(await api.PATCH('/deck/{id}', { ...deckPath(deckId), body: changes }));
  },
  async addPending({ deckId, card }) {
    return unwrap(await api.POST('/deck/{id}/pending', { ...deckPath(deckId), body: card }));
  },
  importDeckLine({ deckId, card, count, board }) {
    return importIntoDeck({ deckId, file: deckLineFile(card, count, board), commanderFromFirstLine: false });
  },
  async commitPending({ deckId, storageId, pendingId, quantity }) {
    return unwrap(
      await api.POST('/deck/{id}/pending/commit', {
        ...deckPath(deckId),
        body: { storage_id: storageId, pending_id: pendingId, quantity },
      }),
    );
  },
  createCards({ card, quantity }) {
    return createCopies(card, quantity);
  },
  async switchFinish(request) {
    return unwrap(
      await api.POST('/deck/{id}/switch-foil', {
        ...deckPath(request.deckId),
        body: { ...sources(request), foil: request.foil },
      }),
    );
  },
  async switchProxy(request) {
    return unwrap(
      await api.POST('/deck/{id}/switch-proxy', {
        ...deckPath(request.deckId),
        body: { ...sources(request), proxy: request.proxy },
      }),
    );
  },
};
