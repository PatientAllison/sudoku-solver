import { Board } from './primitives/board.js';

export interface Coordinates {
  row: number;
  col: number;
}

export enum UnitType {
  Row = 'ROW',
  Column = 'COLUMN',
  Box = 'BOX',
}

export interface BoardWithProgress {
  board: Board;
  solved?: boolean;
  progress?: boolean;
}
