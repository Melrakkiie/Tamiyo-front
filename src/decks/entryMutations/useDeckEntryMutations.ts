import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { DeckEntry } from '../deckEntries';
import { deckApi } from './apiPort';
import { type EntryIntent, planEntryEdit } from './plan';
import type { Invalidate } from './port';
import type { PlanDeck } from './requests';
import { runPlan } from './runPlan';

// Edits the entries of a deck: one operation for every intent, one busy flag and one error.
export function useDeckEntryMutations(deck: PlanDeck) {
  const queryClient = useQueryClient();
  const invalidate: Invalidate = ({ collection }) =>
    Promise.all(
      (collection ? ['decks', 'cards', 'storages'] : ['decks']).map((key) =>
        queryClient.invalidateQueries({ queryKey: [key] }),
      ),
    );

  const mutation = useMutation({
    mutationFn: ({ entry, intent }: { entry: DeckEntry; intent: EntryIntent }) =>
      runPlan(planEntryEdit(deck, entry, intent), deckApi, invalidate),
  });

  return {
    run: (entry: DeckEntry, intent: EntryIntent) => mutation.mutateAsync({ entry, intent }),
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
