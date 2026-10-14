import { useCallback, useReducer, useRef } from 'react';

import { CARD_WIDTH, type DeckEntry, type GameAction, type GameState, gameReducer, newGame } from './engine';

const HISTORY_LIMIT = 50;

interface History {
  past: GameState[];
  present: GameState;
}

type Step = { type: 'act'; action: GameAction; entropy: Uint32Array; surfaceWidth: number } | { type: 'undo' };

function entropyFor(count: number) {
  return crypto.getRandomValues(new Uint32Array(Math.max(1, count)));
}

function historyReducer(history: History, step: Step): History {
  if (step.type === 'undo') {
    const previous = history.past[history.past.length - 1];
    return previous ? { past: history.past.slice(0, -1), present: previous } : history;
  }
  const next = gameReducer(history.present, step.action, step.entropy, step.surfaceWidth);
  if (next === history.present) {
    return history;
  }
  return { past: [...history.past, history.present].slice(-HISTORY_LIMIT), present: next };
}

export function usePlaytest(deck: DeckEntry[], commanderFormat: boolean, scale: number) {
  const [history, dispatch] = useReducer(historyReducer, null, () => {
    const count = deck.reduce((total, entry) => total + entry.quantity, 0);
    return { past: [], present: newGame(deck, commanderFormat, entropyFor(count)) };
  });
  const surfaceRef = useRef<HTMLDivElement>(null);
  const cardCount = Object.keys(history.present.cards).length;

  const act = useCallback(
    (action: GameAction) =>
      dispatch({
        type: 'act',
        action,
        entropy: entropyFor(cardCount),
        surfaceWidth: (surfaceRef.current?.clientWidth ?? 0) / scale,
      }),
    [cardCount, scale],
  );
  const undo = useCallback(() => dispatch({ type: 'undo' }), []);

  return {
    state: history.present,
    act,
    undo,
    canUndo: history.past.length > 0,
    surfaceRef,
    cardWidth: Math.round(CARD_WIDTH * scale),
  };
}

export type Playtest = ReturnType<typeof usePlaytest>;
