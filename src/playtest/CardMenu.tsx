import { ActionIcon, Group, Menu, Text } from '@mantine/core';

import type { Zone } from './engine';
import { useTable } from './table';

export const COUNTER_KINDS = ['+1/+1', '-1/-1', 'loyauté', 'charge'];

const destinations: { zone: Zone; position?: 'top' | 'bottom'; label: string }[] = [
  { zone: 'hand', label: 'En main' },
  { zone: 'battlefield', label: 'Sur le champ de bataille' },
  { zone: 'graveyard', label: 'Au cimetière' },
  { zone: 'exile', label: 'En exil' },
  { zone: 'library', position: 'top', label: 'Sur le dessus de la bibliothèque' },
  { zone: 'library', position: 'bottom', label: 'Sous la bibliothèque' },
];

export function CardMenu({ id }: { id: string }) {
  const { state, act, backOf } = useTable();
  const card = state.cards[id];
  const zone = Object.entries(state.zones).find(([, ids]) => ids.includes(id))?.[0] as Zone | undefined;
  if (!card || !zone) {
    return null;
  }
  const onField = zone === 'battlefield';
  const moveTo = (to: Zone, position?: 'top' | 'bottom', faceDown?: boolean) =>
    act({ type: 'move', id, to, position, faceDown });

  return (
    <>
      <Menu.Label>{card.token ? `${card.name} (jeton)` : card.name}</Menu.Label>
      {zone === 'hand' && state.pendingBottom > 0 && (
        <Menu.Item onClick={() => act({ type: 'bottomFromHand', id })}>
          Mettre sous la bibliothèque (mulligan)
        </Menu.Item>
      )}
      {!onField && (
        <>
          <Menu.Item onClick={() => moveTo('battlefield')}>{zone === 'command' ? 'Lancer' : 'Jouer'}</Menu.Item>
          {zone === 'hand' && (
            <Menu.Item onClick={() => moveTo('battlefield', undefined, true)}>Jouer face cachée</Menu.Item>
          )}
        </>
      )}
      {onField && (
        <>
          <Menu.Item onClick={() => act({ type: 'tap', id })}>{card.tapped ? 'Dégager' : 'Engager'}</Menu.Item>
          {backOf(card) && (
            <Menu.Item onClick={() => act({ type: 'flip', id })}>
              {card.flipped ? 'Montrer le recto' : 'Transformer (verso)'}
            </Menu.Item>
          )}
          <Menu.Item onClick={() => act({ type: 'faceDown', id })}>
            {card.faceDown ? 'Retourner face visible' : 'Retourner face cachée'}
          </Menu.Item>
          <Menu.Item onClick={() => act({ type: 'clone', id })}>Copier (jeton)</Menu.Item>
          <Menu.Divider />
          <Menu.Label>Marqueurs</Menu.Label>
          {COUNTER_KINDS.map((kind) => (
            <Group key={kind} justify="space-between" px="sm" py={2} wrap="nowrap">
              <Text size="sm">{kind}</Text>
              <Group gap={6} wrap="nowrap">
                <ActionIcon
                  size="sm"
                  variant="default"
                  aria-label={`Retirer un marqueur ${kind}`}
                  disabled={!card.counters[kind]}
                  onClick={() => act({ type: 'setCounter', id, kind, delta: -1 })}
                >
                  −
                </ActionIcon>
                <Text size="sm" w={20} ta="center">
                  {card.counters[kind] ?? 0}
                </Text>
                <ActionIcon
                  size="sm"
                  variant="default"
                  aria-label={`Ajouter un marqueur ${kind}`}
                  onClick={() => act({ type: 'setCounter', id, kind, delta: 1 })}
                >
                  +
                </ActionIcon>
              </Group>
            </Group>
          ))}
        </>
      )}
      <Menu.Divider />
      {destinations
        .filter((destination) => destination.zone !== zone && !(onField && destination.zone === 'battlefield'))
        .map((destination) => (
          <Menu.Item
            key={`${destination.zone}:${destination.position}`}
            onClick={() => moveTo(destination.zone, destination.position)}
          >
            {destination.label}
          </Menu.Item>
        ))}
      {card.commander && zone !== 'command' && (
        <Menu.Item onClick={() => moveTo('command')}>Dans la zone de commandement</Menu.Item>
      )}
    </>
  );
}
