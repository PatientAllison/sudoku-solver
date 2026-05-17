import { Cell } from '../src/primitives/cell';
import { Coordinates } from '../src/types';

export const validRow: Coordinates[] = [
  { col: 0, row: 0 },
  { col: 1, row: 0 },
  { col: 2, row: 0 },
  { col: 3, row: 0 },
  { col: 4, row: 0 },
  { col: 5, row: 0 },
  { col: 6, row: 0 },
  { col: 7, row: 0 },
  { col: 8, row: 0 },
];

export const validColumn: Coordinates[] = [
  { col: 0, row: 0 },
  { col: 0, row: 1 },
  { col: 0, row: 2 },
  { col: 0, row: 3 },
  { col: 0, row: 4 },
  { col: 0, row: 5 },
  { col: 0, row: 6 },
  { col: 0, row: 7 },
  { col: 0, row: 8 },
];

export const validBox: Coordinates[] = [
  { col: 0, row: 0 },
  { col: 1, row: 0 },
  { col: 2, row: 0 },
  { col: 0, row: 1 },
  { col: 1, row: 1 },
  { col: 2, row: 1 },
  { col: 0, row: 2 },
  { col: 1, row: 2 },
  { col: 2, row: 2 },
];

// random easy puzzle pulled from https://www.websudoku.com/
export const validBoard = [
  [0, 5, 0, 0, 6, 9, 0, 0, 4],
  [7, 2, 0, 5, 0, 1, 0, 0, 0],
  [1, 0, 4, 0, 7, 0, 0, 9, 0],
  [0, 4, 3, 0, 0, 0, 1, 0, 0],
  [6, 9, 0, 0, 3, 0, 0, 4, 7],
  [0, 0, 1, 0, 0, 0, 6, 3, 0],
  [0, 3, 0, 0, 1, 0, 2, 0, 8],
  [0, 0, 0, 8, 0, 2, 0, 6, 3],
  [2, 0, 0, 6, 9, 0, 0, 7, 0],
];

export const wideBoard = validBoard.slice(1);
export const tallBoard = validBoard.map((row) => row.slice(1));
// 4x9 board: both sides are square individually, but sides don't match
export const nonSquareBoard = wideBoard.map((row) => row.slice(5));

export const buildCells = (board: number[][]) => {
  const cells: Cell[][] = [];
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row]!.length; col++) {
      const coordinates: Coordinates = {
        col,
        row,
      };

      if (cells[row] === undefined) {
        cells[row] = [];
      }

      cells[row][col] = new Cell({
        coordinates,
        unitSize: board.length,
        givenValue: board[row][col] !== 0 ? board[row][col] : undefined,
        skipValidations: true,
      });
    }
  }
  return cells;
};
