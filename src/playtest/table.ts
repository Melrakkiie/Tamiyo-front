import { createContext, useContext } from 'react';

import type { CardInstance } from './engine';
import type { Playtest } from './usePlaytest';
import type { PlaytestZoom } from './zoom';

export interface Table extends Playtest, PlaytestZoom {
  frontOf: (card: CardInstance) => string | undefined;
  backOf: (card: CardInstance) => string | undefined;
  imagesLoading: boolean;
  preview: (card: CardInstance | null) => void;
  openMenu: (x: number, y: number, id: string) => void;
}

export const TableContext = createContext<Table | null>(null);

export function useTable() {
  const table = useContext(TableContext);
  if (!table) {
    throw new Error('useTable needs a TableContext provider');
  }
  return table;
}
