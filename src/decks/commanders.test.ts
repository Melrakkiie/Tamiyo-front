import { describe, expect, it } from 'vitest';

import { commanderTargets } from './commanders';

describe('commanderTargets', () => {
  it('returns the owned commander and partner', () => {
    expect(commanderTargets({ commander_id: 3, partner_id: 5 })).toEqual([{ cardId: 3 }, { cardId: 5 }]);
  });

  it('mixes an owned commander with a pending partner', () => {
    expect(commanderTargets({ commander_id: 4, partner_pending_id: 9 })).toEqual([{ cardId: 4 }, { pendingId: 9 }]);
  });

  it('returns nothing for a deck without commander', () => {
    expect(commanderTargets({})).toEqual([]);
  });
});
