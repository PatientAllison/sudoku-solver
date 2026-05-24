import { Board } from '../src/primitives/board';
import { Cell } from '../src/primitives/cell';
import { Coordinates } from '../src/types';
import validBoard from '../../resources/puzzleInputs/9x9/easy/0.json' with { type: 'json' };
import hardNineByNineBoard from '../../resources/puzzleInputs/9x9/hard/0.json' with { type: 'json' };
import solvedHardNineByNineBoard from '../../resources/testData/solvedBoards/hard/9x9.json' with { type: 'json' };
import evilNineByNineBoard from '../../resources/puzzleInputs/9x9/evil/0.json' with { type: 'json' };
import solvedEvilNineByNineBoard from '../../resources/testData/solvedBoards/evil/9x9.json' with { type: 'json' };
import rowConflict from '../../resources/testData/conflicts/rowConflict.json' with { type: 'json' };
import columnConflict from '../../resources/testData/conflicts/columnConflict.json' with { type: 'json' };
import boxConflict from '../../resources/testData/conflicts/boxConflict.json' with { type: 'json' };
import fullButInvalidBoard from '../../resources/testData/conflicts/invalid.json' with { type: 'json' };
import unsolvableBoard from '../../resources/testData/conflicts/unsolvable.json' with { type: 'json' };
import solvedBoard from '../../resources/testData/solvedBoards/easy/9x9.json' with { type: 'json' };
import boardEligibleForNakedSingle from '../../resources/testData/techniques/nakedSingle.json' with { type: 'json' };
import boardEligibleForHiddenSingle from '../../resources/testData/techniques/hiddenSingle.json' with { type: 'json' };
import boardNotEligibleForSingle from '../../resources/testData/techniques/noSingle.json' with { type: 'json' };
import fourByFourBoard from '../../resources/puzzleInputs/4x4/easy/0.json' with { type: 'json' };
import solvedFourByFourBoard from '../../resources/testData/solvedBoards/easy/4x4.json' with { type: 'json' };
import sixteenBySixteenBoard from '../../resources/puzzleInputs/16x16/easy/0.json' with { type: 'json' };
import solvedSixteenBySixteenBoard from '../../resources/testData/solvedBoards/easy/16x16.json' with { type: 'json' };
import hundredByHundredBoard from '../../resources/puzzleInputs/100x100/easy/0.json' with { type: 'json' };
import solvedHundredByHundredBoard from '../../resources/testData/solvedBoards/easy/100x100.json' with { type: 'json' };

export {
  validBoard,
  hardNineByNineBoard,
  solvedHardNineByNineBoard,
  evilNineByNineBoard,
  solvedEvilNineByNineBoard,
  rowConflict,
  columnConflict,
  boxConflict,
  fullButInvalidBoard,
  unsolvableBoard,
  solvedBoard,
  boardEligibleForNakedSingle,
  boardEligibleForHiddenSingle,
  boardNotEligibleForSingle,
  fourByFourBoard,
  solvedFourByFourBoard,
  sixteenBySixteenBoard,
  solvedSixteenBySixteenBoard,
  hundredByHundredBoard,
  solvedHundredByHundredBoard,
};

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
  return str.replace(/\n[ \t]+/g, '\n').trim();
};
