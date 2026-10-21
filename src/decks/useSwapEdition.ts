import { useMutation } from '@tanstack/react-query';

import { api, unwrap } from '../api/client';
import { useInvalidateDecks } from './api';
import type { CommanderSlot } from './commanders';
import { type DeckEntry, pendingEntry } from './deckEntries';
import { swapEdition, type SwapRequest, type SwapTarget } from './swapEdition';

async function removeSource(request: SwapRequest) {
  const { deckId, remove } = request;
  if (remove.kind === 'card') {
    unwrap(
      await api.DELETE('/deck/{id}/cards/{card_id}', { params: { path: { id: deckId, card_id: remove.cardId } } }),
    );
  } else {
    unwrap(
      await api.DELETE('/deck/{id}/pending/{pending_id}', {
        params: { path: { id: deckId, pending_id: remove.pendingId } },
      }),
    );
  }
}

async function run(request: SwapRequest): Promise<DeckEntry> {
  const { deckId } = request;
  if (request.kind === 'owned') {
    unwrap(
      await api.PUT('/deck/{id}/cards/{card_id}', {
        params: { path: { id: deckId, card_id: request.copyId } },
        body: { board: request.board },
      }),
    );
    if (request.slotChanges) {
      unwrap(await api.PATCH('/deck/{id}', { params: { path: { id: deckId } }, body: request.slotChanges }));
    }
    await removeSource(request);
    if (request.remainder) {
      unwrap(await api.POST('/deck/{id}/pending', { params: { path: { id: deckId } }, body: request.remainder }));
    }
    return request.entry;
  }
  const added = unwrap(await api.POST('/deck/{id}/pending', { params: { path: { id: deckId } }, body: request.card }));
  if (request.slotChanges) {
    unwrap(await api.PATCH('/deck/{id}', { params: { path: { id: deckId } }, body: request.slotChanges(added.id) }));
  }
  await removeSource(request);
  return pendingEntry(added);
}

export function useSwapEdition(deckId: string, commanderSlot: CommanderSlot | null) {
  const invalidate = useInvalidateDecks();
  const mutation = useMutation({
    mutationFn: (request: SwapRequest) => run(request),
    onSettled: invalidate,
  });

  function swap(source: DeckEntry, target: SwapTarget): Promise<DeckEntry> {
    return mutation.mutateAsync(swapEdition(deckId, source, target, commanderSlot));
  }

  return { swap, isPending: mutation.isPending, error: mutation.error };
}
