import { describe, expect, it } from 'vitest';

import { forest, serraAngel } from '../scryfall/fixtures';
import { deckCard, pendingCard } from './boardTestHelpers';
import { commanderCardIds } from './commanders';
import { pendingToCards } from './pendingCards';

describe('commanderCardIds', () => {
  it('returns the owned commander and partner ids', () => {
    const ids = commanderCardIds({ commander_id: 3, partner_id: 5 }, []);
    expect(ids).toEqual([3, 5]);
  });

  it('resolves a pending commander to the id of its first copy', () => {
    const pending = pendingToCards([pendingCard(serraAngel, { id: 7, quantity: 2 })]);
    const ids = commanderCardIds({ commander_pending_id: 7 }, [deckCard(forest), ...pending]);
    expect(ids).toEqual([pending[0].id]);
  });

  it('mixes an owned commander with a pending partner', () => {
    const pending = pendingToCards([pendingCard(serraAngel, { id: 9 })]);
    const ids = commanderCardIds({ commander_id: 4, partner_pending_id: 9 }, pending);
    expect(ids).toEqual([4, pending[0].id]);
  });

  it('ignores a pending commander that is not in the cards', () => {
    expect(commanderCardIds({ commander_pending_id: 7 }, [])).toEqual([]);
  });
});
