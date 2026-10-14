export type Zone = 'library' | 'hand' | 'battlefield' | 'graveyard' | 'exile' | 'command';

export type PlayerCounter = 'poison' | 'energy' | 'experience';

export type Position = 'top' | 'bottom' | number;

export interface DeckEntry {
  scryfallId: string;
  name: string;
  quantity: number;
  commander: boolean;
}

export interface CardInstance {
  id: string;
  scryfallId: string;
  name: string;
  token: boolean;
  copy: boolean;
  commander: boolean;
  tapped: boolean;
  faceDown: boolean;
  flipped: boolean;
  counters: Record<string, number>;
  x: number;
  y: number;
}

export interface GameState {
  deck: DeckEntry[];
  startingLife: number;
  freeMulligan: boolean;
  cards: Record<string, CardInstance>;
  zones: Record<Zone, string[]>;
  turn: number;
  life: number;
  playerCounters: Record<PlayerCounter, number>;
  commanderTax: Record<string, number>;
  mulligans: number;
  pendingBottom: number;
  nextId: number;
}

export interface ScryResult {
  top: string[];
  bottom: string[];
  graveyard: string[];
}

export type GameAction =
  | { type: 'restart' }
  | { type: 'shuffle' }
  | { type: 'draw'; count: number }
  | { type: 'mulligan' }
  | { type: 'bottomFromHand'; id: string }
  | { type: 'nextTurn' }
  | { type: 'move'; id: string; to: Zone; position?: Position; x?: number; y?: number; faceDown?: boolean }
  | { type: 'tap'; id: string }
  | { type: 'untapAll' }
  | { type: 'flip'; id: string }
  | { type: 'faceDown'; id: string }
  | { type: 'setCounter'; id: string; kind: string; delta: number }
  | { type: 'setLife'; delta: number }
  | { type: 'setPlayerCounter'; kind: PlayerCounter; delta: number }
  | { type: 'mill'; count: number }
  | { type: 'scry'; result: ScryResult }
  | { type: 'searchLibrary'; id: string; to: Zone }
  | { type: 'createToken'; scryfallId: string; name: string; count: number }
  | { type: 'clone'; id: string };

export const ZONES: Zone[] = ['library', 'hand', 'battlefield', 'graveyard', 'exile', 'command'];

export const OPENING_HAND = 7;
export const CARD_WIDTH = 137;
export const CARD_HEIGHT = 191;
const STEP_X = CARD_HEIGHT + 12;
const STEP_Y = CARD_HEIGHT + 16;
const MARGIN = 16;
const CLONE_OFFSET = 32;

function emptyZones(): Record<Zone, string[]> {
  return { library: [], hand: [], battlefield: [], graveyard: [], exile: [], command: [] };
}

export function shuffled(ids: string[], entropy: Uint32Array): string[] {
  const result = [...ids];
  for (let i = result.length - 1; i > 0; i--) {
    const j = entropy[i % entropy.length] % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function zoneOf(state: GameState, id: string): Zone | null {
  return ZONES.find((zone) => state.zones[zone].includes(id)) ?? null;
}

export function newGame(deck: DeckEntry[], commanderFormat: boolean, entropy: Uint32Array): GameState {
  const cards: Record<string, CardInstance> = {};
  const zones = emptyZones();
  let nextId = 1;
  for (const entry of deck) {
    for (let copy = 0; copy < entry.quantity; copy++) {
      const id = `c${nextId++}`;
      cards[id] = {
        id,
        scryfallId: entry.scryfallId,
        name: entry.name,
        token: false,
        copy: false,
        commander: entry.commander,
        tapped: false,
        faceDown: false,
        flipped: false,
        counters: {},
        x: 0,
        y: 0,
      };
      zones[entry.commander ? 'command' : 'library'].push(id);
    }
  }
  zones.library = shuffled(zones.library, entropy);
  zones.hand = zones.library.splice(0, OPENING_HAND);
  const startingLife = commanderFormat ? 40 : 20;
  return {
    deck,
    startingLife,
    freeMulligan: commanderFormat,
    cards,
    zones,
    turn: 1,
    life: startingLife,
    playerCounters: { poison: 0, energy: 0, experience: 0 },
    commanderTax: {},
    mulligans: 0,
    pendingBottom: 0,
    nextId,
  };
}

function overlaps(state: GameState, x: number, y: number) {
  return state.zones.battlefield.some((id) => {
    const card = state.cards[id];
    return Math.abs(card.x - x) < STEP_X / 2 && Math.abs(card.y - y) < STEP_Y / 2;
  });
}

export function freeSpot(state: GameState, surfaceWidth: number) {
  const columns = Math.max(1, Math.floor((surfaceWidth - MARGIN) / STEP_X));
  for (let index = 0; ; index++) {
    const x = MARGIN + (index % columns) * STEP_X;
    const y = MARGIN + Math.floor(index / columns) * STEP_Y;
    if (!overlaps(state, x, y)) {
      return { x, y };
    }
  }
}

function insertAt(ids: string[], id: string, position: Position): string[] {
  if (position === 'top') {
    return [id, ...ids];
  }
  if (position === 'bottom') {
    return [...ids, id];
  }
  const index = Math.max(0, Math.min(position, ids.length));
  return [...ids.slice(0, index), id, ...ids.slice(index)];
}

function resetCard(card: CardInstance): CardInstance {
  return { ...card, tapped: false, faceDown: false, flipped: false, counters: {} };
}

function moveCard(
  state: GameState,
  id: string,
  to: Zone,
  position: Position = to === 'hand' || to === 'battlefield' ? 'bottom' : 'top',
  point?: { x: number; y: number },
  faceDown = false,
): GameState {
  const from = zoneOf(state, id);
  const card = state.cards[id];
  if (!from || !card) {
    return state;
  }
  const zones = { ...state.zones, [from]: state.zones[from].filter((other) => other !== id) };
  const cards = { ...state.cards };

  if (card.token && to !== 'battlefield') {
    delete cards[id];
    return { ...state, cards, zones };
  }

  let commanderTax = state.commanderTax;
  if (card.commander && from === 'command' && to !== 'command') {
    commanderTax = { ...commanderTax, [id]: (commanderTax[id] ?? 0) + 2 };
  }

  let moved = from === 'battlefield' && to !== 'battlefield' ? resetCard(card) : card;
  if (to === 'battlefield') {
    const spot = point ?? { x: card.x, y: card.y };
    moved = { ...moved, x: Math.max(0, Math.round(spot.x)), y: Math.max(0, Math.round(spot.y)) };
    if (faceDown) {
      moved = { ...moved, faceDown: true };
    }
  }
  cards[id] = moved;
  zones[to] = insertAt(zones[to], id, position);
  return { ...state, cards, zones, commanderTax };
}

function draw(state: GameState, count: number): GameState {
  const drawn = state.zones.library.slice(0, Math.max(0, count));
  if (drawn.length === 0) {
    return state;
  }
  return {
    ...state,
    zones: {
      ...state.zones,
      library: state.zones.library.slice(drawn.length),
      hand: [...state.zones.hand, ...drawn],
    },
  };
}

function updateCard(state: GameState, id: string, change: (card: CardInstance) => CardInstance): GameState {
  const card = state.cards[id];
  return card ? { ...state, cards: { ...state.cards, [id]: change(card) } } : state;
}

function untapAll(state: GameState): GameState {
  const cards = { ...state.cards };
  let changed = false;
  for (const id of state.zones.battlefield) {
    if (cards[id].tapped) {
      cards[id] = { ...cards[id], tapped: false };
      changed = true;
    }
  }
  return changed ? { ...state, cards } : state;
}

function addToken(
  state: GameState,
  source: Pick<CardInstance, 'scryfallId' | 'name'>,
  spot: { x: number; y: number },
  copy = false,
) {
  const id = `c${state.nextId}`;
  const token: CardInstance = {
    id,
    scryfallId: source.scryfallId,
    name: source.name,
    token: true,
    copy,
    commander: false,
    tapped: false,
    faceDown: false,
    flipped: false,
    counters: {},
    x: spot.x,
    y: spot.y,
  };
  return {
    ...state,
    nextId: state.nextId + 1,
    cards: { ...state.cards, [id]: token },
    zones: { ...state.zones, battlefield: [...state.zones.battlefield, id] },
  };
}

export function gameReducer(state: GameState, action: GameAction, entropy: Uint32Array, surfaceWidth = 0): GameState {
  switch (action.type) {
    case 'restart':
      return newGame(state.deck, state.freeMulligan, entropy);
    case 'shuffle':
      return { ...state, zones: { ...state.zones, library: shuffled(state.zones.library, entropy) } };
    case 'draw':
      return draw(state, action.count);
    case 'mulligan': {
      const mulligans = state.mulligans + 1;
      const library = shuffled([...state.zones.library, ...state.zones.hand], entropy);
      const reshuffled = { ...state, zones: { ...state.zones, library, hand: [] }, mulligans };
      const owed = mulligans - (state.freeMulligan ? 1 : 0);
      return { ...draw(reshuffled, OPENING_HAND), pendingBottom: Math.max(0, Math.min(owed, OPENING_HAND)) };
    }
    case 'bottomFromHand': {
      if (state.pendingBottom === 0 || !state.zones.hand.includes(action.id)) {
        return state;
      }
      return { ...moveCard(state, action.id, 'library', 'bottom'), pendingBottom: state.pendingBottom - 1 };
    }
    case 'nextTurn': {
      return draw({ ...untapAll(state), turn: state.turn + 1, pendingBottom: 0 }, 1);
    }
    case 'move': {
      const point = action.x !== undefined && action.y !== undefined ? { x: action.x, y: action.y } : undefined;
      const placed =
        action.to === 'battlefield' && !point && zoneOf(state, action.id) !== 'battlefield'
          ? freeSpot(state, surfaceWidth)
          : point;
      return moveCard(state, action.id, action.to, action.position, placed, action.faceDown);
    }
    case 'tap':
      return state.zones.battlefield.includes(action.id)
        ? updateCard(state, action.id, (card) => ({ ...card, tapped: !card.tapped }))
        : state;
    case 'untapAll':
      return untapAll(state);
    case 'flip':
      return updateCard(state, action.id, (card) => ({ ...card, flipped: !card.flipped }));
    case 'faceDown':
      return updateCard(state, action.id, (card) => ({ ...card, faceDown: !card.faceDown }));
    case 'setCounter':
      return updateCard(state, action.id, (card) => {
        const value = Math.max(0, (card.counters[action.kind] ?? 0) + action.delta);
        const counters = { ...card.counters };
        if (value === 0) {
          delete counters[action.kind];
        } else {
          counters[action.kind] = value;
        }
        return { ...card, counters };
      });
    case 'setLife':
      return { ...state, life: state.life + action.delta };
    case 'setPlayerCounter': {
      const value = Math.max(0, state.playerCounters[action.kind] + action.delta);
      return { ...state, playerCounters: { ...state.playerCounters, [action.kind]: value } };
    }
    case 'mill': {
      const milled = state.zones.library.slice(0, Math.max(0, action.count));
      if (milled.length === 0) {
        return state;
      }
      return {
        ...state,
        zones: {
          ...state.zones,
          library: state.zones.library.slice(milled.length),
          graveyard: [...[...milled].reverse(), ...state.zones.graveyard],
        },
      };
    }
    case 'scry': {
      const { top, bottom, graveyard } = action.result;
      const handled = new Set([...top, ...bottom, ...graveyard]);
      const rest = state.zones.library.filter((id) => !handled.has(id));
      const inLibrary = new Set(state.zones.library);
      const keep = (ids: string[]) => ids.filter((id) => inLibrary.has(id));
      return {
        ...state,
        zones: {
          ...state.zones,
          library: [...keep(top), ...rest, ...keep(bottom)],
          graveyard: [...keep(graveyard).reverse(), ...state.zones.graveyard],
        },
      };
    }
    case 'searchLibrary': {
      if (!state.zones.library.includes(action.id)) {
        return state;
      }
      const placed = action.to === 'battlefield' ? freeSpot(state, surfaceWidth) : undefined;
      const moved = moveCard(state, action.id, action.to, undefined, placed);
      return { ...moved, zones: { ...moved.zones, library: shuffled(moved.zones.library, entropy) } };
    }
    case 'createToken': {
      let next = state;
      for (let made = 0; made < Math.max(0, action.count); made++) {
        next = addToken(next, action, freeSpot(next, surfaceWidth));
      }
      return next;
    }
    case 'clone': {
      const card = state.cards[action.id];
      if (!card || !state.zones.battlefield.includes(action.id)) {
        return state;
      }
      let offset = CLONE_OFFSET;
      const taken = (spot: number) =>
        state.zones.battlefield.some(
          (id) => state.cards[id].x === card.x + spot && state.cards[id].y === card.y + spot,
        );
      while (taken(offset)) {
        offset += CLONE_OFFSET;
      }
      return addToken(state, card, { x: card.x + offset, y: card.y + offset }, card.copy || !card.token);
    }
  }
}
