import { Board } from '../src/primitives/board';
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

// prettier ignore all of these boards to keep box spacing
// random easy puzzle pulled from https://www.websudoku.com/
// prettier-ignore
export const validBoard = [
  [0, 5, 0,  0, 6, 9,  0, 0, 4],
  [7, 2, 0,  5, 0, 1,  0, 0, 0],
  [1, 0, 4,  0, 7, 0,  0, 9, 0],

  [0, 4, 3,  0, 0, 0,  1, 0, 0],
  [6, 9, 0,  0, 3, 0,  0, 4, 7],
  [0, 0, 1,  0, 0, 0,  6, 3, 0],

  [0, 3, 0,  0, 1, 0,  2, 0, 8],
  [0, 0, 0,  8, 0, 2,  0, 6, 3],
  [2, 0, 0,  6, 9, 0,  0, 7, 0],
];

//0,1 and 0,7 are both 5
// prettier-ignore
export const rowConflict = [
  [0, 5, 0,  0, 6, 9,  0, 5, 4],
  [7, 2, 0,  5, 0, 1,  0, 0, 0],
  [1, 0, 4,  0, 7, 0,  0, 9, 0],

  [0, 4, 3,  0, 0, 0,  1, 0, 0],
  [6, 9, 0,  0, 3, 0,  0, 4, 7],
  [0, 0, 1,  0, 0, 0,  6, 3, 0],

  [0, 3, 0,  0, 1, 0,  2, 0, 8],
  [0, 0, 0,  8, 0, 2,  0, 6, 3],
  [2, 0, 0,  6, 9, 0,  0, 7, 0],
];

//0,0 and 8,0 are both 2
// prettier-ignore
export const columnConflict = [
  [2, 5, 0,  0, 6, 9,  0, 0, 4],
  [7, 2, 0,  5, 0, 1,  0, 0, 0],
  [1, 0, 4,  0, 7, 0,  0, 9, 0],

  [0, 4, 3,  0, 0, 0,  1, 0, 0],
  [6, 9, 0,  0, 3, 0,  0, 4, 7],
  [0, 0, 1,  0, 0, 0,  6, 3, 0],

  [0, 3, 0,  0, 1, 0,  2, 0, 8],
  [0, 0, 0,  8, 0, 2,  0, 6, 3],
  [2, 0, 0,  6, 9, 0,  0, 7, 0],
];

//1,3 and 2,5 are both 5
// prettier-ignore
export const boxConflict = [
  [0, 5, 0,  0, 6, 9,  0, 0, 4],
  [7, 2, 0,  5, 0, 1,  0, 0, 0],
  [1, 0, 4,  0, 7, 5,  0, 9, 0],

  [0, 4, 3,  0, 0, 0,  1, 0, 0],
  [6, 9, 0,  0, 3, 0,  0, 4, 7],
  [0, 0, 1,  0, 0, 0,  6, 3, 0],

  [0, 3, 0,  0, 1, 0,  2, 0, 8],
  [0, 0, 0,  8, 0, 2,  0, 6, 3],
  [2, 0, 0,  6, 9, 0,  0, 7, 0],
];

// prettier-ignore
export const fullButInvalidBoard = [
  [1, 1, 1,  1, 1, 1,  1, 1, 1],
  [1, 1, 1,  1, 1, 1,  1, 1, 1],
  [1, 1, 1,  1, 1, 1,  1, 1, 1],

  [1, 1, 1,  1, 1, 1,  1, 1, 1],
  [1, 1, 1,  1, 1, 1,  1, 1, 1],
  [1, 1, 1,  1, 1, 1,  1, 1, 1],

  [1, 1, 1,  1, 1, 1,  1, 1, 1],
  [1, 1, 1,  1, 1, 1,  1, 1, 1],
  [1, 1, 1,  1, 1, 1,  1, 1, 1],
];

// prettier-ignore
export const solvedBoard = [
  [3, 5, 8,  2, 6, 9,  7, 1, 4],
  [7, 2, 9,  5, 4, 1,  3, 8, 6],
  [1, 6, 4,  3, 7, 8,  5, 9, 2],

  [5, 4, 3,  7, 8, 6,  1, 2, 9],
  [6, 9, 2,  1, 3, 5,  8, 4, 7],
  [8, 7, 1,  9, 2, 4,  6, 3, 5],

  [9, 3, 6,  4, 1, 7,  2, 5, 8],
  [4, 1, 7,  8, 5, 2,  9, 6, 3],
  [2, 8, 5,  6, 9, 3,  4, 7, 1],
];

// Valid structure, but unsolvable — the constraints are contradictory
// prettier-ignore
export const unsolvableBoard = [
  [1, 2, 3,  4, 5, 6,  7, 8, 0],  // only 9 can go here
  [0, 0, 0,  0, 0, 0,  0, 0, 9],  // but 9 is already in this column
  [0, 0, 0,  0, 0, 0,  0, 0, 0],

  [0, 0, 0,  0, 0, 0,  0, 0, 0],
  [0, 0, 0,  0, 0, 0,  0, 0, 0],
  [0, 0, 0,  0, 0, 0,  0, 0, 0],

  [0, 0, 0,  0, 0, 0,  0, 0, 0],
  [0, 0, 0,  0, 0, 0,  0, 0, 0],
  [0, 0, 0,  0, 0, 0,  0, 0, 0],
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

export const buildBoard = (boardCells: number[][]) => {
  return new Board({ cells: buildCells(boardCells) });
};

export const getRandomIndex = (max: number, min = 0) => {
  const roundedMin = Math.ceil(min);
  const roundedMax = Math.floor(max);
  return Math.floor(Math.random() * (roundedMax - roundedMin + 1));
};
