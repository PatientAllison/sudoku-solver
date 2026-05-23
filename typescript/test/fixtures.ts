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

// prettier-ignore
export const boardEligibleForNakedSingle = [
  [0, 2, 3,  0, 0, 0,  0, 0, 0],
  [4, 5, 6,  0, 0, 0,  0, 0, 9],
  [7, 8, 9,  0, 0, 0,  0, 0, 0],

  [0, 0, 0,  0, 0, 0,  0, 0, 0],
  [0, 0, 0,  0, 0, 0,  0, 0, 0],
  [0, 0, 0,  0, 0, 0,  0, 0, 0],

  [0, 0, 0,  0, 0, 0,  0, 0, 0],
  [0, 0, 0,  0, 0, 0,  0, 0, 0],
  [0, 0, 0,  0, 0, 0,  0, 0, 0],
];

// prettier-ignore
export const boardNotEligibleForNakedSingle = [
  [1, 2, 3,  0, 0, 0,  0, 0, 0],
  [4, 5, 6,  0, 0, 0,  0, 0, 9],
  [7, 8, 9,  0, 0, 0,  0, 0, 0],

  [0, 0, 0,  0, 0, 0,  0, 0, 0],
  [0, 0, 0,  0, 0, 0,  0, 0, 0],
  [0, 0, 0,  0, 0, 0,  0, 0, 0],

  [0, 0, 0,  0, 0, 0,  0, 0, 0],
  [0, 0, 0,  0, 0, 0,  0, 0, 0],
  [0, 0, 0,  0, 0, 0,  0, 0, 0],
];

// prettier-ignore
export const fourByFourBoard = [
  [4, 0,  1, 0],
  [0, 0,  0, 0],

  [0, 0,  0, 0],
  [0, 2,  0, 4],
];

// prettier-ignore
export const solvedFourByFourBoard = [
  [4, 3,  1, 2],
  [2, 1,  4, 3],

  [3, 4,  2, 1],
  [1, 2,  3, 4],
];

// prettier-ignore
export const sixteenBySixteenBoard = [
  [ 0,  0, 15,  0,   0,  0,  8,  0,   6,  0,  0,  0,   2, 10,  0,  0],

  [ 0,  4,  8,  3,   0,  6, 12,  0,   9,  7,  0, 14,   0,  0,  0,  0],

  [ 5,  0,  0,  0,   0, 15,  0, 14,  12,  0,  0,  1,   0,  0,  7,  0],

  [11,  0,  1,  9,   0,  7,  0,  0,   0,  3,  4,  0,   0,  0,  0,  0],


  [ 0,  0,  0,  0,   0,  0,  0,  0,   0,  1,  0, 11,   4,  8,  0,  0],

  [ 0, 14,  0,  0,   0,  0, 15,  0,   0,  0,  8,  0,   0,  9, 10,  3],

  [ 0,  0,  0,  2,   0,  0,  0,  7,  16,  0,  5,  0,   0,  1,  6,  0],

  [16, 12,  0,  0,   0, 11,  6,  0,   0,  0,  0,  4,   0,  0,  5,  0],


  [ 0,  1,  0,  0,  14,  2,  0,  0,   0,  0,  6,  0,   0,  0,  0,  4],

  [ 0,  0,  4,  0,   0,  9,  0, 12,   5,  0,  0, 16,   0,  0,  0,  0],

  [ 9,  6, 12, 10,   3,  5,  0,  0,   1,  0, 11,  0,  16, 15,  0, 14],

  [14,  0,  3,  0,  15,  0,  0,  0,   0,  0, 10,  8,  12, 13,  9,  0],


  [ 0,  0, 16,  0,   0,  0,  0,  3,  10,  0,  0,  0,   0, 14,  0,  0],

  [ 0, 15,  0,  0,   0,  0,  9,  5,   0,  4, 14,  0,  13,  0,  0, 16],

  [ 0,  0,  7, 12,   0, 14,  0,  0,   0,  0, 13,  0,  11,  0,  4,  1],

  [ 4,  5,  0,  0,   0, 13,  0,  0,   0,  0,  0,  0,   0,  7,  0,  0],
];

// prettier-ignore
export const solvedSixteenBySixteenBoard = [
  [12,  7, 15, 14,   1,  3,  8,  4,   6, 11, 16,  5,   2, 10, 13,  9],

  [ 2,  4,  8,  3,  10,  6, 12, 13,   9,  7, 15, 14,   1, 16, 11,  5],

  [ 5, 16,  6, 13,   9, 15, 11, 14,  12, 10,  2,  1,   3,  4,  7,  8],

  [11, 10,  1,  9,  16,  7,  5,  2,   8,  3,  4, 13,   6, 12, 14, 15],


  [ 6, 13,  5, 15,   2, 10,  3,  9,  14,  1,  7, 11,   4,  8, 16, 12],

  [ 1, 14, 11,  4,   5, 12, 15, 16,  13,  6,  8,  2,   7,  9, 10,  3],

  [ 8,  3,  9,  2,  13,  4, 14,  7,  16, 12,  5, 10,  15,  1,  6, 11],

  [16, 12, 10,  7,   8, 11,  6,  1,   3, 15,  9,  4,  14,  2,  5, 13],


  [ 7,  1, 13, 16,  14,  2, 10, 11,  15,  9,  6, 12,   5,  3,  8,  4],

  [15,  2,  4,  8,   7,  9, 13, 12,   5, 14,  3, 16,  10, 11,  1,  6],

  [ 9,  6, 12, 10,   3,  5,  4,  8,   1, 13, 11,  7,  16, 15,  2, 14],

  [14, 11,  3,  5,  15, 16,  1,  6,   4,  2, 10,  8,  12, 13,  9,  7],


  [13,  8, 16, 11,   4,  1,  7,  3,  10,  5, 12,  6,   9, 14, 15,  2],

  [10, 15,  2,  1,  11,  8,  9,  5,   7,  4, 14,  3,  13,  6, 12, 16],

  [ 3,  9,  7, 12,   6, 14, 16, 10,   2,  8, 13, 15,  11,  5,  4,  1],

  [ 4,  5, 14,  6,  12, 13,  2, 15,  11, 16,  1,  9,   8,  7,  3, 10],
];

const duplicateRow = (row: number[]) => {
  const board: number[][] = [];
  for (let i = 0; i < row.length; i++) {
    board.push([...row]);
  }
  return board;
};

// prettier-ignore
const empty9x9Row = [0, 0, 0,  0, 0, 0,  0, 0, 0];
export const empty9x9Board = duplicateRow(empty9x9Row);
// prettier-ignore
const empty4x4Row = [0, 0,  0, 0];
export const empty4x4Board = duplicateRow(empty4x4Row);
// prettier-ignore
const empty16x16Row = [0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,];
export const empty16x16Board = duplicateRow(empty16x16Row);

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
  return Math.floor(Math.random() * (roundedMax - roundedMin));
};

export const dedent = (str: string) => {
  return str.replace(/\n\s+/g, '\n').trim();
};
