import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { DeckEntry } from '../deckEntries';
import { deckApi } from './apiPort';
import { type EntryIntent, planEntryEdit } from './plan';
import type { Invalidate } from './port';
import type { Plan, PlanDeck } from './requests';
import { runPlan } from './runPlan';

export function useDeckEntryMutations(deck: PlanDeck) {
  const queryClient = useQueryClient();
  const invalidate: Invalidate = ({ collection }) =>
    Promise.all(
      (collection ? ['decks', 'cards', 'storages'] : ['decks']).map((key) =>
        queryClient.invalidateQueries({ queryKey: [key] }),
      ),
    );

  const mutation = useMutation({
    mutationFn: (plan: Plan) => runPlan(plan, deckApi, invalidate),
  });

  return {
    run: (entry: DeckEntry, intent: EntryIntent) => mutation.mutateAsync(planEntryEdit(deck, entry, intent)),
    // For plans that span several entries (history lines).
    runPlan: (plan: Plan) => mutation.mutateAsync(plan),
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
