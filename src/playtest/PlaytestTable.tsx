import {
  ActionIcon,
  Anchor,
  Box,
  Button,
  Group,
  Kbd,
  Menu,
  Paper,
  Popover,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from '@mantine/core';
import { useElementSize, useHotkeys, useMediaQuery } from '@mantine/hooks';
import { type ReactNode, useState } from 'react';
import { Link } from 'react-router';

import { useCardContextMenu } from '../cards/CardContextMenu';
import { usePrintingFaces } from '../scryfall/hooks';
import { Sticker, type StickerTone } from '../theme/Sticker';
import { Battlefield } from './Battlefield';
import { CardBack } from './CardBack';
import { CardMenu } from './CardMenu';
import { DraggableCard, PlaytestDragProvider, useDropTarget } from './dragDrop';
import { type DeckEntry, type PlayerCounter, type Zone, zoneOf } from './engine';
import { CardFace, PlaytestCard } from './PlaytestCard';
import { type Table, TableContext, useTable } from './table';
import { CountModal, TokenModal } from './TokenModal';
import { ScryModal, type ViewedZone, ZoneModal } from './ZoneModal';
import { usePlaytest } from './usePlaytest';
import type { PlaytestZoom } from './zoom';

const PREVIEW_WIDTH = 300;
const HAND_GAP = 6;
const MIN_HAND_STEP = 27;

interface CountPrompt {
  title: string;
  run: (count: number) => void;
}

interface Dialogs {
  viewZone: (zone: ViewedZone) => void;
  scry: () => void;
  mill: () => void;
  drawMany: () => void;
  tokens: () => void;
}

interface PlaytestTableProps {
  deckId: string;
  deckName: string;
  deck: DeckEntry[];
  commanderFormat: boolean;
  zoom: PlaytestZoom;
}

export function PlaytestTable({ deckId, deckName, deck, commanderFormat, zoom }: PlaytestTableProps) {
  const playtest = usePlaytest(deck, commanderFormat, zoom.scale);
  const { state, act, undo } = playtest;
  const ids = [...new Set(Object.values(state.cards).map((card) => card.scryfallId))];
  const faces = usePrintingFaces(ids);
  const menu = useCardContextMenu();
  const [hovered, setHovered] = useState<{ id: string; zone: Zone | null } | null>(null);
  const [viewed, setViewed] = useState<ViewedZone | null>(null);
  const [scryCount, setScryCount] = useState<number | null>(null);
  const [countPrompt, setCountPrompt] = useState<CountPrompt | null>(null);
  const [tokensOpened, setTokensOpened] = useState(false);
  const compact = useMediaQuery('(max-width: 62em)') ?? false;
  const canHover = useMediaQuery('(hover: hover)') ?? false;

  const table: Table = {
    ...playtest,
    ...zoom,
    frontOf: (card) => faces.data[card.scryfallId]?.front.images.normal,
    backOf: (card) => faces.data[card.scryfallId]?.back?.images.normal,
    imagesLoading: faces.isLoading,
    preview: (card) => setHovered(card && { id: card.id, zone: zoneOf(state, card.id) }),
    openMenu: (x, y, id) =>
      menu.open(
        { clientX: x, clientY: y, shiftKey: false, nativeEvent: new Event('contextmenu'), preventDefault: () => {} },
        <CardMenu id={id} />,
      ),
  };

  const dialogs: Dialogs = {
    viewZone: setViewed,
    scry: () => setCountPrompt({ title: 'Regarder le dessus', run: setScryCount }),
    mill: () => setCountPrompt({ title: 'Meuler', run: (count) => act({ type: 'mill', count }) }),
    drawMany: () => setCountPrompt({ title: 'Piocher', run: (count) => act({ type: 'draw', count }) }),
    tokens: () => setTokensOpened(true),
  };

  const shownPreview =
    hovered && state.cards[hovered.id] && zoneOf(state, hovered.id) === hovered.zone ? state.cards[hovered.id] : null;

  useHotkeys([
    ['D', () => act({ type: 'draw', count: 1 })],
    ['N', () => act({ type: 'nextTurn' })],
    ['S', () => act({ type: 'shuffle' })],
    ['U', () => act({ type: 'untapAll' })],
    ['L', () => setViewed((current) => (current === 'library' ? null : 'library'))],
    ['X', () => shownPreview && act({ type: 'clone', id: shownPreview.id })],
    ['mod+Z', undo],
  ]);

  return (
    <TableContext.Provider value={table}>
      <PlaytestDragProvider>
        <Stack h="100dvh" gap={0} style={{ overflowY: 'auto' }}>
          <TopBar deckId={deckId} deckName={deckName} compact={compact} dialogs={dialogs} />
          <Group align="stretch" gap="sm" p="sm" wrap="nowrap" style={{ flex: '1 0 45dvh' }}>
            <Box pos="relative" style={{ flex: 1, minWidth: 0 }}>
              <Battlefield />
              {canHover && !compact && shownPreview && (
                <Box
                  pos="absolute"
                  top={12}
                  right={12}
                  w={PREVIEW_WIDTH}
                  style={{
                    pointerEvents: 'none',
                    zIndex: 500,
                    boxShadow: 'var(--mantine-shadow-xl)',
                    borderRadius: 'var(--mantine-radius-md)',
                  }}
                >
                  <CardFace card={{ ...shownPreview, faceDown: false }} width={PREVIEW_WIDTH} />
                </Box>
              )}
            </Box>
            {!compact && <ActionsColumn dialogs={dialogs} />}
          </Group>
          <BottomRow dialogs={dialogs} />
        </Stack>
        {menu.element}
        <ZoneModal zone={viewed} onClose={() => setViewed(null)} />
        <ScryModal count={scryCount} onClose={() => setScryCount(null)} />
        <CountModal prompt={countPrompt} max={state.zones.library.length} onClose={() => setCountPrompt(null)} />
        <TokenModal opened={tokensOpened} onClose={() => setTokensOpened(false)} />
      </PlaytestDragProvider>
    </TableContext.Provider>
  );
}

function Counter({
  label,
  value,
  onChange,
  size = 'md',
}: {
  label: string;
  value: number;
  onChange: (delta: number) => void;
  size?: 'sm' | 'md';
}) {
  return (
    <Group gap={6} wrap="nowrap">
      <ActionIcon variant="default" size={size} aria-label={`${label} −1`} onClick={() => onChange(-1)}>
        −
      </ActionIcon>
      <Text fw={700} size={size === 'md' ? 'xl' : 'md'} miw={size === 'md' ? 36 : 24} ta="center" ff="heading">
        {value}
      </Text>
      <ActionIcon variant="default" size={size} aria-label={`${label} +1`} onClick={() => onChange(1)}>
        +
      </ActionIcon>
    </Group>
  );
}

const playerCounters: { kind: PlayerCounter; label: string }[] = [
  { kind: 'poison', label: 'Poison' },
  { kind: 'energy', label: 'Énergie' },
  { kind: 'experience', label: 'Expérience' },
];

const shortcuts: [string, string][] = [
  ['D', 'Piocher'],
  ['N', 'Tour suivant'],
  ['S', 'Mélanger'],
  ['U', 'Tout dégager'],
  ['L', 'Voir la bibliothèque'],
  ['X', 'Copier la carte survolée'],
  ['Ctrl Z', 'Annuler'],
];

function TopBar({
  deckId,
  deckName,
  compact,
  dialogs,
}: {
  deckId: string;
  deckName: string;
  compact: boolean;
  dialogs: Dialogs;
}) {
  const { state, act, undo, canUndo, scale, zoomIn, zoomOut, canZoomIn, canZoomOut } = useTable();
  const counted = playerCounters.filter(({ kind }) => state.playerCounters[kind] > 0);

  return (
    <Paper radius={0} px="sm" py={8} style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
      <Group justify="space-between" wrap={compact ? 'wrap' : 'nowrap'} gap="xs">
        <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
          <Anchor component={Link} to={`/decks/${deckId}`} size="sm" style={{ flexShrink: 0 }}>
            ← Deck
          </Anchor>
          <Title order={4} lineClamp={1}>
            {deckName}
          </Title>
        </Group>
        <Group gap={compact ? 'xs' : 'md'} wrap={compact ? 'wrap' : 'nowrap'}>
          <Group gap={6} wrap="nowrap">
            <Text size="sm" c="dimmed" visibleFrom="xs">
              Vie
            </Text>
            <Counter label="Points de vie" value={state.life} onChange={(delta) => act({ type: 'setLife', delta })} />
          </Group>
          <Text fw={600} size="sm" style={{ whiteSpace: 'nowrap' }}>
            Tour {state.turn}
          </Text>
          <Popover position="bottom" withinPortal shadow="md">
            <Popover.Target>
              <Button variant="default" size="xs">
                {counted.length > 0
                  ? counted.map(({ kind, label }) => `${label} ${state.playerCounters[kind]}`).join(' · ')
                  : 'Compteurs'}
              </Button>
            </Popover.Target>
            <Popover.Dropdown>
              <Stack gap="xs">
                {playerCounters.map(({ kind, label }) => (
                  <Group key={kind} justify="space-between" gap="lg" wrap="nowrap">
                    <Text size="sm">{label}</Text>
                    <Counter
                      label={label}
                      size="sm"
                      value={state.playerCounters[kind]}
                      onChange={(delta) => act({ type: 'setPlayerCounter', kind, delta })}
                    />
                  </Group>
                ))}
              </Stack>
            </Popover.Dropdown>
          </Popover>
          <Group gap={6} wrap="nowrap">
            <ActionIcon
              variant="default"
              aria-label="Réduire les cartes"
              title="Réduire les cartes"
              disabled={!canZoomOut}
              onClick={zoomOut}
            >
              −
            </ActionIcon>
            <Text size="sm" ta="center" miw={84} style={{ whiteSpace: 'nowrap' }}>
              Zoom {Math.round(scale * 100)} %
            </Text>
            <ActionIcon
              variant="default"
              aria-label="Agrandir les cartes"
              title="Agrandir les cartes"
              disabled={!canZoomIn}
              onClick={zoomIn}
            >
              +
            </ActionIcon>
          </Group>
          <ActionIcon
            variant="default"
            size="lg"
            aria-label="Annuler"
            title="Annuler (Ctrl+Z)"
            disabled={!canUndo}
            onClick={undo}
          >
            ↶
          </ActionIcon>
          {compact ? (
            <Menu position="bottom-end" width={230} withinPortal>
              <Menu.Target>
                <Button size="xs">Actions</Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item onClick={() => act({ type: 'nextTurn' })}>Tour suivant</Menu.Item>
                <Menu.Item onClick={() => act({ type: 'draw', count: 1 })}>Piocher</Menu.Item>
                <Menu.Item onClick={() => act({ type: 'untapAll' })}>Tout dégager</Menu.Item>
                <Menu.Divider />
                <Menu.Item onClick={() => act({ type: 'mulligan' })}>Mulligan</Menu.Item>
                <Menu.Item onClick={() => act({ type: 'shuffle' })}>Mélanger</Menu.Item>
                <Menu.Item onClick={() => dialogs.viewZone('library')}>Voir la bibliothèque</Menu.Item>
                <Menu.Item onClick={dialogs.tokens}>Jeton</Menu.Item>
                <Menu.Divider />
                <Menu.Item onClick={() => act({ type: 'restart' })}>Recommencer</Menu.Item>
              </Menu.Dropdown>
            </Menu>
          ) : (
            <Popover position="bottom-end" withinPortal shadow="md" width={280}>
              <Popover.Target>
                <ActionIcon variant="default" size="lg" aria-label="Aide">
                  ?
                </ActionIcon>
              </Popover.Target>
              <Popover.Dropdown>
                <Stack gap={6}>
                  {shortcuts.map(([key, label]) => (
                    <Group key={key} justify="space-between">
                      <Text size="sm">{label}</Text>
                      <Kbd size="xs">{key}</Kbd>
                    </Group>
                  ))}
                  <Text size="xs" c="dimmed" mt={4}>
                    Double-clique une carte de ta main pour la jouer, une carte en jeu pour l'engager. Clic droit pour
                    les autres actions, glisser-déposer pour la déplacer.
                  </Text>
                </Stack>
              </Popover.Dropdown>
            </Popover>
          )}
        </Group>
      </Group>
    </Paper>
  );
}

function ActionsColumn({ dialogs }: { dialogs: Dialogs }) {
  const { state, act } = useTable();
  return (
    <Stack w={180} gap="xs" style={{ flexShrink: 0 }}>
      <Button variant="default" onClick={() => act({ type: 'restart' })}>
        Recommencer
      </Button>
      <Button variant="default" onClick={() => act({ type: 'mulligan' })}>
        Mulligan{state.mulligans > 0 ? ` (${state.mulligans})` : ''}
      </Button>
      <Button variant="default" onClick={() => act({ type: 'shuffle' })}>
        Mélanger
      </Button>
      <Button variant="default" onClick={() => act({ type: 'untapAll' })}>
        Tout dégager
      </Button>
      <Button variant="default" onClick={() => dialogs.viewZone('library')}>
        Voir la bibliothèque
      </Button>
      <Button variant="default" onClick={dialogs.tokens}>
        Jeton
      </Button>
      <Button variant="default" onClick={() => act({ type: 'draw', count: 1 })}>
        Piocher
      </Button>
      <Button color="lune" mt="auto" size="md" onClick={() => act({ type: 'nextTurn' })}>
        Tour suivant
      </Button>
    </Stack>
  );
}

function BottomRow({ dialogs }: { dialogs: Dialogs }) {
  const { state } = useTable();
  const hasCommander = Object.values(state.cards).some((card) => card.commander);
  return (
    <Group
      align="flex-end"
      gap="sm"
      px="sm"
      pb="sm"
      wrap="wrap"
      style={{ flexShrink: 0, borderTop: '1px solid var(--mantine-color-default-border)' }}
    >
      <Hand />
      <Group gap="sm" wrap="nowrap" align="flex-end" pt="sm" style={{ overflowX: 'auto', maxWidth: '100%' }}>
        <LibraryPile dialogs={dialogs} />
        <OpenPile
          zone="graveyard"
          label="Cimetière"
          tone="prune"
          tilt={2}
          onOpen={() => dialogs.viewZone('graveyard')}
        />
        <OpenPile zone="exile" label="Exil" tone="ocelle" tilt={-1} onOpen={() => dialogs.viewZone('exile')} />
        {hasCommander && <CommandPile />}
      </Group>
    </Group>
  );
}

function Hand() {
  const { state, act, cardWidth, scale } = useTable();
  const target = useDropTarget('hand', {
    accepts: (item) => item.from !== 'hand',
    onDrop: (item) => act({ type: 'move', id: item.id, to: 'hand' }),
  });
  const ids = state.zones.hand;
  const bottoming = state.pendingBottom > 0;
  const { ref, width } = useElementSize();
  const fitted = ids.length > 1 && width > 0 ? (width - cardWidth) / (ids.length - 1) : cardWidth + HAND_GAP;
  const step = Math.max(MIN_HAND_STEP * scale, Math.min(cardWidth + HAND_GAP, fitted));

  return (
    <Stack gap={4} pt="sm" style={{ flex: 1, minWidth: 'min(100%, 320px)' }}>
      <Group gap="xs" justify="space-between">
        <Text size="sm" fw={600}>
          Main ({ids.length})
        </Text>
        {bottoming && (
          <Text size="sm" c="prune" fw={600}>
            Mulligan : clique {state.pendingBottom > 1 ? `${state.pendingBottom} cartes` : 'une carte'} à mettre sous ta
            bibliothèque.
          </Text>
        )}
      </Group>
      <Box
        {...target.targetProps}
        className="tamiyo-playtest-pile"
        data-active={target.active || undefined}
        data-over={target.over || undefined}
        p={6}
        mih={cardWidth * 1.4 + 16}
        style={{ overflowX: 'auto', overflowY: 'hidden', borderStyle: target.active ? undefined : 'solid' }}
      >
        <Group ref={ref} gap={0} wrap="nowrap">
          {ids.map((id, index) => (
            <Box
              key={id}
              className="tamiyo-playtest-hand-card"
              ml={index === 0 ? 0 : step - cardWidth}
              style={{ flexShrink: 0 }}
            >
              <DraggableCard item={{ id, from: 'hand' }}>
                <PlaytestCard
                  card={state.cards[id]}
                  width={cardWidth}
                  onActivate={bottoming ? undefined : () => act({ type: 'move', id, to: 'battlefield' })}
                  onTap={bottoming ? () => act({ type: 'bottomFromHand', id }) : undefined}
                />
              </DraggableCard>
            </Box>
          ))}
        </Group>
      </Box>
    </Stack>
  );
}

function PileFrame({
  zone,
  label,
  tone,
  tilt,
  count,
  children,
}: {
  zone: Zone;
  label: string;
  tone: StickerTone;
  tilt: number;
  count: number;
  children: ReactNode;
}) {
  const { act } = useTable();
  const target = useDropTarget(zone, {
    accepts: (item) => item.from !== zone,
    onDrop: (item) => act({ type: 'move', id: item.id, to: zone }),
  });
  return (
    <Stack gap={4} align="center">
      <Sticker tone={tone} size="xs" tilt={tilt}>
        {label} · {count}
      </Sticker>
      <Box
        {...target.targetProps}
        className="tamiyo-playtest-pile"
        data-active={target.active || undefined}
        data-over={target.over || undefined}
        p={4}
      >
        {children}
      </Box>
    </Stack>
  );
}

function EmptyPile({ label }: { label: string }) {
  const { cardWidth } = useTable();
  return (
    <Box
      w={cardWidth}
      h={Math.round((cardWidth * 680) / 488)}
      display="flex"
      style={{ alignItems: 'center', justifyContent: 'center' }}
    >
      <Text className="tamiyo-hand" size="sm" c="dimmed" ta="center" style={{ transform: 'rotate(-4deg)' }}>
        {label}
      </Text>
    </Box>
  );
}

function LibraryPile({ dialogs }: { dialogs: Dialogs }) {
  const { state, act, cardWidth } = useTable();
  const top = state.zones.library[0];
  return (
    <PileFrame zone="library" label="Bibliothèque" tone="lune" tilt={-2} count={state.zones.library.length}>
      {top ? (
        <Menu position="top" withinPortal shadow="md" width={230}>
          <Menu.Target>
            <UnstyledButton aria-label="Actions sur la bibliothèque">
              <DraggableCard item={{ id: top, from: 'library' }}>
                <CardBack width={cardWidth} />
              </DraggableCard>
            </UnstyledButton>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item onClick={() => act({ type: 'draw', count: 1 })}>Piocher</Menu.Item>
            <Menu.Item onClick={dialogs.drawMany}>Piocher plusieurs cartes…</Menu.Item>
            <Menu.Item onClick={dialogs.scry}>Regarder le dessus…</Menu.Item>
            <Menu.Item onClick={dialogs.mill}>Meuler…</Menu.Item>
            <Menu.Item onClick={() => dialogs.viewZone('library')}>Chercher une carte</Menu.Item>
            <Menu.Item onClick={() => act({ type: 'shuffle' })}>Mélanger</Menu.Item>
          </Menu.Dropdown>
        </Menu>
      ) : (
        <EmptyPile label="plus rien à piocher" />
      )}
    </PileFrame>
  );
}

function OpenPile({
  zone,
  label,
  tone,
  tilt,
  onOpen,
}: {
  zone: 'graveyard' | 'exile';
  label: string;
  tone: StickerTone;
  tilt: number;
  onOpen: () => void;
}) {
  const { state, cardWidth } = useTable();
  const top = state.zones[zone][0];
  return (
    <PileFrame zone={zone} label={label} tone={tone} tilt={tilt} count={state.zones[zone].length}>
      {top ? (
        <DraggableCard item={{ id: top, from: zone }}>
          <PlaytestCard card={state.cards[top]} width={cardWidth} onTap={onOpen} />
        </DraggableCard>
      ) : (
        <EmptyPile label="vide" />
      )}
    </PileFrame>
  );
}

function CommandPile() {
  const { state, act, cardWidth } = useTable();
  const ids = state.zones.command;
  const taxes = Object.entries(state.commanderTax).filter(([, tax]) => tax > 0);
  return (
    <PileFrame zone="command" label="Commandement" tone="paper" tilt={1} count={ids.length}>
      <Stack gap={4} align="center">
        {ids.length > 0 ? (
          <Group gap={4} wrap="nowrap">
            {ids.map((id) => (
              <DraggableCard key={id} item={{ id, from: 'command' }}>
                <PlaytestCard
                  card={state.cards[id]}
                  width={cardWidth}
                  onActivate={() => act({ type: 'move', id, to: 'battlefield' })}
                />
              </DraggableCard>
            ))}
          </Group>
        ) : (
          <EmptyPile label="en jeu" />
        )}
        {taxes.map(([id, tax]) => (
          <Sticker key={id} tone="ocelle" size="xs" title={state.cards[id]?.name}>
            Taxe +{tax}
          </Sticker>
        ))}
      </Stack>
    </PileFrame>
  );
}
