import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  buildCells,
  validBoard,
  wideBoard as tallBoard,
  nonSquareBoard,
  rowConflict,
  columnConflict,
  boxConflict,
  fullButInvalidBoard,
  solvedBoard,
  buildBoard,
  getRandomIndex,
  dedent,
  solvedFourByFourBoard,
  fourByFourBoard,
  sixteenBySixteenBoard,
} from '../fixtures';
import { Board } from '../../src/primitives/board';
import { Cell } from '../../src/primitives/cell';
import { solveWithBackTracking } from '../../src/solver';
import { UnitType } from '../../src/types';

const mockIsSquare = vi.hoisted(() => vi.fn());

vi.mock('../../src/utils', async () => {
  const original = await vi.importActual('../../src/utils');
  return {
    // mocking isPositive would require mocking it for every cell creation
    ...original,
    isSquarePositiveInteger: mockIsSquare,
  };
});

describe('Board', () => {
  let validCells: Cell[][];

  beforeEach(() => {
    mockIsSquare.mockReturnValue(true);
    validCells = buildCells(validBoard);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Board creation', () => {
    test('Valid board', () => {
      const board = new Board({ cells: validCells });
      expect(board.boxEdgeSize).toEqual(Math.sqrt(validCells.length));
      expect(board.unitSize).toEqual(validCells.length);
      expect(board.totalBoardSize).toEqual(
        validCells.length * validCells[0].length
      );
      expect(board.cells).toEqual(validCells);
      // Unit assertions
      expect(board.units.length).toEqual(validCells.length * 3);
      const rows = board.getRows();
      const cols = board.getColumns();
      const boxes = board.getBoxes();
      for (const filteredUnits of [rows, cols, boxes]) {
        expect(filteredUnits.length).toEqual(validCells.length);
      }
      board.units.forEach((unit) =>
        expect(unit.cellCoords.length).toEqual(validCells.length)
      );

      const cellCounts = new Map<string, number>();
      for (const unit of board.units) {
        for (const coord of unit.cellCoords) {
          const key = JSON.stringify(coord);
          cellCounts.set(key, (cellCounts.get(key) ?? 0) + 1);
        }
      }
      for (const count of cellCounts.values()) {
        expect(count).toEqual(3);
      }

      expect(cellCounts.size).toEqual(board.totalBoardSize);
    });

    test('Wide board', () => {
      const cells = buildCells(tallBoard);
      mockIsSquare.mockReturnValueOnce(false);
      expect(() => new Board({ cells })).toThrow(/Height is not a square!/);
    });

    test('Tall board', () => {
      const cells = buildCells(tallBoard);
      // Pass the height square check
      mockIsSquare.mockReturnValueOnce(true);
      // Fail the width square check
      mockIsSquare.mockReturnValueOnce(false);
      expect(() => new Board({ cells })).toThrow(/Width is not a square!/);
    });

    test('Non-square board', () => {
      const cells = buildCells(nonSquareBoard);
      expect(() => new Board({ cells })).toThrow(
        /Width and height are not the same! Board is not a square!/
      );
    });
  });

  describe('clone', () => {
    test('Clone should be identical to original after creation', () => {
      const board = new Board({ cells: validCells });
      const clone = board.clone();
      expect(clone.boxEdgeSize).toEqual(board.boxEdgeSize);
      expect(clone.unitSize).toEqual(board.unitSize);
      expect(clone.totalBoardSize).toEqual(clone.totalBoardSize);
      expect(JSON.stringify(clone.cells)).toEqual(JSON.stringify(board.cells));
      // Unit assertions
      expect(clone.units).toEqual(board.units);
      expect(clone.getRows()).toEqual(board.getRows());
      expect(clone.getColumns()).toEqual(board.getColumns());
      expect(clone.getBoxes()).toEqual(board.getBoxes());
    });

    test('clone operations do not affect original', () => {
      const board = new Board({ cells: validCells });
      const clone = board.clone();
      clone.cells[0][0].setValue(3);
      expect(board.cells[0][0].getValue()).not.toEqual(3);
    });

    test('operations on original do not affect clone', () => {
      const board = new Board({ cells: validCells });
      const clone = board.clone();
      board.cells[0][0].setValue(3);
      expect(clone.cells[0][0].getValue()).not.toEqual(3);
    });
  });

  describe('validate', () => {
    test('valid board validates successfully', () => {
      const board = new Board({ cells: validCells });
      expect(() => board.validate()).not.toThrow();
    });

    test('row conflict throws error', () => {
      const board = buildBoard(rowConflict);
      expect(() => board.validate()).toThrow(
        'Board is invalid! Violations: [ { Violated Unit: { UnitType: ROW'
      );
    });

    test('column conflict throws error', () => {
      const board = buildBoard(columnConflict);
      expect(() => board.validate()).toThrow(
        'Board is invalid! Violations: [ { Violated Unit: { UnitType: COLUMN'
      );
    });

    test('box conflict throws error', () => {
      const board = buildBoard(boxConflict);
      expect(() => board.validate()).toThrow(
        'Board is invalid! Violations: [ { Violated Unit: { UnitType: BOX'
      );
    });
  });

  describe('isFilled', () => {
    test('returns false for in-progress board', () => {
      const board = new Board({ cells: validCells });
      expect(board.isFilled()).toEqual(false);
    });

    test('returns true for full but invalid board', () => {
      const board = buildBoard(fullButInvalidBoard);
      expect(board.isFilled()).toEqual(true);
    });

    test('returns true for solved board', () => {
      const board = buildBoard(solvedBoard);
      expect(board.isFilled()).toEqual(true);
    });
  });

  describe('isSolved', () => {
    test('returns false for in-progress board', () => {
      const board = new Board({ cells: validCells });
      expect(board.isSolved()).toEqual(false);
    });

    test('returns false for full but invalid board', () => {
      const board = buildBoard(fullButInvalidBoard);
      expect(board.isSolved()).toEqual(false);
    });

    test('returns true for solved board', () => {
      const board = buildBoard(solvedBoard);
      expect(board.isSolved()).toEqual(true);
    });
  });

  describe('getCellsForUnit', () => {
    test('getCellsForUnit returns accurate cells', () => {
      const board = new Board({ cells: validCells });
      const units = board.units;
      units.forEach((unit) => {
        const cellsForUnit = board.getCellsForUnit(unit);
        const coordsForUnit = unit.cellCoords;
        for (let i = 0; i < cellsForUnit.length; i++) {
          expect(coordsForUnit[i]).toEqual(cellsForUnit[i].coordinates);
        }
      });
    });
  });

  describe('selectEmptyCell', () => {
    test('select empty cell selects an empty cell', () => {
      const cells = buildCells(validBoard);
      // This is just for coverage so the first cell is not forever the minimum cell
      cells[0][2].removeCandidate(1);
      const board = new Board({ cells });
      // Which cell we get is hard to determine because of the candidate count sorting
      // Just assert we get a cell
      expect(board.selectEmptyCell()).toBeDefined();
    });

    test('select empty cell throws if the board is filled', () => {
      const board = buildBoard(solvedBoard);
      // Which cell we get is hard to determine because of the candidate count sorting
      // Just assert we get a cell
      expect(() => board.selectEmptyCell()).toThrow(
        'Board is already filled! There are no empty cells!'
      );
    });
  });

  describe('getCellFromCoordinates', () => {
    test('returns a valid cell', () => {
      const board = new Board({ cells: validCells });
      const rowIndex = getRandomIndex(validCells.length);
      const row = validCells[rowIndex];
      const colIndex = getRandomIndex(row.length);

      const coordinates = { row: rowIndex, col: colIndex };
      const cell = board.getCellFromCoordinates(coordinates);
      expect(cell.coordinates).toEqual(coordinates);
    });

    test('throws an error with out of bounds row', () => {
      const board = new Board({ cells: validCells });
      const rowIndex = validCells.length;
      // Just use the first row since we don't want to be out of bounds in the setup
      const colIndex = getRandomIndex(validCells[0].length);

      const coordinates = { row: rowIndex, col: colIndex };
      expect(() => board.getCellFromCoordinates(coordinates)).toThrow(
        /Requested row is out of bounds for this board!/
      );
    });

    test('throws an error with out of bounds col', () => {
      const board = new Board({ cells: validCells });
      const rowIndex = getRandomIndex(validCells.length);
      const row = validCells[rowIndex];
      const colIndex = row.length;

      const coordinates = { row: rowIndex, col: colIndex };
      expect(() => board.getCellFromCoordinates(coordinates)).toThrow(
        /Requested column is out of bounds for this board!/
      );
    });
  });

  describe('getUnitsFromCoordinates', () => {
    test('3 Units contain coordinates', () => {
      const board = buildBoard(validBoard);
      const coordinates = board.cells.flat().map((cell) => cell.coordinates);
      coordinates.forEach((coordinates) => {
        const units = board.getUnitsFromCoordinates(coordinates);
        // There are exactly 3 units for each Coordinate
        expect(units.length).toEqual(3);
        const unitTypes = units.map((unit) => unit.unitType);
        // One of each type
        Object.values(UnitType).forEach((unitType) => {
          expect(unitTypes).toContain(unitType);
        });
        // And they contain the coordinates
        units.forEach((unit) => {
          expect(unit.cellCoords).toContainEqual(coordinates);
        });
      });
    });
  });

  describe('print', () => {
    test('Prints solved 9x9 board', () => {
      const board = buildBoard(solvedBoard);
      const expected = `
        3 5 8 | 2 6 9 | 7 1 4
        7 2 9 | 5 4 1 | 3 8 6
        1 6 4 | 3 7 8 | 5 9 2
        ------+-------+------
        5 4 3 | 7 8 6 | 1 2 9
        6 9 2 | 1 3 5 | 8 4 7
        8 7 1 | 9 2 4 | 6 3 5
        ------+-------+------
        9 3 6 | 4 1 7 | 2 5 8
        4 1 7 | 8 5 2 | 9 6 3
        2 8 5 | 6 9 3 | 4 7 1
      `;
      expect(board.print()).toEqual(dedent(expected));
    });

    test('Prints unsolved 9x9 board', () => {
      const board = buildBoard(validBoard);
      const expected = `
        . 5 . | . 6 9 | . . 4
        7 2 . | 5 . 1 | . . .
        1 . 4 | . 7 . | . 9 .
        ------+-------+------
        . 4 3 | . . . | 1 . .
        6 9 . | . 3 . | . 4 7
        . . 1 | . . . | 6 3 .
        ------+-------+------
        . 3 . | . 1 . | 2 . 8
        . . . | 8 . 2 | . 6 3
        2 . . | 6 9 . | . 7 .
      `;
      expect(board.print()).toEqual(dedent(expected));
    });

    test('Prints solved 4x4 board', () => {
      const board = buildBoard(solvedFourByFourBoard);
      const expected = `
        4 3 | 1 2
        2 1 | 4 3
        ----+----
        3 4 | 2 1
        1 2 | 3 4
      `;
      expect(board.print()).toEqual(dedent(expected));
    });

    test('Prints unsolved 4x4 board', () => {
      const board = buildBoard(fourByFourBoard);
      const expected = `
        4 . | 1 .
        . . | . .
        ----+----
        . . | . .
        . 2 | . 4
      `;
      expect(board.print()).toEqual(dedent(expected));
    });

    test('Prints 16x16 board', () => {
      const board = buildBoard(sixteenBySixteenBoard);
      const expected = `
        .. .. 15 .. | .. .. .8 .. | .6 .. .. .. | .2 10 .. ..
        .. .4 .8 .3 | .. .6 12 .. | .9 .7 .. 14 | .. .. .. ..
        .5 .. .. .. | .. 15 .. 14 | 12 .. .. .1 | .. .. .7 ..
        11 .. .1 .9 | .. .7 .. .. | .. .3 .4 .. | .. .. .. ..
        ------------+-------------+-------------+------------
        .. .. .. .. | .. .. .. .. | .. .1 .. 11 | .4 .8 .. ..
        .. 14 .. .. | .. .. 15 .. | .. .. .8 .. | .. .9 10 .3
        .. .. .. .2 | .. .. .. .7 | 16 .. .5 .. | .. .1 .6 ..
        16 12 .. .. | .. 11 .6 .. | .. .. .. .4 | .. .. .5 ..
        ------------+-------------+-------------+------------
        .. .1 .. .. | 14 .2 .. .. | .. .. .6 .. | .. .. .. .4
        .. .. .4 .. | .. .9 .. 12 | .5 .. .. 16 | .. .. .. ..
        .9 .6 12 10 | .3 .5 .. .. | .1 .. 11 .. | 16 15 .. 14
        14 .. .3 .. | 15 .. .. .. | .. .. 10 .8 | 12 13 .9 ..
        ------------+-------------+-------------+------------
        .. .. 16 .. | .. .. .. .3 | 10 .. .. .. | .. 14 .. ..
        .. 15 .. .. | .. .. .9 .5 | .. .4 14 .. | 13 .. .. 16
        .. .. .7 12 | .. 14 .. .. | .. .. 13 .. | 11 .. .4 .1
        .4 .5 .. .. | .. 13 .. .. | .. .. .. .. | .. .7 .. ..
      `;
      expect(board.print()).toEqual(dedent(expected));
    });

    // TODO: Add a 16x16 solved board test as I am not solving this thing by hand
    // Tried running it through the backTracking solver and ran OOM
  });
});
