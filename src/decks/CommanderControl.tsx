import { Button, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';

import { errorMessage } from '../api/errors';
import type { Deck } from '../api/types';
import { canPair, commanderEligibility } from '../scryfall/commander';
import { useScryfallCard } from '../scryfall/hooks';
import { useUpdateDeck } from './api';
import { type CommanderSlot, hasCommander, hasPartner, setSlotChanges, type SlotTarget } from './commanders';

const ineligibilityMessages = {
  not_eligible:
    "Cette carte ne peut pas être commandant : il faut une créature légendaire, un véhicule légendaire avec force et endurance, ou une carte qui précise qu'elle peut être ton commandant.",
  banned: 'Cette carte est bannie en Commander.',
} as const;

const unpairedMessage = 'Ces deux commandants ne peuvent pas être associés.';

interface CommanderControlProps {
  deck: Deck;
  name: string;
  scryfallId: string;
  slot: CommanderSlot | null;
  target: SlotTarget;
}

function otherCommanderId(deck: Deck, slot: CommanderSlot | null) {
  if (slot === 'commander') {
    return deck.partner_scryfall_id;
  }
  if (slot === 'partner' || (hasCommander(deck) && !hasPartner(deck))) {
    return deck.commander_scryfall_id;
  }
  return null;
}

export function CommanderControl({ deck, name, scryfallId, slot, target }: CommanderControlProps) {
  const scryfallCard = useScryfallCard(scryfallId);
  const other = useScryfallCard(otherCommanderId(deck, slot) ?? null);
  const update = useUpdateDeck();
  const eligibility = scryfallCard.data ? commanderEligibility(scryfallCard.data) : null;
  const paired = scryfallCard.data && other.data ? canPair(scryfallCard.data, other.data) : null;

  if (slot !== null) {
    return (
      <Stack gap={4}>
        <Text size="sm">
          {slot === 'commander' ? "C'est le commandant de ce deck." : "C'est le second commandant de ce deck."}
        </Text>
        {slot === 'commander' && eligibility && eligibility !== 'eligible' && (
          <Text size="sm" c="orange">
            {ineligibilityMessages[eligibility]}
          </Text>
        )}
        {paired === false && (
          <Text size="sm" c="orange">
            {unpairedMessage}
          </Text>
        )}
      </Stack>
    );
  }

  function ignore() {}

  function choose(chosen: CommanderSlot) {
    const role = chosen === 'commander' ? 'le commandant' : 'le second commandant';
    update
      .mutateAsync({ id: deck.id, changes: setSlotChanges(chosen, target) })
      .then(() => notifications.show({ color: 'green', message: `${name} est maintenant ${role} du deck.` }), ignore);
  }

  if (scryfallCard.isLoading || other.isLoading) {
    return (
      <Button variant="light" loading disabled>
        Définir comme commandant
      </Button>
    );
  }
  if (!scryfallCard.data) {
    return (
      <Text size="sm" c="dimmed">
        Impossible de vérifier sur Scryfall si cette carte peut être commandant. Réessaie plus tard.
      </Text>
    );
  }
  if (!paired && eligibility !== 'eligible') {
    return eligibility ? (
      <Text size="sm" c="dimmed">
        {ineligibilityMessages[eligibility]}
      </Text>
    ) : null;
  }
  return (
    <Stack gap={4}>
      <Button variant="light" onClick={() => choose(paired ? 'partner' : 'commander')} loading={update.isPending}>
        {paired ? 'Définir comme second commandant' : 'Définir comme commandant'}
      </Button>
      {update.error && (
        <Text size="xs" c="red">
          {errorMessage(update.error)}
        </Text>
      )}
    </Stack>
  );
}
