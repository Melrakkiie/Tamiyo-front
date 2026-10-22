import type { Card, DeckBoard } from '../api/types';
import { withBoardHeader } from './boards';

export type DeckLinePrinting = Pick<Card, 'name' | 'set_code' | 'collector_number' | 'foil'>;

function deckLine(card: DeckLinePrinting, count: number, board: DeckBoard, tags: string[]) {
  const tagSuffix = tags
    .map((tag) => tag.replaceAll('#', '').trim())
    .filter((tag) => tag.length > 0)
    .map((tag) => ` #${tag}`)
    .join('');
  return withBoardHeader(
    `${count} ${card.name} (${card.set_code}) ${card.collector_number}${card.foil ? ' *F*' : ''}${tagSuffix}\n`,
    board,
  );
}

export function deckLineFile(card: DeckLinePrinting, count: number, board: DeckBoard, tags: string[] = []) {
  return new File([deckLine(card, count, board, tags)], 'deck.txt', { type: 'text/plain' });
}
