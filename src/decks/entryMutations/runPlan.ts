import type { PendingCard } from '../../api/types';
import { type DeckEntry, pendingEntry } from '../deckEntries';
import type { DeckApiPort, Invalidate } from './port';
import { type AddedPendingId, type DeckRequest, type DeckResponse, type Plan, touchesCollection } from './requests';

export interface PlanResult {
  entry: DeckEntry | null;
  affected: number;
  // The response of each request, in plan order.
  responses: DeckResponse[];
}

function isAddedPendingId(value: unknown): value is AddedPendingId {
  return typeof value === 'object' && value !== null && 'addedPendingOf' in value;
}

function addedPending(ref: AddedPendingId, responses: DeckResponse[]): PendingCard {
  const response = responses[ref.addedPendingOf];
  if (typeof response !== 'object' || response === null || !('deck_id' in response)) {
    throw new Error(`step ${ref.addedPendingOf} did not add a pending card`);
  }
  return response;
}

function resolve(value: unknown, responses: DeckResponse[]): unknown {
  if (isAddedPendingId(value)) {
    return addedPending(value, responses).id;
  }
  if (Array.isArray(value)) {
    return value.map((item) => resolve(item, responses));
  }
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolve(item, responses)]));
  }
  return value;
}

function send(port: DeckApiPort, request: DeckRequest): Promise<DeckResponse> {
  const call = port[request.kind] as (request: DeckRequest) => Promise<DeckResponse>;
  return call(request);
}

// Runs a plan's requests in order, stops at the first failure, and invalidates once when the plan settles.
export async function runPlan(plan: Plan, port: DeckApiPort, invalidate: Invalidate): Promise<PlanResult> {
  const responses: DeckResponse[] = [];
  let collection = false;
  try {
    for (const step of plan.steps) {
      const request = resolve(step, responses) as DeckRequest;
      collection ||= touchesCollection[request.kind];
      responses.push(await send(port, request));
    }
  } catch (error) {
    // The request error is the one to surface, even when refreshing fails too.
    await Promise.resolve(invalidate({ collection })).catch(() => undefined);
    throw error;
  }
  await invalidate({ collection });
  const entry = isAddedPendingId(plan.entry) ? pendingEntry(addedPending(plan.entry, responses)) : plan.entry;
  return { entry, affected: plan.affected, responses };
}
