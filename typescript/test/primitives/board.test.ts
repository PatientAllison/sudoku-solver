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
  solvedSixteenBySixteenBoard,
  empty4x4Board,
  empty9x9Board,
  empty16x16Board,
  hundredByHundredBoard,
  solvedHundredByHundredBoard,
  unevenBoard,
} from '../fixtures';
import { Board } from '../../src/primitives/board';
import { Cell } from '../../src/primitives/cell';
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
      const rows = board.units.filter((unit) => unit.unitType === UnitType.Row);
      const cols = board.units.filter(
        (unit) => unit.unitType === UnitType.Column
      );
      const boxes = board.units.filter(
        (unit) => unit.unitType === UnitType.Box
      );
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

    test('Widths not equal board', () => {
      const cells = buildCells(unevenBoard);
      expect(() => new Board({ cells })).toThrow(
        /All rows must be the same width!/
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
      expect(clone.units).toEqual(board.units);
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

  describe('getPeersFromCoordinates', () => {
    test('returns peers for coordinates', () => {
      const board = buildBoard(validBoard);
      const cellCoordinates = board.cells
        .flat()
        .map((cell) => cell.coordinates);
      cellCoordinates.forEach((coordinates) => {
        const peers = board.getPeersFromCoordinates(coordinates);
        peers.forEach((peer) => {
          // Peer is not the same cell
          expect(peer.coordinates).not.toEqual(coordinates);
          // Peer shares at least one unit with cell
          const cellUnits = board.getUnitsFromCoordinates(coordinates);
          const peerUnits = board.getUnitsFromCoordinates(peer.coordinates);
          const cellRow = cellUnits.find(
            (unit) => unit.unitType === UnitType.Row
          );
          const peerRow = peerUnits.find(
            (unit) => unit.unitType === UnitType.Row
          );
          const cellCol = cellUnits.find(
            (unit) => unit.unitType === UnitType.Column
          );
          const peerCol = cellUnits.find(
            (unit) => unit.unitType === UnitType.Column
          );
          const cellBox = cellUnits.find(
            (unit) => unit.unitType === UnitType.Box
          );
          const peerBox = cellUnits.find(
            (unit) => unit.unitType === UnitType.Box
          );
          const shareUnit =
            cellRow === peerRow || cellCol === peerCol || cellBox === peerBox;
          expect(shareUnit).toEqual(true);
        });
      });
    });
  });

  describe('removeCandidatesFromPeers', () => {
    test('remove candidates for one cell', () => {
      const board = buildBoard(validBoard);
      const cells = board.cells.flat();
      // Initial run to remove all candidates from peers
      board.initializeCandidates();

      const cellToSet = cells[0];
      const valueToSet = 3;
      const coordinates = cells[0].coordinates;

      // Remove the candidates
      board.removeCandidatesFromPeers(coordinates, valueToSet);
      const unitsForCell = board.getUnitsFromCoordinates(coordinates);

      // Check that candidates are removed
      unitsForCell.forEach((unit) => {
        unit.cellCoords.forEach((cellCoords) => {
          const cell = board.getCellFromCoordinates(cellCoords);
          if (cell !== cellToSet) {
            expect(cell.getCandidates()).not.toContainEqual(valueToSet);
          }
        });
      });
    });
  });

  describe('initializeCandidates', () => {
    test('remove candidates for initial board', () => {
      const board = buildBoard(validBoard);
      const cells = board.cells.flat();
      // Initial run to remove all candidates from peers
      board.initializeCandidates();
      // Check that candidates are removed
      cells.forEach((cell) => {
        const peers = board.getPeersFromCoordinates(cell.coordinates);
        peers.forEach((peer) => {
          expect(peer.getCandidates()).not.toContain(cell.getValue());
        });
      });
    });
  });

  describe('getCandidateCount', () => {
    test('gets count for empty boards', () => {
      const cells = [empty4x4Board, empty9x9Board, empty16x16Board];
      const boards = cells.map((board) => buildBoard(board));
      boards.forEach((board) => {
        const expected = board.unitSize * board.cells.flat().length;
        expect(board.getCandidateCount()).toEqual(expected);
      });
    });

    test('gets count for partial board', () => {
      const cells = [fourByFourBoard, validBoard, sixteenBySixteenBoard];
      const boards = cells.map((board) => buildBoard(board));
      boards.forEach((board) => {
        // Don't bother coming up with precise numbers for each board, just assert a range
        const max = board.unitSize * board.cells.flat().length;
        const candidateCount = board.getCandidateCount();
        expect(candidateCount).toBeGreaterThan(0);
        expect(candidateCount).toBeLessThan(max);
      });
    });

    test('gets count for full board', () => {
      const cells = [
        solvedFourByFourBoard,
        solvedBoard,
        solvedSixteenBySixteenBoard,
      ];
      const boards = cells.map((board) => buildBoard(board));
      boards.forEach((board) => {
        expect(board.getCandidateCount()).toEqual(0);
      });
    });
  });

  describe('prettyPrint', () => {
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
      expect(board.prettyPrint()).toEqual(dedent(expected));
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
      expect(board.prettyPrint()).toEqual(dedent(expected));
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
      expect(board.prettyPrint()).toEqual(dedent(expected));
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
      expect(board.prettyPrint()).toEqual(dedent(expected));
    });

    test('Prints solved 16x16 board', () => {
      const board = buildBoard(solvedSixteenBySixteenBoard);
      const expected = `
        12 .7 15 14 | .1 .3 .8 .4 | .6 11 16 .5 | .2 10 13 .9
        .2 .4 .8 .3 | 10 .6 12 13 | .9 .7 15 14 | .1 16 11 .5
        .5 16 .6 13 | .9 15 11 14 | 12 10 .2 .1 | .3 .4 .7 .8
        11 10 .1 .9 | 16 .7 .5 .2 | .8 .3 .4 13 | .6 12 14 15
        ------------+-------------+-------------+------------
        .6 13 .5 15 | .2 10 .3 .9 | 14 .1 .7 11 | .4 .8 16 12
        .1 14 11 .4 | .5 12 15 16 | 13 .6 .8 .2 | .7 .9 10 .3
        .8 .3 .9 .2 | 13 .4 14 .7 | 16 12 .5 10 | 15 .1 .6 11
        16 12 10 .7 | .8 11 .6 .1 | .3 15 .9 .4 | 14 .2 .5 13
        ------------+-------------+-------------+------------
        .7 .1 13 16 | 14 .2 10 11 | 15 .9 .6 12 | .5 .3 .8 .4
        15 .2 .4 .8 | .7 .9 13 12 | .5 14 .3 16 | 10 11 .1 .6
        .9 .6 12 10 | .3 .5 .4 .8 | .1 13 11 .7 | 16 15 .2 14
        14 11 .3 .5 | 15 16 .1 .6 | .4 .2 10 .8 | 12 13 .9 .7
        ------------+-------------+-------------+------------
        13 .8 16 11 | .4 .1 .7 .3 | 10 .5 12 .6 | .9 14 15 .2
        10 15 .2 .1 | 11 .8 .9 .5 | .7 .4 14 .3 | 13 .6 12 16
        .3 .9 .7 12 | .6 14 16 10 | .2 .8 13 15 | 11 .5 .4 .1
        .4 .5 14 .6 | 12 13 .2 15 | 11 16 .1 .9 | .8 .7 .3 10
      `;
      expect(board.prettyPrint()).toEqual(dedent(expected));
    });

    test('Prints unsolved 16x16 board', () => {
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
      expect(board.prettyPrint()).toEqual(dedent(expected));
    });

    test('Prints solved 100x100 board', () => {
      const board = buildBoard(solvedHundredByHundredBoard);
      const expected = `
        .67 .98 ..7 .65 .94 .74 .24 100 .73 .42 | .35 .85 .49 .88 .52 .76 .90 .46 .70 .31 | .95 .37 .71 .50 .89 .61 .81 .75 .80 .38 | ..2 .19 .96 .59 .12 .77 ..1 .16 .17 .15 | .23 .69 .78 .28 .34 .57 ..6 .66 .87 .30 | .48 .54 .41 .43 .27 ..8 .58 .47 .83 .60 | .44 .62 .63 .64 ..5 .39 .10 .68 .51 .72 | .18 .26 .14 ..3 .82 .32 .93 .92 .22 .86 | .97 .36 .53 .84 .20 ..4 .91 .99 .13 .25 | .79 .29 .33 .40 .21 .55 .56 ..9 .11 .45

        ..2 .19 .96 .59 .12 .77 ..1 .16 .17 .15 | .23 .69 .78 .28 .34 .57 ..6 .66 .87 .30 | .48 .54 .41 .43 .27 ..8 .58 .47 .83 .60 | .44 .62 .63 .64 ..5 .39 .10 .68 .51 .72 | .18 .26 .14 ..3 .82 .32 .93 .92 .22 .86 | .97 .36 .53 .84 .20 ..4 .91 .99 .13 .25 | .79 .29 .33 .40 .21 .55 .56 ..9 .11 .45 | .67 .98 ..7 .65 .94 .74 .24 100 .73 .42 | .35 .85 .49 .88 .52 .76 .90 .46 .70 .31 | .95 .37 .71 .50 .89 .61 .81 .75 .80 .38

        .44 .62 .63 .64 ..5 .39 .10 .68 .51 .72 | .18 .26 .14 ..3 .82 .32 .93 .92 .22 .86 | .97 .36 .53 .84 .20 ..4 .91 .99 .13 .25 | .79 .29 .33 .40 .21 .55 .56 ..9 .11 .45 | .67 .98 ..7 .65 .94 .74 .24 100 .73 .42 | .35 .85 .49 .88 .52 .76 .90 .46 .70 .31 | .95 .37 .71 .50 .89 .61 .81 .75 .80 .38 | ..2 .19 .96 .59 .12 .77 ..1 .16 .17 .15 | .23 .69 .78 .28 .34 .57 ..6 .66 .87 .30 | .48 .54 .41 .43 .27 ..8 .58 .47 .83 .60

        .79 .29 .33 .40 .21 .55 .56 ..9 .11 .45 | .67 .98 ..7 .65 .94 .74 .24 100 .73 .42 | .35 .85 .49 .88 .52 .76 .90 .46 .70 .31 | .95 .37 .71 .50 .89 .61 .81 .75 .80 .38 | ..2 .19 .96 .59 .12 .77 ..1 .16 .17 .15 | .23 .69 .78 .28 .34 .57 ..6 .66 .87 .30 | .48 .54 .41 .43 .27 ..8 .58 .47 .83 .60 | .44 .62 .63 .64 ..5 .39 .10 .68 .51 .72 | .18 .26 .14 ..3 .82 .32 .93 .92 .22 .86 | .97 .36 .53 .84 .20 ..4 .91 .99 .13 .25

        .95 .37 .71 .50 .89 .61 .81 .75 .80 .38 | ..2 .19 .96 .59 .12 .77 ..1 .16 .17 .15 | .23 .69 .78 .28 .34 .57 ..6 .66 .87 .30 | .48 .54 .41 .43 .27 ..8 .58 .47 .83 .60 | .44 .62 .63 .64 ..5 .39 .10 .68 .51 .72 | .18 .26 .14 ..3 .82 .32 .93 .92 .22 .86 | .97 .36 .53 .84 .20 ..4 .91 .99 .13 .25 | .79 .29 .33 .40 .21 .55 .56 ..9 .11 .45 | .67 .98 ..7 .65 .94 .74 .24 100 .73 .42 | .35 .85 .49 .88 .52 .76 .90 .46 .70 .31

        .48 .54 .41 .43 .27 ..8 .58 .47 .83 .60 | .44 .62 .63 .64 ..5 .39 .10 .68 .51 .72 | .18 .26 .14 ..3 .82 .32 .93 .92 .22 .86 | .97 .36 .53 .84 .20 ..4 .91 .99 .13 .25 | .79 .29 .33 .40 .21 .55 .56 ..9 .11 .45 | .67 .98 ..7 .65 .94 .74 .24 100 .73 .42 | .35 .85 .49 .88 .52 .76 .90 .46 .70 .31 | .95 .37 .71 .50 .89 .61 .81 .75 .80 .38 | ..2 .19 .96 .59 .12 .77 ..1 .16 .17 .15 | .23 .69 .78 .28 .34 .57 ..6 .66 .87 .30

        .97 .36 .53 .84 .20 ..4 .91 .99 .13 .25 | .79 .29 .33 .40 .21 .55 .56 ..9 .11 .45 | .67 .98 ..7 .65 .94 .74 .24 100 .73 .42 | .35 .85 .49 .88 .52 .76 .90 .46 .70 .31 | .95 .37 .71 .50 .89 .61 .81 .75 .80 .38 | ..2 .19 .96 .59 .12 .77 ..1 .16 .17 .15 | .23 .69 .78 .28 .34 .57 ..6 .66 .87 .30 | .48 .54 .41 .43 .27 ..8 .58 .47 .83 .60 | .44 .62 .63 .64 ..5 .39 .10 .68 .51 .72 | .18 .26 .14 ..3 .82 .32 .93 .92 .22 .86

        .35 .85 .49 .88 .52 .76 .90 .46 .70 .31 | .95 .37 .71 .50 .89 .61 .81 .75 .80 .38 | ..2 .19 .96 .59 .12 .77 ..1 .16 .17 .15 | .23 .69 .78 .28 .34 .57 ..6 .66 .87 .30 | .48 .54 .41 .43 .27 ..8 .58 .47 .83 .60 | .44 .62 .63 .64 ..5 .39 .10 .68 .51 .72 | .18 .26 .14 ..3 .82 .32 .93 .92 .22 .86 | .97 .36 .53 .84 .20 ..4 .91 .99 .13 .25 | .79 .29 .33 .40 .21 .55 .56 ..9 .11 .45 | .67 .98 ..7 .65 .94 .74 .24 100 .73 .42

        .23 .69 .78 .28 .34 .57 ..6 .66 .87 .30 | .48 .54 .41 .43 .27 ..8 .58 .47 .83 .60 | .44 .62 .63 .64 ..5 .39 .10 .68 .51 .72 | .18 .26 .14 ..3 .82 .32 .93 .92 .22 .86 | .97 .36 .53 .84 .20 ..4 .91 .99 .13 .25 | .79 .29 .33 .40 .21 .55 .56 ..9 .11 .45 | .67 .98 ..7 .65 .94 .74 .24 100 .73 .42 | .35 .85 .49 .88 .52 .76 .90 .46 .70 .31 | .95 .37 .71 .50 .89 .61 .81 .75 .80 .38 | ..2 .19 .96 .59 .12 .77 ..1 .16 .17 .15

        .18 .26 .14 ..3 .82 .32 .93 .92 .22 .86 | .97 .36 .53 .84 .20 ..4 .91 .99 .13 .25 | .79 .29 .33 .40 .21 .55 .56 ..9 .11 .45 | .67 .98 ..7 .65 .94 .74 .24 100 .73 .42 | .35 .85 .49 .88 .52 .76 .90 .46 .70 .31 | .95 .37 .71 .50 .89 .61 .81 .75 .80 .38 | ..2 .19 .96 .59 .12 .77 ..1 .16 .17 .15 | .23 .69 .78 .28 .34 .57 ..6 .66 .87 .30 | .48 .54 .41 .43 .27 ..8 .58 .47 .83 .60 | .44 .62 .63 .64 ..5 .39 .10 .68 .51 .72

        ----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+----------------------------------------

        100 .73 .42 .67 .98 ..7 .65 .94 .74 .24 | .46 .70 .31 .35 .85 .49 .88 .52 .76 .90 | .75 .80 .38 .95 .37 .71 .50 .89 .61 .81 | .16 .17 .15 ..2 .19 .96 .59 .12 .77 ..1 | .66 .87 .30 .23 .69 .78 .28 .34 .57 ..6 | .47 .83 .60 .48 .54 .41 .43 .27 ..8 .58 | .68 .51 .72 .44 .62 .63 .64 ..5 .39 .10 | .92 .22 .86 .18 .26 .14 ..3 .82 .32 .93 | .99 .13 .25 .97 .36 .53 .84 .20 ..4 .91 | ..9 .11 .45 .79 .29 .33 .40 .21 .55 .56

        .16 .17 .15 ..2 .19 .96 .59 .12 .77 ..1 | .66 .87 .30 .23 .69 .78 .28 .34 .57 ..6 | .47 .83 .60 .48 .54 .41 .43 .27 ..8 .58 | .68 .51 .72 .44 .62 .63 .64 ..5 .39 .10 | .92 .22 .86 .18 .26 .14 ..3 .82 .32 .93 | .99 .13 .25 .97 .36 .53 .84 .20 ..4 .91 | ..9 .11 .45 .79 .29 .33 .40 .21 .55 .56 | 100 .73 .42 .67 .98 ..7 .65 .94 .74 .24 | .46 .70 .31 .35 .85 .49 .88 .52 .76 .90 | .75 .80 .38 .95 .37 .71 .50 .89 .61 .81

        .68 .51 .72 .44 .62 .63 .64 ..5 .39 .10 | .92 .22 .86 .18 .26 .14 ..3 .82 .32 .93 | .99 .13 .25 .97 .36 .53 .84 .20 ..4 .91 | ..9 .11 .45 .79 .29 .33 .40 .21 .55 .56 | 100 .73 .42 .67 .98 ..7 .65 .94 .74 .24 | .46 .70 .31 .35 .85 .49 .88 .52 .76 .90 | .75 .80 .38 .95 .37 .71 .50 .89 .61 .81 | .16 .17 .15 ..2 .19 .96 .59 .12 .77 ..1 | .66 .87 .30 .23 .69 .78 .28 .34 .57 ..6 | .47 .83 .60 .48 .54 .41 .43 .27 ..8 .58

        ..9 .11 .45 .79 .29 .33 .40 .21 .55 .56 | 100 .73 .42 .67 .98 ..7 .65 .94 .74 .24 | .46 .70 .31 .35 .85 .49 .88 .52 .76 .90 | .75 .80 .38 .95 .37 .71 .50 .89 .61 .81 | .16 .17 .15 ..2 .19 .96 .59 .12 .77 ..1 | .66 .87 .30 .23 .69 .78 .28 .34 .57 ..6 | .47 .83 .60 .48 .54 .41 .43 .27 ..8 .58 | .68 .51 .72 .44 .62 .63 .64 ..5 .39 .10 | .92 .22 .86 .18 .26 .14 ..3 .82 .32 .93 | .99 .13 .25 .97 .36 .53 .84 .20 ..4 .91

        .75 .80 .38 .95 .37 .71 .50 .89 .61 .81 | .16 .17 .15 ..2 .19 .96 .59 .12 .77 ..1 | .66 .87 .30 .23 .69 .78 .28 .34 .57 ..6 | .47 .83 .60 .48 .54 .41 .43 .27 ..8 .58 | .68 .51 .72 .44 .62 .63 .64 ..5 .39 .10 | .92 .22 .86 .18 .26 .14 ..3 .82 .32 .93 | .99 .13 .25 .97 .36 .53 .84 .20 ..4 .91 | ..9 .11 .45 .79 .29 .33 .40 .21 .55 .56 | 100 .73 .42 .67 .98 ..7 .65 .94 .74 .24 | .46 .70 .31 .35 .85 .49 .88 .52 .76 .90

        .47 .83 .60 .48 .54 .41 .43 .27 ..8 .58 | .68 .51 .72 .44 .62 .63 .64 ..5 .39 .10 | .92 .22 .86 .18 .26 .14 ..3 .82 .32 .93 | .99 .13 .25 .97 .36 .53 .84 .20 ..4 .91 | ..9 .11 .45 .79 .29 .33 .40 .21 .55 .56 | 100 .73 .42 .67 .98 ..7 .65 .94 .74 .24 | .46 .70 .31 .35 .85 .49 .88 .52 .76 .90 | .75 .80 .38 .95 .37 .71 .50 .89 .61 .81 | .16 .17 .15 ..2 .19 .96 .59 .12 .77 ..1 | .66 .87 .30 .23 .69 .78 .28 .34 .57 ..6

        .99 .13 .25 .97 .36 .53 .84 .20 ..4 .91 | ..9 .11 .45 .79 .29 .33 .40 .21 .55 .56 | 100 .73 .42 .67 .98 ..7 .65 .94 .74 .24 | .46 .70 .31 .35 .85 .49 .88 .52 .76 .90 | .75 .80 .38 .95 .37 .71 .50 .89 .61 .81 | .16 .17 .15 ..2 .19 .96 .59 .12 .77 ..1 | .66 .87 .30 .23 .69 .78 .28 .34 .57 ..6 | .47 .83 .60 .48 .54 .41 .43 .27 ..8 .58 | .68 .51 .72 .44 .62 .63 .64 ..5 .39 .10 | .92 .22 .86 .18 .26 .14 ..3 .82 .32 .93

        .46 .70 .31 .35 .85 .49 .88 .52 .76 .90 | .75 .80 .38 .95 .37 .71 .50 .89 .61 .81 | .16 .17 .15 ..2 .19 .96 .59 .12 .77 ..1 | .66 .87 .30 .23 .69 .78 .28 .34 .57 ..6 | .47 .83 .60 .48 .54 .41 .43 .27 ..8 .58 | .68 .51 .72 .44 .62 .63 .64 ..5 .39 .10 | .92 .22 .86 .18 .26 .14 ..3 .82 .32 .93 | .99 .13 .25 .97 .36 .53 .84 .20 ..4 .91 | ..9 .11 .45 .79 .29 .33 .40 .21 .55 .56 | 100 .73 .42 .67 .98 ..7 .65 .94 .74 .24

        .66 .87 .30 .23 .69 .78 .28 .34 .57 ..6 | .47 .83 .60 .48 .54 .41 .43 .27 ..8 .58 | .68 .51 .72 .44 .62 .63 .64 ..5 .39 .10 | .92 .22 .86 .18 .26 .14 ..3 .82 .32 .93 | .99 .13 .25 .97 .36 .53 .84 .20 ..4 .91 | ..9 .11 .45 .79 .29 .33 .40 .21 .55 .56 | 100 .73 .42 .67 .98 ..7 .65 .94 .74 .24 | .46 .70 .31 .35 .85 .49 .88 .52 .76 .90 | .75 .80 .38 .95 .37 .71 .50 .89 .61 .81 | .16 .17 .15 ..2 .19 .96 .59 .12 .77 ..1

        .92 .22 .86 .18 .26 .14 ..3 .82 .32 .93 | .99 .13 .25 .97 .36 .53 .84 .20 ..4 .91 | ..9 .11 .45 .79 .29 .33 .40 .21 .55 .56 | 100 .73 .42 .67 .98 ..7 .65 .94 .74 .24 | .46 .70 .31 .35 .85 .49 .88 .52 .76 .90 | .75 .80 .38 .95 .37 .71 .50 .89 .61 .81 | .16 .17 .15 ..2 .19 .96 .59 .12 .77 ..1 | .66 .87 .30 .23 .69 .78 .28 .34 .57 ..6 | .47 .83 .60 .48 .54 .41 .43 .27 ..8 .58 | .68 .51 .72 .44 .62 .63 .64 ..5 .39 .10

        ----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+----------------------------------------

        .94 .74 .24 100 .73 .42 .67 .98 ..7 .65 | .52 .76 .90 .46 .70 .31 .35 .85 .49 .88 | .89 .61 .81 .75 .80 .38 .95 .37 .71 .50 | .12 .77 ..1 .16 .17 .15 ..2 .19 .96 .59 | .34 .57 ..6 .66 .87 .30 .23 .69 .78 .28 | .27 ..8 .58 .47 .83 .60 .48 .54 .41 .43 | ..5 .39 .10 .68 .51 .72 .44 .62 .63 .64 | .82 .32 .93 .92 .22 .86 .18 .26 .14 ..3 | .20 ..4 .91 .99 .13 .25 .97 .36 .53 .84 | .21 .55 .56 ..9 .11 .45 .79 .29 .33 .40

        .12 .77 ..1 .16 .17 .15 ..2 .19 .96 .59 | .34 .57 ..6 .66 .87 .30 .23 .69 .78 .28 | .27 ..8 .58 .47 .83 .60 .48 .54 .41 .43 | ..5 .39 .10 .68 .51 .72 .44 .62 .63 .64 | .82 .32 .93 .92 .22 .86 .18 .26 .14 ..3 | .20 ..4 .91 .99 .13 .25 .97 .36 .53 .84 | .21 .55 .56 ..9 .11 .45 .79 .29 .33 .40 | .94 .74 .24 100 .73 .42 .67 .98 ..7 .65 | .52 .76 .90 .46 .70 .31 .35 .85 .49 .88 | .89 .61 .81 .75 .80 .38 .95 .37 .71 .50

        ..5 .39 .10 .68 .51 .72 .44 .62 .63 .64 | .82 .32 .93 .92 .22 .86 .18 .26 .14 ..3 | .20 ..4 .91 .99 .13 .25 .97 .36 .53 .84 | .21 .55 .56 ..9 .11 .45 .79 .29 .33 .40 | .94 .74 .24 100 .73 .42 .67 .98 ..7 .65 | .52 .76 .90 .46 .70 .31 .35 .85 .49 .88 | .89 .61 .81 .75 .80 .38 .95 .37 .71 .50 | .12 .77 ..1 .16 .17 .15 ..2 .19 .96 .59 | .34 .57 ..6 .66 .87 .30 .23 .69 .78 .28 | .27 ..8 .58 .47 .83 .60 .48 .54 .41 .43

        .21 .55 .56 ..9 .11 .45 .79 .29 .33 .40 | .94 .74 .24 100 .73 .42 .67 .98 ..7 .65 | .52 .76 .90 .46 .70 .31 .35 .85 .49 .88 | .89 .61 .81 .75 .80 .38 .95 .37 .71 .50 | .12 .77 ..1 .16 .17 .15 ..2 .19 .96 .59 | .34 .57 ..6 .66 .87 .30 .23 .69 .78 .28 | .27 ..8 .58 .47 .83 .60 .48 .54 .41 .43 | ..5 .39 .10 .68 .51 .72 .44 .62 .63 .64 | .82 .32 .93 .92 .22 .86 .18 .26 .14 ..3 | .20 ..4 .91 .99 .13 .25 .97 .36 .53 .84

        .89 .61 .81 .75 .80 .38 .95 .37 .71 .50 | .12 .77 ..1 .16 .17 .15 ..2 .19 .96 .59 | .34 .57 ..6 .66 .87 .30 .23 .69 .78 .28 | .27 ..8 .58 .47 .83 .60 .48 .54 .41 .43 | ..5 .39 .10 .68 .51 .72 .44 .62 .63 .64 | .82 .32 .93 .92 .22 .86 .18 .26 .14 ..3 | .20 ..4 .91 .99 .13 .25 .97 .36 .53 .84 | .21 .55 .56 ..9 .11 .45 .79 .29 .33 .40 | .94 .74 .24 100 .73 .42 .67 .98 ..7 .65 | .52 .76 .90 .46 .70 .31 .35 .85 .49 .88

        .27 ..8 .58 .47 .83 .60 .48 .54 .41 .43 | ..5 .39 .10 .68 .51 .72 .44 .62 .63 .64 | .82 .32 .93 .92 .22 .86 .18 .26 .14 ..3 | .20 ..4 .91 .99 .13 .25 .97 .36 .53 .84 | .21 .55 .56 ..9 .11 .45 .79 .29 .33 .40 | .94 .74 .24 100 .73 .42 .67 .98 ..7 .65 | .52 .76 .90 .46 .70 .31 .35 .85 .49 .88 | .89 .61 .81 .75 .80 .38 .95 .37 .71 .50 | .12 .77 ..1 .16 .17 .15 ..2 .19 .96 .59 | .34 .57 ..6 .66 .87 .30 .23 .69 .78 .28

        .20 ..4 .91 .99 .13 .25 .97 .36 .53 .84 | .21 .55 .56 ..9 .11 .45 .79 .29 .33 .40 | .94 .74 .24 100 .73 .42 .67 .98 ..7 .65 | .52 .76 .90 .46 .70 .31 .35 .85 .49 .88 | .89 .61 .81 .75 .80 .38 .95 .37 .71 .50 | .12 .77 ..1 .16 .17 .15 ..2 .19 .96 .59 | .34 .57 ..6 .66 .87 .30 .23 .69 .78 .28 | .27 ..8 .58 .47 .83 .60 .48 .54 .41 .43 | ..5 .39 .10 .68 .51 .72 .44 .62 .63 .64 | .82 .32 .93 .92 .22 .86 .18 .26 .14 ..3

        .52 .76 .90 .46 .70 .31 .35 .85 .49 .88 | .89 .61 .81 .75 .80 .38 .95 .37 .71 .50 | .12 .77 ..1 .16 .17 .15 ..2 .19 .96 .59 | .34 .57 ..6 .66 .87 .30 .23 .69 .78 .28 | .27 ..8 .58 .47 .83 .60 .48 .54 .41 .43 | ..5 .39 .10 .68 .51 .72 .44 .62 .63 .64 | .82 .32 .93 .92 .22 .86 .18 .26 .14 ..3 | .20 ..4 .91 .99 .13 .25 .97 .36 .53 .84 | .21 .55 .56 ..9 .11 .45 .79 .29 .33 .40 | .94 .74 .24 100 .73 .42 .67 .98 ..7 .65

        .34 .57 ..6 .66 .87 .30 .23 .69 .78 .28 | .27 ..8 .58 .47 .83 .60 .48 .54 .41 .43 | ..5 .39 .10 .68 .51 .72 .44 .62 .63 .64 | .82 .32 .93 .92 .22 .86 .18 .26 .14 ..3 | .20 ..4 .91 .99 .13 .25 .97 .36 .53 .84 | .21 .55 .56 ..9 .11 .45 .79 .29 .33 .40 | .94 .74 .24 100 .73 .42 .67 .98 ..7 .65 | .52 .76 .90 .46 .70 .31 .35 .85 .49 .88 | .89 .61 .81 .75 .80 .38 .95 .37 .71 .50 | .12 .77 ..1 .16 .17 .15 ..2 .19 .96 .59

        .82 .32 .93 .92 .22 .86 .18 .26 .14 ..3 | .20 ..4 .91 .99 .13 .25 .97 .36 .53 .84 | .21 .55 .56 ..9 .11 .45 .79 .29 .33 .40 | .94 .74 .24 100 .73 .42 .67 .98 ..7 .65 | .52 .76 .90 .46 .70 .31 .35 .85 .49 .88 | .89 .61 .81 .75 .80 .38 .95 .37 .71 .50 | .12 .77 ..1 .16 .17 .15 ..2 .19 .96 .59 | .34 .57 ..6 .66 .87 .30 .23 .69 .78 .28 | .27 ..8 .58 .47 .83 .60 .48 .54 .41 .43 | ..5 .39 .10 .68 .51 .72 .44 .62 .63 .64

        ----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+----------------------------------------

        .98 ..7 .65 .94 .74 .24 100 .73 .42 .67 | .85 .49 .88 .52 .76 .90 .46 .70 .31 .35 | .37 .71 .50 .89 .61 .81 .75 .80 .38 .95 | .19 .96 .59 .12 .77 ..1 .16 .17 .15 ..2 | .69 .78 .28 .34 .57 ..6 .66 .87 .30 .23 | .54 .41 .43 .27 ..8 .58 .47 .83 .60 .48 | .62 .63 .64 ..5 .39 .10 .68 .51 .72 .44 | .26 .14 ..3 .82 .32 .93 .92 .22 .86 .18 | .36 .53 .84 .20 ..4 .91 .99 .13 .25 .97 | .29 .33 .40 .21 .55 .56 ..9 .11 .45 .79

        .19 .96 .59 .12 .77 ..1 .16 .17 .15 ..2 | .69 .78 .28 .34 .57 ..6 .66 .87 .30 .23 | .54 .41 .43 .27 ..8 .58 .47 .83 .60 .48 | .62 .63 .64 ..5 .39 .10 .68 .51 .72 .44 | .26 .14 ..3 .82 .32 .93 .92 .22 .86 .18 | .36 .53 .84 .20 ..4 .91 .99 .13 .25 .97 | .29 .33 .40 .21 .55 .56 ..9 .11 .45 .79 | .98 ..7 .65 .94 .74 .24 100 .73 .42 .67 | .85 .49 .88 .52 .76 .90 .46 .70 .31 .35 | .37 .71 .50 .89 .61 .81 .75 .80 .38 .95

        .62 .63 .64 ..5 .39 .10 .68 .51 .72 .44 | .26 .14 ..3 .82 .32 .93 .92 .22 .86 .18 | .36 .53 .84 .20 ..4 .91 .99 .13 .25 .97 | .29 .33 .40 .21 .55 .56 ..9 .11 .45 .79 | .98 ..7 .65 .94 .74 .24 100 .73 .42 .67 | .85 .49 .88 .52 .76 .90 .46 .70 .31 .35 | .37 .71 .50 .89 .61 .81 .75 .80 .38 .95 | .19 .96 .59 .12 .77 ..1 .16 .17 .15 ..2 | .69 .78 .28 .34 .57 ..6 .66 .87 .30 .23 | .54 .41 .43 .27 ..8 .58 .47 .83 .60 .48

        .29 .33 .40 .21 .55 .56 ..9 .11 .45 .79 | .98 ..7 .65 .94 .74 .24 100 .73 .42 .67 | .85 .49 .88 .52 .76 .90 .46 .70 .31 .35 | .37 .71 .50 .89 .61 .81 .75 .80 .38 .95 | .19 .96 .59 .12 .77 ..1 .16 .17 .15 ..2 | .69 .78 .28 .34 .57 ..6 .66 .87 .30 .23 | .54 .41 .43 .27 ..8 .58 .47 .83 .60 .48 | .62 .63 .64 ..5 .39 .10 .68 .51 .72 .44 | .26 .14 ..3 .82 .32 .93 .92 .22 .86 .18 | .36 .53 .84 .20 ..4 .91 .99 .13 .25 .97

        .37 .71 .50 .89 .61 .81 .75 .80 .38 .95 | .19 .96 .59 .12 .77 ..1 .16 .17 .15 ..2 | .69 .78 .28 .34 .57 ..6 .66 .87 .30 .23 | .54 .41 .43 .27 ..8 .58 .47 .83 .60 .48 | .62 .63 .64 ..5 .39 .10 .68 .51 .72 .44 | .26 .14 ..3 .82 .32 .93 .92 .22 .86 .18 | .36 .53 .84 .20 ..4 .91 .99 .13 .25 .97 | .29 .33 .40 .21 .55 .56 ..9 .11 .45 .79 | .98 ..7 .65 .94 .74 .24 100 .73 .42 .67 | .85 .49 .88 .52 .76 .90 .46 .70 .31 .35

        .54 .41 .43 .27 ..8 .58 .47 .83 .60 .48 | .62 .63 .64 ..5 .39 .10 .68 .51 .72 .44 | .26 .14 ..3 .82 .32 .93 .92 .22 .86 .18 | .36 .53 .84 .20 ..4 .91 .99 .13 .25 .97 | .29 .33 .40 .21 .55 .56 ..9 .11 .45 .79 | .98 ..7 .65 .94 .74 .24 100 .73 .42 .67 | .85 .49 .88 .52 .76 .90 .46 .70 .31 .35 | .37 .71 .50 .89 .61 .81 .75 .80 .38 .95 | .19 .96 .59 .12 .77 ..1 .16 .17 .15 ..2 | .69 .78 .28 .34 .57 ..6 .66 .87 .30 .23

        .36 .53 .84 .20 ..4 .91 .99 .13 .25 .97 | .29 .33 .40 .21 .55 .56 ..9 .11 .45 .79 | .98 ..7 .65 .94 .74 .24 100 .73 .42 .67 | .85 .49 .88 .52 .76 .90 .46 .70 .31 .35 | .37 .71 .50 .89 .61 .81 .75 .80 .38 .95 | .19 .96 .59 .12 .77 ..1 .16 .17 .15 ..2 | .69 .78 .28 .34 .57 ..6 .66 .87 .30 .23 | .54 .41 .43 .27 ..8 .58 .47 .83 .60 .48 | .62 .63 .64 ..5 .39 .10 .68 .51 .72 .44 | .26 .14 ..3 .82 .32 .93 .92 .22 .86 .18

        .85 .49 .88 .52 .76 .90 .46 .70 .31 .35 | .37 .71 .50 .89 .61 .81 .75 .80 .38 .95 | .19 .96 .59 .12 .77 ..1 .16 .17 .15 ..2 | .69 .78 .28 .34 .57 ..6 .66 .87 .30 .23 | .54 .41 .43 .27 ..8 .58 .47 .83 .60 .48 | .62 .63 .64 ..5 .39 .10 .68 .51 .72 .44 | .26 .14 ..3 .82 .32 .93 .92 .22 .86 .18 | .36 .53 .84 .20 ..4 .91 .99 .13 .25 .97 | .29 .33 .40 .21 .55 .56 ..9 .11 .45 .79 | .98 ..7 .65 .94 .74 .24 100 .73 .42 .67

        .69 .78 .28 .34 .57 ..6 .66 .87 .30 .23 | .54 .41 .43 .27 ..8 .58 .47 .83 .60 .48 | .62 .63 .64 ..5 .39 .10 .68 .51 .72 .44 | .26 .14 ..3 .82 .32 .93 .92 .22 .86 .18 | .36 .53 .84 .20 ..4 .91 .99 .13 .25 .97 | .29 .33 .40 .21 .55 .56 ..9 .11 .45 .79 | .98 ..7 .65 .94 .74 .24 100 .73 .42 .67 | .85 .49 .88 .52 .76 .90 .46 .70 .31 .35 | .37 .71 .50 .89 .61 .81 .75 .80 .38 .95 | .19 .96 .59 .12 .77 ..1 .16 .17 .15 ..2

        .26 .14 ..3 .82 .32 .93 .92 .22 .86 .18 | .36 .53 .84 .20 ..4 .91 .99 .13 .25 .97 | .29 .33 .40 .21 .55 .56 ..9 .11 .45 .79 | .98 ..7 .65 .94 .74 .24 100 .73 .42 .67 | .85 .49 .88 .52 .76 .90 .46 .70 .31 .35 | .37 .71 .50 .89 .61 .81 .75 .80 .38 .95 | .19 .96 .59 .12 .77 ..1 .16 .17 .15 ..2 | .69 .78 .28 .34 .57 ..6 .66 .87 .30 .23 | .54 .41 .43 .27 ..8 .58 .47 .83 .60 .48 | .62 .63 .64 ..5 .39 .10 .68 .51 .72 .44

        ----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+----------------------------------------

        .73 .42 .67 .98 ..7 .65 .94 .74 .24 100 | .70 .31 .35 .85 .49 .88 .52 .76 .90 .46 | .80 .38 .95 .37 .71 .50 .89 .61 .81 .75 | .17 .15 ..2 .19 .96 .59 .12 .77 ..1 .16 | .87 .30 .23 .69 .78 .28 .34 .57 ..6 .66 | .83 .60 .48 .54 .41 .43 .27 ..8 .58 .47 | .51 .72 .44 .62 .63 .64 ..5 .39 .10 .68 | .22 .86 .18 .26 .14 ..3 .82 .32 .93 .92 | .13 .25 .97 .36 .53 .84 .20 ..4 .91 .99 | .11 .45 .79 .29 .33 .40 .21 .55 .56 ..9

        .17 .15 ..2 .19 .96 .59 .12 .77 ..1 .16 | .87 .30 .23 .69 .78 .28 .34 .57 ..6 .66 | .83 .60 .48 .54 .41 .43 .27 ..8 .58 .47 | .51 .72 .44 .62 .63 .64 ..5 .39 .10 .68 | .22 .86 .18 .26 .14 ..3 .82 .32 .93 .92 | .13 .25 .97 .36 .53 .84 .20 ..4 .91 .99 | .11 .45 .79 .29 .33 .40 .21 .55 .56 ..9 | .73 .42 .67 .98 ..7 .65 .94 .74 .24 100 | .70 .31 .35 .85 .49 .88 .52 .76 .90 .46 | .80 .38 .95 .37 .71 .50 .89 .61 .81 .75

        .51 .72 .44 .62 .63 .64 ..5 .39 .10 .68 | .22 .86 .18 .26 .14 ..3 .82 .32 .93 .92 | .13 .25 .97 .36 .53 .84 .20 ..4 .91 .99 | .11 .45 .79 .29 .33 .40 .21 .55 .56 ..9 | .73 .42 .67 .98 ..7 .65 .94 .74 .24 100 | .70 .31 .35 .85 .49 .88 .52 .76 .90 .46 | .80 .38 .95 .37 .71 .50 .89 .61 .81 .75 | .17 .15 ..2 .19 .96 .59 .12 .77 ..1 .16 | .87 .30 .23 .69 .78 .28 .34 .57 ..6 .66 | .83 .60 .48 .54 .41 .43 .27 ..8 .58 .47

        .11 .45 .79 .29 .33 .40 .21 .55 .56 ..9 | .73 .42 .67 .98 ..7 .65 .94 .74 .24 100 | .70 .31 .35 .85 .49 .88 .52 .76 .90 .46 | .80 .38 .95 .37 .71 .50 .89 .61 .81 .75 | .17 .15 ..2 .19 .96 .59 .12 .77 ..1 .16 | .87 .30 .23 .69 .78 .28 .34 .57 ..6 .66 | .83 .60 .48 .54 .41 .43 .27 ..8 .58 .47 | .51 .72 .44 .62 .63 .64 ..5 .39 .10 .68 | .22 .86 .18 .26 .14 ..3 .82 .32 .93 .92 | .13 .25 .97 .36 .53 .84 .20 ..4 .91 .99

        .80 .38 .95 .37 .71 .50 .89 .61 .81 .75 | .17 .15 ..2 .19 .96 .59 .12 .77 ..1 .16 | .87 .30 .23 .69 .78 .28 .34 .57 ..6 .66 | .83 .60 .48 .54 .41 .43 .27 ..8 .58 .47 | .51 .72 .44 .62 .63 .64 ..5 .39 .10 .68 | .22 .86 .18 .26 .14 ..3 .82 .32 .93 .92 | .13 .25 .97 .36 .53 .84 .20 ..4 .91 .99 | .11 .45 .79 .29 .33 .40 .21 .55 .56 ..9 | .73 .42 .67 .98 ..7 .65 .94 .74 .24 100 | .70 .31 .35 .85 .49 .88 .52 .76 .90 .46

        .83 .60 .48 .54 .41 .43 .27 ..8 .58 .47 | .51 .72 .44 .62 .63 .64 ..5 .39 .10 .68 | .22 .86 .18 .26 .14 ..3 .82 .32 .93 .92 | .13 .25 .97 .36 .53 .84 .20 ..4 .91 .99 | .11 .45 .79 .29 .33 .40 .21 .55 .56 ..9 | .73 .42 .67 .98 ..7 .65 .94 .74 .24 100 | .70 .31 .35 .85 .49 .88 .52 .76 .90 .46 | .80 .38 .95 .37 .71 .50 .89 .61 .81 .75 | .17 .15 ..2 .19 .96 .59 .12 .77 ..1 .16 | .87 .30 .23 .69 .78 .28 .34 .57 ..6 .66

        .13 .25 .97 .36 .53 .84 .20 ..4 .91 .99 | .11 .45 .79 .29 .33 .40 .21 .55 .56 ..9 | .73 .42 .67 .98 ..7 .65 .94 .74 .24 100 | .70 .31 .35 .85 .49 .88 .52 .76 .90 .46 | .80 .38 .95 .37 .71 .50 .89 .61 .81 .75 | .17 .15 ..2 .19 .96 .59 .12 .77 ..1 .16 | .87 .30 .23 .69 .78 .28 .34 .57 ..6 .66 | .83 .60 .48 .54 .41 .43 .27 ..8 .58 .47 | .51 .72 .44 .62 .63 .64 ..5 .39 .10 .68 | .22 .86 .18 .26 .14 ..3 .82 .32 .93 .92

        .70 .31 .35 .85 .49 .88 .52 .76 .90 .46 | .80 .38 .95 .37 .71 .50 .89 .61 .81 .75 | .17 .15 ..2 .19 .96 .59 .12 .77 ..1 .16 | .87 .30 .23 .69 .78 .28 .34 .57 ..6 .66 | .83 .60 .48 .54 .41 .43 .27 ..8 .58 .47 | .51 .72 .44 .62 .63 .64 ..5 .39 .10 .68 | .22 .86 .18 .26 .14 ..3 .82 .32 .93 .92 | .13 .25 .97 .36 .53 .84 .20 ..4 .91 .99 | .11 .45 .79 .29 .33 .40 .21 .55 .56 ..9 | .73 .42 .67 .98 ..7 .65 .94 .74 .24 100

        .87 .30 .23 .69 .78 .28 .34 .57 ..6 .66 | .83 .60 .48 .54 .41 .43 .27 ..8 .58 .47 | .51 .72 .44 .62 .63 .64 ..5 .39 .10 .68 | .22 .86 .18 .26 .14 ..3 .82 .32 .93 .92 | .13 .25 .97 .36 .53 .84 .20 ..4 .91 .99 | .11 .45 .79 .29 .33 .40 .21 .55 .56 ..9 | .73 .42 .67 .98 ..7 .65 .94 .74 .24 100 | .70 .31 .35 .85 .49 .88 .52 .76 .90 .46 | .80 .38 .95 .37 .71 .50 .89 .61 .81 .75 | .17 .15 ..2 .19 .96 .59 .12 .77 ..1 .16

        .22 .86 .18 .26 .14 ..3 .82 .32 .93 .92 | .13 .25 .97 .36 .53 .84 .20 ..4 .91 .99 | .11 .45 .79 .29 .33 .40 .21 .55 .56 ..9 | .73 .42 .67 .98 ..7 .65 .94 .74 .24 100 | .70 .31 .35 .85 .49 .88 .52 .76 .90 .46 | .80 .38 .95 .37 .71 .50 .89 .61 .81 .75 | .17 .15 ..2 .19 .96 .59 .12 .77 ..1 .16 | .87 .30 .23 .69 .78 .28 .34 .57 ..6 .66 | .83 .60 .48 .54 .41 .43 .27 ..8 .58 .47 | .51 .72 .44 .62 .63 .64 ..5 .39 .10 .68

        ----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+----------------------------------------

        .74 .24 100 .73 .42 .67 .98 ..7 .65 .94 | .76 .90 .46 .70 .31 .35 .85 .49 .88 .52 | .61 .81 .75 .80 .38 .95 .37 .71 .50 .89 | .77 ..1 .16 .17 .15 ..2 .19 .96 .59 .12 | .57 ..6 .66 .87 .30 .23 .69 .78 .28 .34 | ..8 .58 .47 .83 .60 .48 .54 .41 .43 .27 | .39 .10 .68 .51 .72 .44 .62 .63 .64 ..5 | .32 .93 .92 .22 .86 .18 .26 .14 ..3 .82 | ..4 .91 .99 .13 .25 .97 .36 .53 .84 .20 | .55 .56 ..9 .11 .45 .79 .29 .33 .40 .21

        .77 ..1 .16 .17 .15 ..2 .19 .96 .59 .12 | .57 ..6 .66 .87 .30 .23 .69 .78 .28 .34 | ..8 .58 .47 .83 .60 .48 .54 .41 .43 .27 | .39 .10 .68 .51 .72 .44 .62 .63 .64 ..5 | .32 .93 .92 .22 .86 .18 .26 .14 ..3 .82 | ..4 .91 .99 .13 .25 .97 .36 .53 .84 .20 | .55 .56 ..9 .11 .45 .79 .29 .33 .40 .21 | .74 .24 100 .73 .42 .67 .98 ..7 .65 .94 | .76 .90 .46 .70 .31 .35 .85 .49 .88 .52 | .61 .81 .75 .80 .38 .95 .37 .71 .50 .89

        .39 .10 .68 .51 .72 .44 .62 .63 .64 ..5 | .32 .93 .92 .22 .86 .18 .26 .14 ..3 .82 | ..4 .91 .99 .13 .25 .97 .36 .53 .84 .20 | .55 .56 ..9 .11 .45 .79 .29 .33 .40 .21 | .74 .24 100 .73 .42 .67 .98 ..7 .65 .94 | .76 .90 .46 .70 .31 .35 .85 .49 .88 .52 | .61 .81 .75 .80 .38 .95 .37 .71 .50 .89 | .77 ..1 .16 .17 .15 ..2 .19 .96 .59 .12 | .57 ..6 .66 .87 .30 .23 .69 .78 .28 .34 | ..8 .58 .47 .83 .60 .48 .54 .41 .43 .27

        .55 .56 ..9 .11 .45 .79 .29 .33 .40 .21 | .74 .24 100 .73 .42 .67 .98 ..7 .65 .94 | .76 .90 .46 .70 .31 .35 .85 .49 .88 .52 | .61 .81 .75 .80 .38 .95 .37 .71 .50 .89 | .77 ..1 .16 .17 .15 ..2 .19 .96 .59 .12 | .57 ..6 .66 .87 .30 .23 .69 .78 .28 .34 | ..8 .58 .47 .83 .60 .48 .54 .41 .43 .27 | .39 .10 .68 .51 .72 .44 .62 .63 .64 ..5 | .32 .93 .92 .22 .86 .18 .26 .14 ..3 .82 | ..4 .91 .99 .13 .25 .97 .36 .53 .84 .20

        .61 .81 .75 .80 .38 .95 .37 .71 .50 .89 | .77 ..1 .16 .17 .15 ..2 .19 .96 .59 .12 | .57 ..6 .66 .87 .30 .23 .69 .78 .28 .34 | ..8 .58 .47 .83 .60 .48 .54 .41 .43 .27 | .39 .10 .68 .51 .72 .44 .62 .63 .64 ..5 | .32 .93 .92 .22 .86 .18 .26 .14 ..3 .82 | ..4 .91 .99 .13 .25 .97 .36 .53 .84 .20 | .55 .56 ..9 .11 .45 .79 .29 .33 .40 .21 | .74 .24 100 .73 .42 .67 .98 ..7 .65 .94 | .76 .90 .46 .70 .31 .35 .85 .49 .88 .52

        ..8 .58 .47 .83 .60 .48 .54 .41 .43 .27 | .39 .10 .68 .51 .72 .44 .62 .63 .64 ..5 | .32 .93 .92 .22 .86 .18 .26 .14 ..3 .82 | ..4 .91 .99 .13 .25 .97 .36 .53 .84 .20 | .55 .56 ..9 .11 .45 .79 .29 .33 .40 .21 | .74 .24 100 .73 .42 .67 .98 ..7 .65 .94 | .76 .90 .46 .70 .31 .35 .85 .49 .88 .52 | .61 .81 .75 .80 .38 .95 .37 .71 .50 .89 | .77 ..1 .16 .17 .15 ..2 .19 .96 .59 .12 | .57 ..6 .66 .87 .30 .23 .69 .78 .28 .34

        ..4 .91 .99 .13 .25 .97 .36 .53 .84 .20 | .55 .56 ..9 .11 .45 .79 .29 .33 .40 .21 | .74 .24 100 .73 .42 .67 .98 ..7 .65 .94 | .76 .90 .46 .70 .31 .35 .85 .49 .88 .52 | .61 .81 .75 .80 .38 .95 .37 .71 .50 .89 | .77 ..1 .16 .17 .15 ..2 .19 .96 .59 .12 | .57 ..6 .66 .87 .30 .23 .69 .78 .28 .34 | ..8 .58 .47 .83 .60 .48 .54 .41 .43 .27 | .39 .10 .68 .51 .72 .44 .62 .63 .64 ..5 | .32 .93 .92 .22 .86 .18 .26 .14 ..3 .82

        .76 .90 .46 .70 .31 .35 .85 .49 .88 .52 | .61 .81 .75 .80 .38 .95 .37 .71 .50 .89 | .77 ..1 .16 .17 .15 ..2 .19 .96 .59 .12 | .57 ..6 .66 .87 .30 .23 .69 .78 .28 .34 | ..8 .58 .47 .83 .60 .48 .54 .41 .43 .27 | .39 .10 .68 .51 .72 .44 .62 .63 .64 ..5 | .32 .93 .92 .22 .86 .18 .26 .14 ..3 .82 | ..4 .91 .99 .13 .25 .97 .36 .53 .84 .20 | .55 .56 ..9 .11 .45 .79 .29 .33 .40 .21 | .74 .24 100 .73 .42 .67 .98 ..7 .65 .94

        .57 ..6 .66 .87 .30 .23 .69 .78 .28 .34 | ..8 .58 .47 .83 .60 .48 .54 .41 .43 .27 | .39 .10 .68 .51 .72 .44 .62 .63 .64 ..5 | .32 .93 .92 .22 .86 .18 .26 .14 ..3 .82 | ..4 .91 .99 .13 .25 .97 .36 .53 .84 .20 | .55 .56 ..9 .11 .45 .79 .29 .33 .40 .21 | .74 .24 100 .73 .42 .67 .98 ..7 .65 .94 | .76 .90 .46 .70 .31 .35 .85 .49 .88 .52 | .61 .81 .75 .80 .38 .95 .37 .71 .50 .89 | .77 ..1 .16 .17 .15 ..2 .19 .96 .59 .12

        .32 .93 .92 .22 .86 .18 .26 .14 ..3 .82 | ..4 .91 .99 .13 .25 .97 .36 .53 .84 .20 | .55 .56 ..9 .11 .45 .79 .29 .33 .40 .21 | .74 .24 100 .73 .42 .67 .98 ..7 .65 .94 | .76 .90 .46 .70 .31 .35 .85 .49 .88 .52 | .61 .81 .75 .80 .38 .95 .37 .71 .50 .89 | .77 ..1 .16 .17 .15 ..2 .19 .96 .59 .12 | .57 ..6 .66 .87 .30 .23 .69 .78 .28 .34 | ..8 .58 .47 .83 .60 .48 .54 .41 .43 .27 | .39 .10 .68 .51 .72 .44 .62 .63 .64 ..5

        ----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+----------------------------------------

        ..7 .65 .94 .74 .24 100 .73 .42 .67 .98 | .49 .88 .52 .76 .90 .46 .70 .31 .35 .85 | .71 .50 .89 .61 .81 .75 .80 .38 .95 .37 | .96 .59 .12 .77 ..1 .16 .17 .15 ..2 .19 | .78 .28 .34 .57 ..6 .66 .87 .30 .23 .69 | .41 .43 .27 ..8 .58 .47 .83 .60 .48 .54 | .63 .64 ..5 .39 .10 .68 .51 .72 .44 .62 | .14 ..3 .82 .32 .93 .92 .22 .86 .18 .26 | .53 .84 .20 ..4 .91 .99 .13 .25 .97 .36 | .33 .40 .21 .55 .56 ..9 .11 .45 .79 .29

        .96 .59 .12 .77 ..1 .16 .17 .15 ..2 .19 | .78 .28 .34 .57 ..6 .66 .87 .30 .23 .69 | .41 .43 .27 ..8 .58 .47 .83 .60 .48 .54 | .63 .64 ..5 .39 .10 .68 .51 .72 .44 .62 | .14 ..3 .82 .32 .93 .92 .22 .86 .18 .26 | .53 .84 .20 ..4 .91 .99 .13 .25 .97 .36 | .33 .40 .21 .55 .56 ..9 .11 .45 .79 .29 | ..7 .65 .94 .74 .24 100 .73 .42 .67 .98 | .49 .88 .52 .76 .90 .46 .70 .31 .35 .85 | .71 .50 .89 .61 .81 .75 .80 .38 .95 .37

        .63 .64 ..5 .39 .10 .68 .51 .72 .44 .62 | .14 ..3 .82 .32 .93 .92 .22 .86 .18 .26 | .53 .84 .20 ..4 .91 .99 .13 .25 .97 .36 | .33 .40 .21 .55 .56 ..9 .11 .45 .79 .29 | ..7 .65 .94 .74 .24 100 .73 .42 .67 .98 | .49 .88 .52 .76 .90 .46 .70 .31 .35 .85 | .71 .50 .89 .61 .81 .75 .80 .38 .95 .37 | .96 .59 .12 .77 ..1 .16 .17 .15 ..2 .19 | .78 .28 .34 .57 ..6 .66 .87 .30 .23 .69 | .41 .43 .27 ..8 .58 .47 .83 .60 .48 .54

        .33 .40 .21 .55 .56 ..9 .11 .45 .79 .29 | ..7 .65 .94 .74 .24 100 .73 .42 .67 .98 | .49 .88 .52 .76 .90 .46 .70 .31 .35 .85 | .71 .50 .89 .61 .81 .75 .80 .38 .95 .37 | .96 .59 .12 .77 ..1 .16 .17 .15 ..2 .19 | .78 .28 .34 .57 ..6 .66 .87 .30 .23 .69 | .41 .43 .27 ..8 .58 .47 .83 .60 .48 .54 | .63 .64 ..5 .39 .10 .68 .51 .72 .44 .62 | .14 ..3 .82 .32 .93 .92 .22 .86 .18 .26 | .53 .84 .20 ..4 .91 .99 .13 .25 .97 .36

        .71 .50 .89 .61 .81 .75 .80 .38 .95 .37 | .96 .59 .12 .77 ..1 .16 .17 .15 ..2 .19 | .78 .28 .34 .57 ..6 .66 .87 .30 .23 .69 | .41 .43 .27 ..8 .58 .47 .83 .60 .48 .54 | .63 .64 ..5 .39 .10 .68 .51 .72 .44 .62 | .14 ..3 .82 .32 .93 .92 .22 .86 .18 .26 | .53 .84 .20 ..4 .91 .99 .13 .25 .97 .36 | .33 .40 .21 .55 .56 ..9 .11 .45 .79 .29 | ..7 .65 .94 .74 .24 100 .73 .42 .67 .98 | .49 .88 .52 .76 .90 .46 .70 .31 .35 .85

        .41 .43 .27 ..8 .58 .47 .83 .60 .48 .54 | .63 .64 ..5 .39 .10 .68 .51 .72 .44 .62 | .14 ..3 .82 .32 .93 .92 .22 .86 .18 .26 | .53 .84 .20 ..4 .91 .99 .13 .25 .97 .36 | .33 .40 .21 .55 .56 ..9 .11 .45 .79 .29 | ..7 .65 .94 .74 .24 100 .73 .42 .67 .98 | .49 .88 .52 .76 .90 .46 .70 .31 .35 .85 | .71 .50 .89 .61 .81 .75 .80 .38 .95 .37 | .96 .59 .12 .77 ..1 .16 .17 .15 ..2 .19 | .78 .28 .34 .57 ..6 .66 .87 .30 .23 .69

        .53 .84 .20 ..4 .91 .99 .13 .25 .97 .36 | .33 .40 .21 .55 .56 ..9 .11 .45 .79 .29 | ..7 .65 .94 .74 .24 100 .73 .42 .67 .98 | .49 .88 .52 .76 .90 .46 .70 .31 .35 .85 | .71 .50 .89 .61 .81 .75 .80 .38 .95 .37 | .96 .59 .12 .77 ..1 .16 .17 .15 ..2 .19 | .78 .28 .34 .57 ..6 .66 .87 .30 .23 .69 | .41 .43 .27 ..8 .58 .47 .83 .60 .48 .54 | .63 .64 ..5 .39 .10 .68 .51 .72 .44 .62 | .14 ..3 .82 .32 .93 .92 .22 .86 .18 .26

        .49 .88 .52 .76 .90 .46 .70 .31 .35 .85 | .71 .50 .89 .61 .81 .75 .80 .38 .95 .37 | .96 .59 .12 .77 ..1 .16 .17 .15 ..2 .19 | .78 .28 .34 .57 ..6 .66 .87 .30 .23 .69 | .41 .43 .27 ..8 .58 .47 .83 .60 .48 .54 | .63 .64 ..5 .39 .10 .68 .51 .72 .44 .62 | .14 ..3 .82 .32 .93 .92 .22 .86 .18 .26 | .53 .84 .20 ..4 .91 .99 .13 .25 .97 .36 | .33 .40 .21 .55 .56 ..9 .11 .45 .79 .29 | ..7 .65 .94 .74 .24 100 .73 .42 .67 .98

        .78 .28 .34 .57 ..6 .66 .87 .30 .23 .69 | .41 .43 .27 ..8 .58 .47 .83 .60 .48 .54 | .63 .64 ..5 .39 .10 .68 .51 .72 .44 .62 | .14 ..3 .82 .32 .93 .92 .22 .86 .18 .26 | .53 .84 .20 ..4 .91 .99 .13 .25 .97 .36 | .33 .40 .21 .55 .56 ..9 .11 .45 .79 .29 | ..7 .65 .94 .74 .24 100 .73 .42 .67 .98 | .49 .88 .52 .76 .90 .46 .70 .31 .35 .85 | .71 .50 .89 .61 .81 .75 .80 .38 .95 .37 | .96 .59 .12 .77 ..1 .16 .17 .15 ..2 .19

        .14 ..3 .82 .32 .93 .92 .22 .86 .18 .26 | .53 .84 .20 ..4 .91 .99 .13 .25 .97 .36 | .33 .40 .21 .55 .56 ..9 .11 .45 .79 .29 | ..7 .65 .94 .74 .24 100 .73 .42 .67 .98 | .49 .88 .52 .76 .90 .46 .70 .31 .35 .85 | .71 .50 .89 .61 .81 .75 .80 .38 .95 .37 | .96 .59 .12 .77 ..1 .16 .17 .15 ..2 .19 | .78 .28 .34 .57 ..6 .66 .87 .30 .23 .69 | .41 .43 .27 ..8 .58 .47 .83 .60 .48 .54 | .63 .64 ..5 .39 .10 .68 .51 .72 .44 .62

        ----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+----------------------------------------

        .42 .67 .98 ..7 .65 .94 .74 .24 100 .73 | .31 .35 .85 .49 .88 .52 .76 .90 .46 .70 | .38 .95 .37 .71 .50 .89 .61 .81 .75 .80 | .15 ..2 .19 .96 .59 .12 .77 ..1 .16 .17 | .30 .23 .69 .78 .28 .34 .57 ..6 .66 .87 | .60 .48 .54 .41 .43 .27 ..8 .58 .47 .83 | .72 .44 .62 .63 .64 ..5 .39 .10 .68 .51 | .86 .18 .26 .14 ..3 .82 .32 .93 .92 .22 | .25 .97 .36 .53 .84 .20 ..4 .91 .99 .13 | .45 .79 .29 .33 .40 .21 .55 .56 ..9 .11

        .15 ..2 .19 .96 .59 .12 .77 ..1 .16 .17 | .30 .23 .69 .78 .28 .34 .57 ..6 .66 .87 | .60 .48 .54 .41 .43 .27 ..8 .58 .47 .83 | .72 .44 .62 .63 .64 ..5 .39 .10 .68 .51 | .86 .18 .26 .14 ..3 .82 .32 .93 .92 .22 | .25 .97 .36 .53 .84 .20 ..4 .91 .99 .13 | .45 .79 .29 .33 .40 .21 .55 .56 ..9 .11 | .42 .67 .98 ..7 .65 .94 .74 .24 100 .73 | .31 .35 .85 .49 .88 .52 .76 .90 .46 .70 | .38 .95 .37 .71 .50 .89 .61 .81 .75 .80

        .72 .44 .62 .63 .64 ..5 .39 .10 .68 .51 | .86 .18 .26 .14 ..3 .82 .32 .93 .92 .22 | .25 .97 .36 .53 .84 .20 ..4 .91 .99 .13 | .45 .79 .29 .33 .40 .21 .55 .56 ..9 .11 | .42 .67 .98 ..7 .65 .94 .74 .24 100 .73 | .31 .35 .85 .49 .88 .52 .76 .90 .46 .70 | .38 .95 .37 .71 .50 .89 .61 .81 .75 .80 | .15 ..2 .19 .96 .59 .12 .77 ..1 .16 .17 | .30 .23 .69 .78 .28 .34 .57 ..6 .66 .87 | .60 .48 .54 .41 .43 .27 ..8 .58 .47 .83

        .45 .79 .29 .33 .40 .21 .55 .56 ..9 .11 | .42 .67 .98 ..7 .65 .94 .74 .24 100 .73 | .31 .35 .85 .49 .88 .52 .76 .90 .46 .70 | .38 .95 .37 .71 .50 .89 .61 .81 .75 .80 | .15 ..2 .19 .96 .59 .12 .77 ..1 .16 .17 | .30 .23 .69 .78 .28 .34 .57 ..6 .66 .87 | .60 .48 .54 .41 .43 .27 ..8 .58 .47 .83 | .72 .44 .62 .63 .64 ..5 .39 .10 .68 .51 | .86 .18 .26 .14 ..3 .82 .32 .93 .92 .22 | .25 .97 .36 .53 .84 .20 ..4 .91 .99 .13

        .38 .95 .37 .71 .50 .89 .61 .81 .75 .80 | .15 ..2 .19 .96 .59 .12 .77 ..1 .16 .17 | .30 .23 .69 .78 .28 .34 .57 ..6 .66 .87 | .60 .48 .54 .41 .43 .27 ..8 .58 .47 .83 | .72 .44 .62 .63 .64 ..5 .39 .10 .68 .51 | .86 .18 .26 .14 ..3 .82 .32 .93 .92 .22 | .25 .97 .36 .53 .84 .20 ..4 .91 .99 .13 | .45 .79 .29 .33 .40 .21 .55 .56 ..9 .11 | .42 .67 .98 ..7 .65 .94 .74 .24 100 .73 | .31 .35 .85 .49 .88 .52 .76 .90 .46 .70

        .60 .48 .54 .41 .43 .27 ..8 .58 .47 .83 | .72 .44 .62 .63 .64 ..5 .39 .10 .68 .51 | .86 .18 .26 .14 ..3 .82 .32 .93 .92 .22 | .25 .97 .36 .53 .84 .20 ..4 .91 .99 .13 | .45 .79 .29 .33 .40 .21 .55 .56 ..9 .11 | .42 .67 .98 ..7 .65 .94 .74 .24 100 .73 | .31 .35 .85 .49 .88 .52 .76 .90 .46 .70 | .38 .95 .37 .71 .50 .89 .61 .81 .75 .80 | .15 ..2 .19 .96 .59 .12 .77 ..1 .16 .17 | .30 .23 .69 .78 .28 .34 .57 ..6 .66 .87

        .25 .97 .36 .53 .84 .20 ..4 .91 .99 .13 | .45 .79 .29 .33 .40 .21 .55 .56 ..9 .11 | .42 .67 .98 ..7 .65 .94 .74 .24 100 .73 | .31 .35 .85 .49 .88 .52 .76 .90 .46 .70 | .38 .95 .37 .71 .50 .89 .61 .81 .75 .80 | .15 ..2 .19 .96 .59 .12 .77 ..1 .16 .17 | .30 .23 .69 .78 .28 .34 .57 ..6 .66 .87 | .60 .48 .54 .41 .43 .27 ..8 .58 .47 .83 | .72 .44 .62 .63 .64 ..5 .39 .10 .68 .51 | .86 .18 .26 .14 ..3 .82 .32 .93 .92 .22

        .31 .35 .85 .49 .88 .52 .76 .90 .46 .70 | .38 .95 .37 .71 .50 .89 .61 .81 .75 .80 | .15 ..2 .19 .96 .59 .12 .77 ..1 .16 .17 | .30 .23 .69 .78 .28 .34 .57 ..6 .66 .87 | .60 .48 .54 .41 .43 .27 ..8 .58 .47 .83 | .72 .44 .62 .63 .64 ..5 .39 .10 .68 .51 | .86 .18 .26 .14 ..3 .82 .32 .93 .92 .22 | .25 .97 .36 .53 .84 .20 ..4 .91 .99 .13 | .45 .79 .29 .33 .40 .21 .55 .56 ..9 .11 | .42 .67 .98 ..7 .65 .94 .74 .24 100 .73

        .30 .23 .69 .78 .28 .34 .57 ..6 .66 .87 | .60 .48 .54 .41 .43 .27 ..8 .58 .47 .83 | .72 .44 .62 .63 .64 ..5 .39 .10 .68 .51 | .86 .18 .26 .14 ..3 .82 .32 .93 .92 .22 | .25 .97 .36 .53 .84 .20 ..4 .91 .99 .13 | .45 .79 .29 .33 .40 .21 .55 .56 ..9 .11 | .42 .67 .98 ..7 .65 .94 .74 .24 100 .73 | .31 .35 .85 .49 .88 .52 .76 .90 .46 .70 | .38 .95 .37 .71 .50 .89 .61 .81 .75 .80 | .15 ..2 .19 .96 .59 .12 .77 ..1 .16 .17

        .86 .18 .26 .14 ..3 .82 .32 .93 .92 .22 | .25 .97 .36 .53 .84 .20 ..4 .91 .99 .13 | .45 .79 .29 .33 .40 .21 .55 .56 ..9 .11 | .42 .67 .98 ..7 .65 .94 .74 .24 100 .73 | .31 .35 .85 .49 .88 .52 .76 .90 .46 .70 | .38 .95 .37 .71 .50 .89 .61 .81 .75 .80 | .15 ..2 .19 .96 .59 .12 .77 ..1 .16 .17 | .30 .23 .69 .78 .28 .34 .57 ..6 .66 .87 | .60 .48 .54 .41 .43 .27 ..8 .58 .47 .83 | .72 .44 .62 .63 .64 ..5 .39 .10 .68 .51

        ----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+----------------------------------------

        .24 100 .73 .42 .67 .98 ..7 .65 .94 .74 | .90 .46 .70 .31 .35 .85 .49 .88 .52 .76 | .81 .75 .80 .38 .95 .37 .71 .50 .89 .61 | ..1 .16 .17 .15 ..2 .19 .96 .59 .12 .77 | ..6 .66 .87 .30 .23 .69 .78 .28 .34 .57 | .58 .47 .83 .60 .48 .54 .41 .43 .27 ..8 | .10 .68 .51 .72 .44 .62 .63 .64 ..5 .39 | .93 .92 .22 .86 .18 .26 .14 ..3 .82 .32 | .91 .99 .13 .25 .97 .36 .53 .84 .20 ..4 | .56 ..9 .11 .45 .79 .29 .33 .40 .21 .55

        ..1 .16 .17 .15 ..2 .19 .96 .59 .12 .77 | ..6 .66 .87 .30 .23 .69 .78 .28 .34 .57 | .58 .47 .83 .60 .48 .54 .41 .43 .27 ..8 | .10 .68 .51 .72 .44 .62 .63 .64 ..5 .39 | .93 .92 .22 .86 .18 .26 .14 ..3 .82 .32 | .91 .99 .13 .25 .97 .36 .53 .84 .20 ..4 | .56 ..9 .11 .45 .79 .29 .33 .40 .21 .55 | .24 100 .73 .42 .67 .98 ..7 .65 .94 .74 | .90 .46 .70 .31 .35 .85 .49 .88 .52 .76 | .81 .75 .80 .38 .95 .37 .71 .50 .89 .61

        .10 .68 .51 .72 .44 .62 .63 .64 ..5 .39 | .93 .92 .22 .86 .18 .26 .14 ..3 .82 .32 | .91 .99 .13 .25 .97 .36 .53 .84 .20 ..4 | .56 ..9 .11 .45 .79 .29 .33 .40 .21 .55 | .24 100 .73 .42 .67 .98 ..7 .65 .94 .74 | .90 .46 .70 .31 .35 .85 .49 .88 .52 .76 | .81 .75 .80 .38 .95 .37 .71 .50 .89 .61 | ..1 .16 .17 .15 ..2 .19 .96 .59 .12 .77 | ..6 .66 .87 .30 .23 .69 .78 .28 .34 .57 | .58 .47 .83 .60 .48 .54 .41 .43 .27 ..8

        .56 ..9 .11 .45 .79 .29 .33 .40 .21 .55 | .24 100 .73 .42 .67 .98 ..7 .65 .94 .74 | .90 .46 .70 .31 .35 .85 .49 .88 .52 .76 | .81 .75 .80 .38 .95 .37 .71 .50 .89 .61 | ..1 .16 .17 .15 ..2 .19 .96 .59 .12 .77 | ..6 .66 .87 .30 .23 .69 .78 .28 .34 .57 | .58 .47 .83 .60 .48 .54 .41 .43 .27 ..8 | .10 .68 .51 .72 .44 .62 .63 .64 ..5 .39 | .93 .92 .22 .86 .18 .26 .14 ..3 .82 .32 | .91 .99 .13 .25 .97 .36 .53 .84 .20 ..4

        .81 .75 .80 .38 .95 .37 .71 .50 .89 .61 | ..1 .16 .17 .15 ..2 .19 .96 .59 .12 .77 | ..6 .66 .87 .30 .23 .69 .78 .28 .34 .57 | .58 .47 .83 .60 .48 .54 .41 .43 .27 ..8 | .10 .68 .51 .72 .44 .62 .63 .64 ..5 .39 | .93 .92 .22 .86 .18 .26 .14 ..3 .82 .32 | .91 .99 .13 .25 .97 .36 .53 .84 .20 ..4 | .56 ..9 .11 .45 .79 .29 .33 .40 .21 .55 | .24 100 .73 .42 .67 .98 ..7 .65 .94 .74 | .90 .46 .70 .31 .35 .85 .49 .88 .52 .76

        .58 .47 .83 .60 .48 .54 .41 .43 .27 ..8 | .10 .68 .51 .72 .44 .62 .63 .64 ..5 .39 | .93 .92 .22 .86 .18 .26 .14 ..3 .82 .32 | .91 .99 .13 .25 .97 .36 .53 .84 .20 ..4 | .56 ..9 .11 .45 .79 .29 .33 .40 .21 .55 | .24 100 .73 .42 .67 .98 ..7 .65 .94 .74 | .90 .46 .70 .31 .35 .85 .49 .88 .52 .76 | .81 .75 .80 .38 .95 .37 .71 .50 .89 .61 | ..1 .16 .17 .15 ..2 .19 .96 .59 .12 .77 | ..6 .66 .87 .30 .23 .69 .78 .28 .34 .57

        .91 .99 .13 .25 .97 .36 .53 .84 .20 ..4 | .56 ..9 .11 .45 .79 .29 .33 .40 .21 .55 | .24 100 .73 .42 .67 .98 ..7 .65 .94 .74 | .90 .46 .70 .31 .35 .85 .49 .88 .52 .76 | .81 .75 .80 .38 .95 .37 .71 .50 .89 .61 | ..1 .16 .17 .15 ..2 .19 .96 .59 .12 .77 | ..6 .66 .87 .30 .23 .69 .78 .28 .34 .57 | .58 .47 .83 .60 .48 .54 .41 .43 .27 ..8 | .10 .68 .51 .72 .44 .62 .63 .64 ..5 .39 | .93 .92 .22 .86 .18 .26 .14 ..3 .82 .32

        .90 .46 .70 .31 .35 .85 .49 .88 .52 .76 | .81 .75 .80 .38 .95 .37 .71 .50 .89 .61 | ..1 .16 .17 .15 ..2 .19 .96 .59 .12 .77 | ..6 .66 .87 .30 .23 .69 .78 .28 .34 .57 | .58 .47 .83 .60 .48 .54 .41 .43 .27 ..8 | .10 .68 .51 .72 .44 .62 .63 .64 ..5 .39 | .93 .92 .22 .86 .18 .26 .14 ..3 .82 .32 | .91 .99 .13 .25 .97 .36 .53 .84 .20 ..4 | .56 ..9 .11 .45 .79 .29 .33 .40 .21 .55 | .24 100 .73 .42 .67 .98 ..7 .65 .94 .74

        ..6 .66 .87 .30 .23 .69 .78 .28 .34 .57 | .58 .47 .83 .60 .48 .54 .41 .43 .27 ..8 | .10 .68 .51 .72 .44 .62 .63 .64 ..5 .39 | .93 .92 .22 .86 .18 .26 .14 ..3 .82 .32 | .91 .99 .13 .25 .97 .36 .53 .84 .20 ..4 | .56 ..9 .11 .45 .79 .29 .33 .40 .21 .55 | .24 100 .73 .42 .67 .98 ..7 .65 .94 .74 | .90 .46 .70 .31 .35 .85 .49 .88 .52 .76 | .81 .75 .80 .38 .95 .37 .71 .50 .89 .61 | ..1 .16 .17 .15 ..2 .19 .96 .59 .12 .77

        .93 .92 .22 .86 .18 .26 .14 ..3 .82 .32 | .91 .99 .13 .25 .97 .36 .53 .84 .20 ..4 | .56 ..9 .11 .45 .79 .29 .33 .40 .21 .55 | .24 100 .73 .42 .67 .98 ..7 .65 .94 .74 | .90 .46 .70 .31 .35 .85 .49 .88 .52 .76 | .81 .75 .80 .38 .95 .37 .71 .50 .89 .61 | ..1 .16 .17 .15 ..2 .19 .96 .59 .12 .77 | ..6 .66 .87 .30 .23 .69 .78 .28 .34 .57 | .58 .47 .83 .60 .48 .54 .41 .43 .27 ..8 | .10 .68 .51 .72 .44 .62 .63 .64 ..5 .39

        ----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+----------------------------------------

        .65 .94 .74 .24 100 .73 .42 .67 .98 ..7 | .88 .52 .76 .90 .46 .70 .31 .35 .85 .49 | .50 .89 .61 .81 .75 .80 .38 .95 .37 .71 | .59 .12 .77 ..1 .16 .17 .15 ..2 .19 .96 | .28 .34 .57 ..6 .66 .87 .30 .23 .69 .78 | .43 .27 ..8 .58 .47 .83 .60 .48 .54 .41 | .64 ..5 .39 .10 .68 .51 .72 .44 .62 .63 | ..3 .82 .32 .93 .92 .22 .86 .18 .26 .14 | .84 .20 ..4 .91 .99 .13 .25 .97 .36 .53 | .40 .21 .55 .56 ..9 .11 .45 .79 .29 .33

        .59 .12 .77 ..1 .16 .17 .15 ..2 .19 .96 | .28 .34 .57 ..6 .66 .87 .30 .23 .69 .78 | .43 .27 ..8 .58 .47 .83 .60 .48 .54 .41 | .64 ..5 .39 .10 .68 .51 .72 .44 .62 .63 | ..3 .82 .32 .93 .92 .22 .86 .18 .26 .14 | .84 .20 ..4 .91 .99 .13 .25 .97 .36 .53 | .40 .21 .55 .56 ..9 .11 .45 .79 .29 .33 | .65 .94 .74 .24 100 .73 .42 .67 .98 ..7 | .88 .52 .76 .90 .46 .70 .31 .35 .85 .49 | .50 .89 .61 .81 .75 .80 .38 .95 .37 .71

        .64 ..5 .39 .10 .68 .51 .72 .44 .62 .63 | ..3 .82 .32 .93 .92 .22 .86 .18 .26 .14 | .84 .20 ..4 .91 .99 .13 .25 .97 .36 .53 | .40 .21 .55 .56 ..9 .11 .45 .79 .29 .33 | .65 .94 .74 .24 100 .73 .42 .67 .98 ..7 | .88 .52 .76 .90 .46 .70 .31 .35 .85 .49 | .50 .89 .61 .81 .75 .80 .38 .95 .37 .71 | .59 .12 .77 ..1 .16 .17 .15 ..2 .19 .96 | .28 .34 .57 ..6 .66 .87 .30 .23 .69 .78 | .43 .27 ..8 .58 .47 .83 .60 .48 .54 .41

        .40 .21 .55 .56 ..9 .11 .45 .79 .29 .33 | .65 .94 .74 .24 100 .73 .42 .67 .98 ..7 | .88 .52 .76 .90 .46 .70 .31 .35 .85 .49 | .50 .89 .61 .81 .75 .80 .38 .95 .37 .71 | .59 .12 .77 ..1 .16 .17 .15 ..2 .19 .96 | .28 .34 .57 ..6 .66 .87 .30 .23 .69 .78 | .43 .27 ..8 .58 .47 .83 .60 .48 .54 .41 | .64 ..5 .39 .10 .68 .51 .72 .44 .62 .63 | ..3 .82 .32 .93 .92 .22 .86 .18 .26 .14 | .84 .20 ..4 .91 .99 .13 .25 .97 .36 .53

        .50 .89 .61 .81 .75 .80 .38 .95 .37 .71 | .59 .12 .77 ..1 .16 .17 .15 ..2 .19 .96 | .28 .34 .57 ..6 .66 .87 .30 .23 .69 .78 | .43 .27 ..8 .58 .47 .83 .60 .48 .54 .41 | .64 ..5 .39 .10 .68 .51 .72 .44 .62 .63 | ..3 .82 .32 .93 .92 .22 .86 .18 .26 .14 | .84 .20 ..4 .91 .99 .13 .25 .97 .36 .53 | .40 .21 .55 .56 ..9 .11 .45 .79 .29 .33 | .65 .94 .74 .24 100 .73 .42 .67 .98 ..7 | .88 .52 .76 .90 .46 .70 .31 .35 .85 .49

        .43 .27 ..8 .58 .47 .83 .60 .48 .54 .41 | .64 ..5 .39 .10 .68 .51 .72 .44 .62 .63 | ..3 .82 .32 .93 .92 .22 .86 .18 .26 .14 | .84 .20 ..4 .91 .99 .13 .25 .97 .36 .53 | .40 .21 .55 .56 ..9 .11 .45 .79 .29 .33 | .65 .94 .74 .24 100 .73 .42 .67 .98 ..7 | .88 .52 .76 .90 .46 .70 .31 .35 .85 .49 | .50 .89 .61 .81 .75 .80 .38 .95 .37 .71 | .59 .12 .77 ..1 .16 .17 .15 ..2 .19 .96 | .28 .34 .57 ..6 .66 .87 .30 .23 .69 .78

        .84 .20 ..4 .91 .99 .13 .25 .97 .36 .53 | .40 .21 .55 .56 ..9 .11 .45 .79 .29 .33 | .65 .94 .74 .24 100 .73 .42 .67 .98 ..7 | .88 .52 .76 .90 .46 .70 .31 .35 .85 .49 | .50 .89 .61 .81 .75 .80 .38 .95 .37 .71 | .59 .12 .77 ..1 .16 .17 .15 ..2 .19 .96 | .28 .34 .57 ..6 .66 .87 .30 .23 .69 .78 | .43 .27 ..8 .58 .47 .83 .60 .48 .54 .41 | .64 ..5 .39 .10 .68 .51 .72 .44 .62 .63 | ..3 .82 .32 .93 .92 .22 .86 .18 .26 .14

        .88 .52 .76 .90 .46 .70 .31 .35 .85 .49 | .50 .89 .61 .81 .75 .80 .38 .95 .37 .71 | .59 .12 .77 ..1 .16 .17 .15 ..2 .19 .96 | .28 .34 .57 ..6 .66 .87 .30 .23 .69 .78 | .43 .27 ..8 .58 .47 .83 .60 .48 .54 .41 | .64 ..5 .39 .10 .68 .51 .72 .44 .62 .63 | ..3 .82 .32 .93 .92 .22 .86 .18 .26 .14 | .84 .20 ..4 .91 .99 .13 .25 .97 .36 .53 | .40 .21 .55 .56 ..9 .11 .45 .79 .29 .33 | .65 .94 .74 .24 100 .73 .42 .67 .98 ..7

        .28 .34 .57 ..6 .66 .87 .30 .23 .69 .78 | .43 .27 ..8 .58 .47 .83 .60 .48 .54 .41 | .64 ..5 .39 .10 .68 .51 .72 .44 .62 .63 | ..3 .82 .32 .93 .92 .22 .86 .18 .26 .14 | .84 .20 ..4 .91 .99 .13 .25 .97 .36 .53 | .40 .21 .55 .56 ..9 .11 .45 .79 .29 .33 | .65 .94 .74 .24 100 .73 .42 .67 .98 ..7 | .88 .52 .76 .90 .46 .70 .31 .35 .85 .49 | .50 .89 .61 .81 .75 .80 .38 .95 .37 .71 | .59 .12 .77 ..1 .16 .17 .15 ..2 .19 .96

        ..3 .82 .32 .93 .92 .22 .86 .18 .26 .14 | .84 .20 ..4 .91 .99 .13 .25 .97 .36 .53 | .40 .21 .55 .56 ..9 .11 .45 .79 .29 .33 | .65 .94 .74 .24 100 .73 .42 .67 .98 ..7 | .88 .52 .76 .90 .46 .70 .31 .35 .85 .49 | .50 .89 .61 .81 .75 .80 .38 .95 .37 .71 | .59 .12 .77 ..1 .16 .17 .15 ..2 .19 .96 | .28 .34 .57 ..6 .66 .87 .30 .23 .69 .78 | .43 .27 ..8 .58 .47 .83 .60 .48 .54 .41 | .64 ..5 .39 .10 .68 .51 .72 .44 .62 .63
      `;
      expect(board.prettyPrint()).toEqual(dedent(expected));
    });

    test('Prints unsolved 100x100 board', () => {
      const board = buildBoard(hundredByHundredBoard);
      const expected = `
        .67 .98 ..7 .65 .94 .74 .24 100 .73 .42 | ... .85 .49 .88 .52 .76 .90 ... .70 ... | .95 .37 .71 .50 ... .61 ... .75 .80 .38 | ... .19 .96 .59 .12 .77 ... .16 .17 .15 | .23 .69 ... ... ... .57 ..6 .66 ... .30 | .48 .54 ... .43 .27 ... .58 .47 ... .60 | ... .62 ... .64 ..5 .39 .10 ... ... .72 | .18 ... .14 ... ... .32 ... .92 ... .86 | .97 ... .53 ... ... ... .91 ... ... ... | .79 .29 .33 .40 ... ... ... ..9 .11 ...

        ..2 ... ... .59 .12 ... ..1 ... .17 ... | .23 .69 .78 .28 .34 .57 ..6 .66 .87 ... | .48 .54 ... .43 .27 ..8 .58 .47 .83 .60 | .44 .62 .63 .64 ... .39 ... .68 .51 ... | ... .26 .14 ..3 ... .32 .93 .92 .22 .86 | .97 .36 ... ... .20 ..4 ... .99 .13 ... | .79 ... .33 ... .21 .55 .56 ..9 ... .45 | .67 ... ..7 ... .94 .74 ... 100 .73 .42 | ... .85 .49 .88 .52 .76 .90 .46 .70 ... | .95 ... .71 .50 .89 .61 .81 .75 ... ...

        ... .62 .63 ... ..5 .39 .10 .68 .51 .72 | .18 .26 .14 ..3 .82 ... .93 .92 .22 .86 | .97 .36 .53 .84 ... ..4 .91 .99 .13 ... | .79 ... ... .40 ... .55 ... ..9 ... .45 | .67 .98 ... .65 ... .74 .24 100 ... ... | ... .85 .49 .88 ... .76 .90 ... .70 .31 | ... .37 .71 .50 .89 ... ... .75 ... .38 | ... .19 ... .59 .12 .77 ..1 .16 .17 .15 | .23 .69 ... .28 .34 ... ..6 ... ... .30 | .48 .54 ... ... .27 ..8 ... .47 ... .60

        .79 .29 .33 .40 ... .55 .56 ..9 ... .45 | .67 .98 ..7 ... .94 .74 .24 100 .73 ... | ... .85 ... .88 .52 .76 .90 .46 .70 .31 | ... ... .71 .50 .89 .61 .81 ... ... .38 | ..2 .19 .96 .59 ... .77 ... .16 .17 ... | .23 .69 .78 .28 .34 ... ..6 .66 .87 .30 | ... .54 .41 .43 .27 ..8 .58 .47 ... ... | .44 .62 .63 .64 ..5 .39 .10 ... .51 .72 | .18 .26 .14 ..3 ... .32 .93 .92 ... .86 | .97 .36 .53 .84 ... ... .91 .99 .13 .25

        ... .37 ... .50 ... ... .81 .75 .80 .38 | ... .19 .96 ... .12 ... ... .16 .17 .15 | .23 .69 .78 .28 .34 .57 ..6 .66 ... .30 | .48 ... ... .43 .27 ..8 ... ... ... .60 | .44 .62 ... .64 ..5 .39 ... .68 .51 .72 | ... .26 .14 ..3 .82 .32 .93 .92 .22 ... | .97 .36 .53 .84 .20 ..4 .91 ... .13 .25 | .79 .29 .33 .40 .21 .55 .56 ..9 .11 .45 | .67 .98 ..7 .65 ... .74 ... ... .73 .42 | ... .85 .49 .88 ... .76 ... .46 .70 .31

        .48 .54 .41 ... .27 ..8 .58 .47 .83 .60 | .44 .62 ... .64 ... .39 ... .68 ... .72 | .18 .26 .14 ... ... ... .93 ... .22 .86 | .97 .36 .53 .84 ... ..4 ... ... .13 ... | .79 .29 .33 ... .21 .55 .56 ..9 .11 .45 | .67 .98 ..7 .65 .94 ... .24 100 .73 .42 | .35 .85 ... ... .52 .76 .90 .46 .70 .31 | .95 .37 ... ... .89 .61 ... ... .80 .38 | ..2 ... ... ... .12 ... ..1 ... .17 .15 | ... .69 .78 ... .34 ... ..6 .66 .87 .30

        .97 .36 .53 .84 .20 ..4 .91 .99 .13 .25 | .79 .29 .33 ... .21 .55 .56 ..9 ... .45 | .67 .98 ..7 .65 .94 .74 .24 100 .73 .42 | .35 ... .49 ... .52 .76 ... .46 ... .31 | .95 .37 .71 .50 .89 ... ... .75 .80 ... | ..2 .19 ... ... ... .77 ... .16 .17 .15 | ... .69 ... .28 ... .57 ..6 ... .87 .30 | .48 .54 .41 .43 .27 ..8 .58 .47 .83 .60 | .44 .62 ... ... ... ... .10 ... ... .72 | .18 ... .14 ..3 .82 .32 ... .92 .22 .86

        .35 ... .49 ... .52 .76 .90 .46 .70 ... | .95 .37 .71 .50 .89 .61 .81 .75 .80 .38 | ..2 .19 .96 .59 .12 ... ..1 .16 .17 .15 | .23 .69 ... .28 .34 ... ..6 .66 .87 ... | ... .54 .41 .43 ... ... .58 .47 .83 .60 | ... ... ... .64 ..5 .39 ... .68 ... ... | .18 .26 .14 ..3 ... ... .93 .92 .22 .86 | .97 .36 ... .84 .20 ..4 .91 .99 .13 .25 | .79 .29 .33 .40 .21 ... .56 ..9 .11 ... | .67 .98 ..7 ... ... ... ... 100 ... ...

        .23 .69 .78 ... .34 .57 ..6 .66 ... .30 | .48 ... .41 .43 ... ..8 ... ... .83 .60 | .44 .62 .63 .64 ..5 .39 ... .68 .51 .72 | .18 .26 .14 ..3 .82 ... ... ... .22 .86 | .97 ... .53 .84 .20 ..4 .91 ... ... .25 | ... .29 .33 ... .21 .55 .56 ..9 ... ... | .67 .98 ..7 .65 .94 .74 .24 100 .73 .42 | .35 .85 ... .88 ... .76 ... .46 .70 .31 | .95 ... .71 .50 .89 .61 .81 ... .80 .38 | ..2 .19 .96 ... .12 .77 ..1 ... .17 .15

        .18 .26 .14 ... ... .32 .93 .92 .22 ... | .97 .36 .53 .84 ... ..4 .91 ... .13 .25 | .79 .29 .33 ... .21 .55 .56 ..9 .11 .45 | .67 ... ..7 ... .94 .74 ... 100 .73 .42 | ... .85 .49 ... .52 .76 .90 .46 ... .31 | .95 ... .71 .50 .89 .61 .81 .75 .80 .38 | ..2 ... .96 .59 .12 .77 ..1 .16 .17 .15 | .23 .69 ... .28 .34 .57 ..6 .66 .87 .30 | .48 .54 .41 .43 ... ..8 .58 .47 .83 .60 | .44 ... .63 .64 ..5 ... ... .68 .51 .72

        ----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+----------------------------------------

        100 .73 .42 .67 ... ..7 .65 .94 .74 .24 | .46 .70 ... ... .85 .49 .88 .52 .76 .90 | .75 .80 .38 .95 ... ... ... .89 .61 .81 | .16 .17 .15 ..2 .19 .96 .59 ... .77 ..1 | ... .87 .30 ... .69 .78 .28 .34 .57 ..6 | ... ... .60 ... .54 .41 .43 ... ..8 .58 | .68 ... .72 .44 .62 .63 .64 ..5 .39 ... | ... .22 .86 .18 ... .14 ... .82 .32 .93 | ... .13 ... .97 ... .53 .84 ... ..4 .91 | ..9 .11 ... .79 .29 ... .40 .21 .55 .56

        .16 .17 .15 ..2 ... .96 .59 .12 .77 ..1 | .66 .87 .30 ... .69 .78 .28 .34 ... ... | .47 .83 .60 .48 .54 .41 ... .27 ..8 ... | .68 .51 .72 ... .62 .63 ... ..5 ... .10 | .92 .22 .86 ... .26 .14 ..3 .82 .32 .93 | .99 .13 .25 .97 .36 .53 ... .20 ..4 ... | ... .11 .45 .79 .29 ... .40 ... ... .56 | 100 .73 ... .67 .98 ..7 .65 .94 ... .24 | ... .70 .31 .35 .85 .49 .88 .52 .76 .90 | .75 .80 .38 .95 .37 .71 .50 .89 .61 .81

        .68 .51 .72 .44 .62 ... .64 ..5 .39 .10 | ... .22 .86 .18 ... .14 ... .82 .32 .93 | .99 .13 .25 .97 ... .53 ... .20 ... ... | ... .11 .45 .79 .29 .33 .40 .21 ... .56 | 100 .73 ... ... .98 ... .65 ... .74 .24 | .46 .70 .31 .35 .85 .49 .88 .52 .76 ... | .75 .80 ... ... ... ... .50 .89 .61 .81 | .16 ... .15 ..2 .19 .96 .59 .12 .77 ..1 | ... ... .30 .23 ... .78 .28 ... .57 ..6 | .47 .83 ... ... .54 .41 ... .27 ..8 .58

        ..9 ... .45 .79 .29 .33 ... .21 .55 .56 | 100 ... .42 .67 ... ..7 ... ... ... ... | .46 ... .31 .35 .85 .49 .88 ... .76 .90 | ... .80 .38 .95 .37 .71 .50 ... .61 .81 | .16 .17 .15 ... .19 .96 .59 .12 .77 ..1 | .66 .87 .30 .23 .69 .78 .28 .34 .57 ..6 | ... .83 ... .48 ... ... ... .27 ..8 .58 | ... .51 .72 ... ... .63 .64 ..5 ... .10 | .92 .22 .86 .18 .26 .14 ..3 .82 ... .93 | .99 ... .25 .97 ... .53 ... .20 ..4 .91

        .75 .80 .38 .95 .37 .71 ... .89 .61 ... | .16 .17 .15 ..2 ... ... .59 .12 .77 ... | .66 .87 .30 ... .69 .78 ... ... ... ..6 | .47 .83 .60 .48 .54 .41 ... .27 ... .58 | .68 .51 .72 .44 .62 .63 ... ..5 .39 ... | .92 ... .86 .18 ... .14 ... .82 ... .93 | .99 .13 .25 .97 .36 .53 .84 .20 ..4 .91 | ..9 .11 .45 .79 .29 ... .40 .21 .55 .56 | 100 .73 ... .67 .98 ..7 .65 .94 .74 .24 | .46 .70 ... .35 .85 .49 .88 .52 .76 .90

        ... .83 .60 .48 ... .41 .43 .27 ..8 .58 | .68 ... ... ... .62 .63 .64 ... ... .10 | ... .22 .86 .18 .26 .14 ... .82 .32 ... | .99 .13 .25 .97 .36 ... .84 .20 ..4 ... | ... .11 .45 .79 .29 .33 .40 .21 .55 .56 | 100 .73 .42 .67 ... ..7 .65 .94 .74 .24 | .46 .70 .31 ... ... .49 .88 ... .76 .90 | .75 .80 ... .95 .37 .71 .50 .89 .61 .81 | ... .17 .15 ..2 .19 .96 .59 .12 .77 ..1 | .66 .87 .30 .23 ... .78 .28 .34 .57 ...

        .99 .13 .25 ... .36 .53 .84 .20 ..4 .91 | ..9 ... ... .79 .29 .33 ... ... ... .56 | 100 .73 .42 ... ... ..7 .65 .94 .74 ... | ... .70 ... .35 .85 ... ... .52 .76 ... | .75 ... .38 .95 .37 .71 .50 ... .61 .81 | .16 .17 ... ..2 .19 .96 ... .12 .77 ... | .66 ... .30 .23 .69 .78 .28 ... .57 ... | ... .83 .60 .48 .54 .41 .43 .27 ..8 .58 | ... .51 .72 .44 ... .63 .64 ..5 .39 ... | ... .22 .86 .18 .26 .14 ... ... .32 .93

        .46 .70 .31 .35 .85 .49 .88 .52 .76 .90 | .75 .80 .38 .95 .37 .71 .50 .89 .61 .81 | ... ... .15 ..2 .19 .96 .59 .12 ... ..1 | .66 ... .30 .23 ... .78 .28 .34 ... ... | .47 .83 .60 ... .54 .41 ... ... ..8 .58 | ... .51 .72 .44 .62 ... .64 ..5 ... ... | .92 .22 .86 .18 .26 .14 ..3 .82 .32 .93 | ... ... ... ... .36 .53 ... .20 ... .91 | ... .11 .45 .79 ... .33 .40 .21 ... .56 | 100 .73 .42 .67 .98 ..7 ... .94 .74 .24

        .66 .87 .30 ... .69 .78 .28 .34 .57 ..6 | ... .83 .60 .48 .54 .41 ... ... ..8 ... | .68 .51 .72 .44 .62 .63 .64 ..5 .39 ... | ... .22 .86 .18 ... ... ..3 .82 .32 ... | .99 .13 .25 .97 .36 .53 .84 ... ..4 ... | ..9 ... .45 .79 ... .33 .40 ... .55 ... | 100 .73 .42 .67 .98 ..7 .65 .94 .74 .24 | .46 ... .31 .35 .85 ... .88 .52 .76 .90 | .75 .80 ... .95 .37 .71 .50 .89 .61 .81 | .16 .17 .15 ... .19 .96 .59 .12 .77 ..1

        .92 .22 .86 .18 .26 .14 ..3 .82 .32 .93 | ... .13 .25 .97 .36 ... .84 ... ... .91 | ..9 ... .45 .79 .29 .33 ... .21 ... ... | 100 .73 .42 ... .98 ... .65 ... .74 ... | .46 .70 ... ... .85 .49 .88 .52 ... .90 | .75 ... .38 ... ... .71 .50 .89 .61 .81 | .16 .17 ... ..2 .19 .96 ... .12 .77 ..1 | ... .87 .30 .23 .69 .78 .28 .34 .57 ..6 | ... .83 ... .48 .54 ... .43 ... ... .58 | .68 .51 .72 ... .62 ... .64 ..5 .39 ...

        ----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+----------------------------------------

        ... .74 .24 100 .73 ... ... ... ..7 ... | .52 .76 ... ... .70 .31 .35 .85 ... .88 | .89 .61 ... ... .80 .38 ... .37 .71 .50 | .12 .77 ..1 .16 .17 ... ..2 .19 .96 .59 | .34 ... ..6 .66 .87 .30 .23 .69 .78 .28 | .27 ... .58 .47 .83 .60 ... .54 .41 .43 | ..5 .39 ... .68 .51 .72 .44 ... ... .64 | .82 ... .93 .92 .22 .86 .18 .26 .14 ..3 | .20 ..4 .91 .99 ... .25 .97 .36 .53 .84 | ... ... .56 ..9 .11 .45 ... .29 .33 .40

        .12 ... ..1 .16 .17 .15 ..2 .19 .96 .59 | ... .57 ..6 .66 .87 .30 .23 .69 ... .28 | ... ... ... .47 .83 .60 ... .54 .41 .43 | ..5 .39 .10 .68 .51 ... .44 .62 .63 ... | .82 ... .93 ... .22 ... .18 .26 .14 ..3 | .20 ..4 .91 ... .13 .25 .97 .36 .53 .84 | .21 ... .56 ..9 ... ... .79 ... .33 .40 | .94 .74 .24 100 .73 .42 .67 ... ..7 .65 | .52 .76 ... .46 .70 ... .35 .85 ... .88 | .89 .61 .81 .75 .80 .38 .95 .37 .71 ...

        ... .39 ... ... ... .72 ... .62 .63 .64 | .82 .32 .93 .92 ... .86 ... .26 ... ..3 | ... ..4 .91 .99 ... ... .97 ... ... .84 | .21 ... ... ..9 .11 .45 .79 ... .33 .40 | .94 .74 .24 ... ... .42 ... .98 ... ... | .52 .76 ... .46 .70 ... .35 .85 .49 .88 | .89 .61 ... ... .80 .38 .95 .37 .71 .50 | .12 .77 ..1 .16 ... .15 ..2 ... .96 .59 | .34 .57 ..6 .66 .87 .30 .23 ... ... .28 | .27 ... .58 .47 .83 .60 ... .54 ... .43

        .21 .55 ... ..9 .11 ... ... ... .33 .40 | .94 .74 .24 100 .73 ... ... .98 ... ... | .52 ... .90 .46 .70 .31 ... ... .49 .88 | .89 .61 .81 .75 .80 .38 .95 .37 .71 .50 | .12 .77 ..1 .16 ... .15 ... .19 .96 .59 | ... .57 ... .66 ... .30 ... .69 .78 ... | .27 ..8 ... .47 .83 .60 .48 .54 .41 .43 | ..5 .39 .10 .68 .51 .72 .44 .62 ... .64 | .82 .32 .93 .92 .22 .86 ... .26 .14 ..3 | .20 ..4 .91 .99 ... ... ... .36 ... .84

        .89 .61 ... .75 .80 .38 ... .37 .71 .50 | .12 ... ... .16 .17 .15 ..2 .19 .96 .59 | .34 .57 ..6 ... .87 .30 .23 .69 .78 .28 | .27 ..8 .58 .47 ... .60 ... .54 .41 .43 | ..5 .39 .10 .68 .51 ... .44 .62 ... ... | .82 .32 .93 ... .22 .86 ... ... .14 ..3 | .20 ..4 .91 .99 .13 .25 .97 ... .53 .84 | .21 ... .56 ..9 .11 .45 ... .29 .33 ... | .94 ... .24 100 .73 .42 .67 .98 ... .65 | .52 .76 ... .46 .70 .31 .35 .85 .49 .88

        .27 ..8 .58 .47 ... ... .48 .54 .41 .43 | ..5 .39 ... ... .51 .72 .44 .62 .63 ... | ... .32 .93 .92 .22 .86 .18 ... .14 ..3 | .20 ..4 .91 .99 .13 ... .97 .36 .53 .84 | .21 .55 .56 ... .11 ... .79 ... .33 .40 | .94 .74 .24 100 .73 ... .67 .98 ..7 .65 | ... .76 .90 .46 .70 .31 .35 .85 .49 ... | .89 .61 .81 .75 .80 .38 .95 .37 .71 .50 | .12 .77 ..1 .16 .17 .15 ..2 .19 .96 .59 | .34 .57 ... .66 ... .30 .23 .69 ... .28

        .20 ..4 .91 .99 .13 ... .97 .36 .53 .84 | .21 .55 .56 ..9 ... .45 .79 ... ... .40 | .94 ... .24 ... .73 .42 ... .98 ... .65 | ... .76 .90 ... .70 .31 .35 .85 .49 .88 | ... .61 .81 .75 .80 .38 .95 .37 ... .50 | ... .77 ..1 .16 .17 ... ..2 .19 ... .59 | .34 ... ..6 .66 .87 .30 .23 .69 .78 ... | .27 ..8 ... .47 .83 ... .48 .54 .41 .43 | ..5 .39 .10 .68 ... .72 .44 ... .63 .64 | .82 .32 .93 .92 ... ... .18 .26 .14 ..3

        .52 .76 .90 .46 .70 .31 ... .85 ... .88 | .89 .61 .81 .75 .80 .38 ... .37 .71 .50 | .12 .77 ..1 .16 ... ... ..2 .19 ... .59 | .34 .57 ... .66 ... .30 ... .69 .78 ... | ... ... ... .47 .83 .60 .48 .54 ... ... | ..5 .39 .10 .68 ... .72 .44 ... .63 .64 | .82 .32 .93 ... ... .86 .18 .26 .14 ... | .20 ..4 .91 .99 .13 .25 .97 .36 .53 .84 | .21 .55 .56 ... .11 .45 .79 .29 .33 .40 | .94 .74 .24 100 .73 ... .67 ... ..7 ...

        .34 .57 ..6 .66 .87 .30 ... .69 .78 ... | .27 ... .58 ... .83 .60 .48 ... .41 .43 | ... .39 .10 .68 .51 .72 .44 .62 ... .64 | .82 ... .93 ... ... ... ... .26 .14 ... | .20 ..4 .91 .99 .13 .25 .97 .36 .53 .84 | .21 .55 .56 ..9 ... .45 .79 .29 ... .40 | ... ... .24 100 ... .42 .67 ... ..7 ... | ... .76 .90 .46 ... .31 ... .85 ... .88 | ... ... .81 ... .80 .38 .95 .37 .71 .50 | .12 .77 ..1 .16 .17 .15 ..2 .19 .96 .59

        .82 .32 ... .92 ... .86 .18 ... ... ..3 | .20 ... .91 .99 ... .25 .97 .36 .53 .84 | .21 ... .56 ..9 .11 .45 ... .29 ... .40 | .94 .74 .24 100 .73 .42 .67 .98 ... .65 | ... .76 .90 ... .70 ... .35 .85 .49 .88 | .89 .61 .81 .75 ... .38 .95 ... ... .50 | .12 .77 ..1 .16 .17 .15 ... .19 .96 .59 | .34 .57 ..6 .66 .87 .30 ... .69 ... .28 | .27 ..8 .58 .47 ... .60 ... ... .41 ... | ..5 .39 .10 ... .51 .72 .44 .62 .63 .64

        ----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+----------------------------------------

        .98 ..7 .65 .94 ... .24 100 .73 .42 .67 | ... .49 ... .52 .76 .90 ... .70 .31 ... | .37 .71 ... .89 .61 .81 ... .80 .38 .95 | ... .96 .59 ... .77 ..1 .16 .17 .15 ..2 | .69 .78 .28 .34 .57 ..6 .66 .87 .30 .23 | .54 .41 ... .27 ..8 ... .47 .83 .60 .48 | .62 ... ... ..5 .39 .10 .68 .51 ... .44 | .26 .14 ..3 .82 .32 ... .92 .22 .86 ... | .36 .53 ... .20 ..4 .91 .99 .13 .25 .97 | .29 .33 ... ... .55 .56 ... .11 .45 .79

        .19 .96 .59 .12 .77 ..1 .16 ... .15 ..2 | .69 ... ... .34 .57 ..6 .66 ... ... .23 | .54 ... ... .27 ... .58 ... ... .60 .48 | .62 .63 .64 ... .39 .10 .68 ... .72 .44 | ... .14 ... .82 .32 .93 .92 .22 .86 .18 | .36 .53 ... .20 ..4 ... .99 .13 .25 .97 | .29 .33 .40 .21 .55 ... ..9 .11 .45 .79 | .98 ..7 ... .94 .74 .24 100 ... .42 .67 | ... ... .88 .52 .76 .90 ... ... .31 .35 | .37 .71 .50 .89 ... .81 ... .80 .38 .95

        .62 ... .64 ..5 .39 ... ... .51 .72 ... | ... ... ..3 .82 .32 .93 .92 .22 ... ... | ... .53 .84 .20 ..4 .91 .99 ... .25 ... | .29 .33 .40 .21 ... ... ... .11 .45 .79 | .98 ..7 .65 .94 .74 ... 100 ... .42 ... | .85 .49 .88 .52 .76 .90 .46 .70 .31 ... | ... ... ... ... ... .81 .75 ... .38 .95 | ... .96 .59 .12 ... ..1 ... .17 .15 ..2 | ... .78 .28 ... .57 ..6 ... ... .30 ... | .54 .41 .43 ... ..8 .58 ... ... .60 .48

        .29 ... .40 .21 .55 .56 ..9 .11 .45 .79 | ... ... .65 .94 .74 .24 100 .73 .42 .67 | .85 .49 .88 ... ... .90 .46 .70 .31 ... | .37 .71 ... .89 .61 .81 .75 ... .38 .95 | .19 ... .59 ... ... ..1 .16 .17 .15 ..2 | .69 .78 .28 .34 .57 ..6 ... .87 ... .23 | .54 ... .43 ... ..8 .58 ... .83 .60 .48 | .62 .63 .64 ..5 .39 .10 .68 ... .72 .44 | .26 .14 ..3 .82 ... .93 .92 .22 .86 .18 | .36 ... ... .20 ..4 .91 .99 ... ... .97

        ... .71 .50 .89 ... .81 .75 ... .38 .95 | .19 .96 ... .12 .77 ... .16 .17 .15 ..2 | .69 .78 .28 .34 .57 ... .66 .87 .30 .23 | .54 .41 .43 .27 ..8 ... .47 .83 .60 ... | .62 ... .64 ..5 .39 ... .68 .51 .72 .44 | .26 ... ..3 ... .32 ... .92 .22 ... .18 | .36 ... .84 ... ..4 .91 ... ... .25 .97 | .29 .33 ... .21 .55 .56 ..9 .11 .45 .79 | .98 ..7 .65 .94 .74 .24 100 ... .42 .67 | .85 .49 .88 ... ... .90 ... .70 .31 .35

        ... .41 ... ... ... .58 .47 .83 .60 ... | .62 .63 .64 ..5 ... ... .68 ... ... .44 | .26 .14 ..3 .82 .32 .93 .92 .22 ... .18 | .36 .53 .84 .20 ..4 ... ... .13 .25 .97 | .29 .33 ... .21 .55 .56 ..9 .11 ... ... | .98 ..7 .65 .94 .74 .24 ... ... ... ... | .85 .49 .88 .52 ... ... ... .70 .31 .35 | .37 .71 ... .89 .61 .81 ... .80 ... .95 | .19 .96 .59 .12 ... ... .16 .17 .15 ..2 | .69 ... .28 .34 .57 ..6 .66 ... .30 ...

        .36 .53 .84 .20 ... .91 .99 .13 .25 .97 | .29 .33 ... .21 .55 ... ... .11 .45 .79 | .98 ..7 .65 ... .74 ... 100 ... .42 .67 | .85 ... .88 .52 ... .90 .46 .70 .31 .35 | ... .71 ... ... .61 .81 .75 ... .38 .95 | .19 ... .59 .12 ... ... .16 .17 .15 ..2 | .69 ... ... .34 .57 ..6 ... ... ... .23 | .54 ... ... ... ..8 .58 .47 .83 .60 .48 | ... .63 .64 ..5 .39 .10 .68 .51 .72 .44 | .26 .14 ... .82 .32 .93 .92 ... .86 .18

        .85 .49 .88 .52 .76 .90 .46 ... .31 .35 | .37 .71 .50 .89 .61 .81 .75 .80 .38 ... | .19 .96 .59 .12 .77 ..1 ... ... .15 ... | .69 ... ... .34 .57 ..6 ... .87 ... ... | .54 .41 .43 ... ..8 .58 .47 .83 .60 ... | .62 .63 ... ..5 .39 .10 .68 .51 .72 .44 | .26 .14 ..3 .82 .32 .93 .92 .22 .86 .18 | .36 .53 .84 .20 ..4 .91 .99 .13 .25 .97 | ... .33 .40 .21 .55 .56 ..9 .11 .45 .79 | .98 ... ... .94 .74 ... ... .73 ... .67

        ... .78 .28 .34 ... ..6 .66 ... .30 .23 | .54 .41 .43 .27 ... .58 ... .83 .60 .48 | .62 .63 .64 ..5 ... .10 .68 .51 .72 .44 | .26 .14 ..3 .82 .32 ... .92 .22 .86 .18 | .36 .53 .84 ... ..4 ... ... ... .25 ... | ... .33 .40 .21 .55 .56 ..9 .11 .45 .79 | ... ... .65 ... .74 ... 100 .73 .42 .67 | .85 .49 .88 ... .76 .90 .46 .70 ... .35 | .37 .71 .50 .89 .61 .81 ... .80 .38 .95 | ... .96 ... .12 ... ..1 ... .17 .15 ...

        ... .14 ... .82 .32 ... .92 .22 .86 .18 | ... .53 .84 ... ..4 .91 .99 .13 .25 ... | ... ... .40 .21 .55 .56 ..9 .11 .45 ... | .98 ..7 ... .94 .74 .24 100 ... .42 .67 | .85 ... ... .52 .76 .90 .46 .70 ... .35 | ... .71 .50 .89 .61 .81 .75 .80 .38 .95 | .19 .96 .59 .12 .77 ..1 .16 .17 .15 ..2 | .69 ... .28 .34 .57 ..6 .66 .87 ... .23 | ... .41 ... .27 ..8 .58 .47 ... ... .48 | .62 .63 ... ..5 .39 .10 .68 ... .72 .44

        ----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+----------------------------------------

        .73 ... .67 ... ..7 ... .94 ... .24 100 | ... .31 .35 ... .49 .88 .52 ... .90 .46 | .80 .38 .95 ... ... .50 .89 .61 .81 .75 | ... .15 ... .19 ... .59 .12 .77 ..1 .16 | .87 .30 ... .69 ... .28 .34 ... ... ... | .83 .60 .48 .54 .41 .43 .27 ..8 ... .47 | ... .72 .44 .62 ... ... ..5 .39 ... ... | .22 .86 ... ... .14 ... ... .32 ... .92 | .13 .25 .97 .36 .53 .84 .20 ..4 .91 ... | .11 .45 .79 .29 .33 .40 .21 .55 .56 ...

        ... ... ... .19 .96 ... .12 ... ..1 .16 | .87 ... .23 .69 .78 .28 ... ... ..6 .66 | ... .60 .48 ... ... ... .27 ..8 .58 .47 | .51 .72 .44 .62 ... ... ... ... .10 ... | .22 .86 .18 ... .14 ... .82 ... .93 .92 | .13 .25 .97 ... ... ... .20 ..4 .91 .99 | .11 ... .79 .29 .33 .40 ... ... .56 ... | ... .42 .67 .98 ..7 .65 .94 .74 .24 100 | ... ... .35 .85 .49 .88 .52 .76 ... .46 | .80 .38 .95 ... .71 .50 .89 .61 .81 .75

        .51 .72 .44 .62 ... .64 ..5 .39 .10 .68 | .22 .86 .18 .26 .14 ..3 .82 .32 .93 .92 | .13 .25 .97 ... ... .84 ... ..4 .91 .99 | ... .45 .79 .29 ... .40 ... .55 .56 ..9 | .73 .42 .67 .98 ..7 .65 .94 ... ... 100 | .70 .31 .35 .85 .49 .88 .52 .76 .90 .46 | .80 ... ... .37 ... .50 .89 .61 .81 .75 | ... .15 ... .19 .96 .59 .12 .77 ..1 .16 | .87 ... .23 .69 .78 ... ... .57 ... .66 | .83 ... .48 ... .41 .43 .27 ..8 .58 .47

        ... ... .79 .29 .33 .40 ... .55 .56 ..9 | .73 .42 ... ... ..7 .65 .94 .74 ... 100 | ... .31 .35 .85 .49 .88 .52 .76 .90 ... | .80 .38 ... ... ... .50 .89 .61 .81 .75 | ... .15 ..2 .19 .96 .59 .12 .77 ..1 .16 | ... ... .23 .69 ... ... ... ... ..6 .66 | .83 ... ... .54 .41 .43 ... ..8 ... .47 | .51 ... .44 .62 .63 .64 ..5 ... ... .68 | ... ... .18 ... ... ..3 .82 ... ... .92 | .13 .25 ... .36 .53 ... .20 ... .91 .99

        ... .38 .95 .37 .71 ... .89 .61 .81 .75 | .17 .15 ..2 .19 .96 ... .12 ... ... .16 | .87 .30 ... .69 .78 ... .34 .57 ... .66 | ... .60 .48 .54 .41 .43 .27 ..8 .58 .47 | ... ... .44 ... .63 .64 ..5 .39 .10 ... | ... ... ... ... .14 ..3 .82 .32 ... .92 | .13 .25 ... .36 .53 ... .20 ..4 ... .99 | .11 .45 .79 .29 ... .40 ... .55 .56 ..9 | .73 .42 .67 .98 ..7 ... ... .74 ... ... | ... ... .35 ... .49 .88 .52 .76 .90 .46

        .83 .60 .48 ... .41 ... .27 ..8 .58 .47 | ... .72 .44 .62 ... .64 ..5 .39 ... .68 | ... ... .18 .26 .14 ..3 .82 .32 ... .92 | .13 .25 .97 .36 .53 .84 ... ..4 .91 .99 | .11 .45 .79 .29 .33 ... .21 .55 ... ..9 | ... .42 .67 .98 ..7 .65 .94 ... .24 ... | .70 .31 ... ... ... .88 .52 .76 .90 .46 | .80 .38 .95 .37 ... ... .89 ... .81 .75 | .17 .15 ..2 .19 ... ... .12 ... ..1 ... | .87 .30 .23 .69 .78 .28 .34 .57 ... .66

        ... ... .97 ... .53 .84 .20 ..4 .91 ... | .11 .45 .79 ... .33 .40 .21 .55 .56 ..9 | ... .42 ... .98 ... ... ... .74 .24 100 | ... .31 .35 ... .49 .88 .52 .76 .90 .46 | ... .38 .95 .37 .71 ... .89 .61 .81 .75 | .17 .15 ..2 .19 .96 .59 ... .77 ..1 ... | .87 .30 .23 .69 .78 .28 ... .57 ... .66 | .83 ... .48 .54 .41 .43 .27 ... .58 ... | .51 .72 .44 .62 .63 .64 ..5 .39 .10 .68 | ... .86 ... ... .14 ... .82 .32 .93 ...

        .70 .31 .35 .85 ... .88 ... .76 ... .46 | ... .38 .95 .37 .71 .50 ... ... .81 .75 | .17 ... ..2 ... .96 .59 .12 ... ..1 .16 | .87 .30 .23 .69 .78 .28 .34 ... ..6 .66 | .83 .60 .48 ... .41 .43 .27 ..8 .58 .47 | ... .72 .44 .62 .63 ... ..5 ... .10 .68 | .22 .86 .18 .26 .14 ... .82 ... .93 .92 | ... .25 .97 .36 .53 ... ... ..4 ... .99 | .11 ... ... .29 .33 ... .21 .55 ... ..9 | .73 ... ... ... ..7 ... .94 ... .24 100

        .87 .30 ... .69 .78 .28 .34 .57 ..6 ... | .83 .60 .48 ... .41 .43 ... ..8 .58 .47 | ... .72 .44 .62 ... .64 ..5 .39 .10 .68 | ... .86 ... .26 .14 ..3 .82 ... .93 ... | ... ... .97 ... .53 .84 .20 ..4 ... .99 | .11 .45 ... .29 .33 .40 .21 .55 .56 ..9 | .73 .42 .67 .98 ... .65 .94 .74 .24 100 | .70 ... ... .85 .49 .88 ... .76 .90 .46 | ... .38 .95 ... .71 .50 ... .61 .81 .75 | .17 .15 ..2 .19 ... .59 .12 ... ..1 .16

        .22 ... ... .26 .14 ..3 .82 .32 .93 ... | ... .25 .97 .36 .53 ... .20 ..4 .91 ... | .11 ... .79 ... ... .40 .21 .55 .56 ..9 | .73 ... .67 ... ... .65 .94 .74 .24 100 | .70 .31 .35 .85 .49 .88 .52 .76 ... .46 | .80 .38 .95 ... .71 ... .89 .61 .81 .75 | .17 .15 ... .19 .96 .59 .12 .77 ..1 .16 | .87 .30 .23 .69 .78 ... .34 .57 ..6 .66 | .83 .60 ... ... ... .43 ... ... .58 .47 | .51 .72 .44 .62 ... ... ..5 ... .10 ...

        ----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+----------------------------------------

        .74 ... ... .73 .42 .67 ... ..7 .65 .94 | .76 ... .46 ... ... ... .85 .49 .88 .52 | .61 .81 .75 ... .38 .95 ... ... .50 ... | ... ..1 .16 .17 .15 ..2 .19 .96 .59 ... | ... ..6 .66 .87 .30 .23 .69 .78 .28 .34 | ..8 .58 .47 .83 .60 .48 .54 .41 ... .27 | .39 .10 .68 ... ... .44 ... .63 ... ... | ... ... .92 .22 .86 .18 .26 .14 ..3 .82 | ..4 .91 ... .13 .25 .97 .36 .53 .84 .20 | .55 .56 ..9 .11 .45 .79 .29 .33 .40 .21

        .77 ..1 .16 .17 ... ..2 .19 .96 .59 ... | .57 ..6 .66 .87 ... .23 .69 .78 ... .34 | ... .58 .47 .83 ... ... .54 .41 .43 ... | .39 .10 ... .51 ... ... .62 .63 .64 ..5 | .32 .93 .92 .22 .86 .18 .26 ... ... .82 | ..4 .91 ... .13 .25 .97 .36 .53 ... ... | .55 ... ..9 .11 ... .79 .29 ... .40 .21 | .74 .24 ... .73 ... .67 .98 ... .65 .94 | .76 ... ... ... .31 ... .85 ... ... .52 | ... .81 .75 .80 ... ... .37 .71 ... .89

        ... .10 .68 .51 .72 .44 .62 .63 .64 ..5 | .32 .93 .92 .22 .86 .18 ... ... ..3 .82 | ..4 .91 ... .13 .25 .97 .36 .53 .84 .20 | .55 ... ... ... .45 .79 .29 .33 .40 .21 | .74 ... ... .73 .42 ... ... ..7 ... .94 | ... .90 .46 .70 .31 ... .85 .49 ... .52 | .61 ... .75 .80 .38 .95 .37 ... ... ... | .77 ..1 .16 .17 .15 ..2 .19 .96 .59 .12 | ... ..6 ... ... .30 .23 ... .78 ... .34 | ..8 .58 .47 .83 ... .48 .54 .41 ... .27

        .55 .56 ..9 .11 .45 .79 .29 .33 .40 .21 | ... ... 100 .73 .42 .67 .98 ..7 .65 .94 | .76 .90 ... .70 .31 ... .85 .49 .88 .52 | .61 .81 ... .80 .38 .95 .37 .71 ... .89 | .77 ..1 ... .17 .15 ..2 .19 ... .59 ... | .57 ..6 .66 .87 ... .23 .69 ... .28 .34 | ..8 ... .47 .83 .60 .48 ... ... .43 .27 | ... .10 .68 ... .72 .44 .62 .63 .64 ..5 | .32 .93 .92 .22 .86 .18 .26 .14 ..3 .82 | ... .91 .99 .13 .25 .97 .36 .53 ... ...

        .61 ... .75 .80 .38 ... .37 .71 ... .89 | .77 ..1 .16 .17 .15 ... ... .96 .59 .12 | .57 ..6 .66 .87 .30 .23 .69 .78 .28 .34 | ... .58 .47 ... .60 .48 .54 .41 .43 .27 | ... ... .68 ... .72 .44 ... ... .64 ... | ... .93 .92 .22 .86 .18 .26 .14 ..3 ... | ..4 .91 .99 .13 .25 .97 .36 ... .84 ... | .55 .56 ..9 .11 .45 .79 ... .33 .40 .21 | .74 .24 100 .73 .42 .67 .98 ..7 ... .94 | .76 .90 .46 ... ... .35 .85 .49 .88 .52

        ..8 ... .47 ... .60 .48 ... .41 .43 .27 | .39 .10 .68 .51 .72 ... ... .63 .64 ..5 | .32 .93 .92 ... .86 .18 .26 .14 ..3 .82 | ..4 .91 .99 ... ... .97 .36 .53 .84 .20 | .55 .56 ... .11 .45 .79 ... .33 .40 .21 | .74 .24 ... .73 .42 .67 .98 ..7 .65 ... | ... ... .46 .70 .31 .35 .85 .49 .88 .52 | ... .81 .75 ... .38 .95 ... ... .50 ... | .77 ..1 .16 ... .15 ... .19 .96 .59 .12 | ... ..6 .66 .87 .30 .23 ... ... .28 .34

        ..4 ... .99 .13 ... .97 .36 .53 .84 ... | .55 ... ... .11 .45 .79 .29 .33 ... .21 | .74 .24 100 ... .42 ... ... ..7 .65 .94 | .76 ... .46 .70 ... .35 .85 .49 .88 .52 | .61 .81 .75 ... .38 ... .37 .71 .50 .89 | .77 ... .16 ... ... ..2 ... .96 .59 .12 | ... ... ... ... ... .23 ... .78 .28 .34 | ..8 ... .47 .83 ... .48 ... .41 ... .27 | .39 .10 .68 .51 ... ... .62 .63 .64 ..5 | .32 ... .92 .22 ... .18 .26 .14 ..3 .82

        .76 .90 .46 ... .31 ... .85 .49 ... .52 | ... .81 ... ... .38 ... ... ... ... .89 | .77 ... ... .17 .15 ..2 .19 ... .59 .12 | .57 ... ... .87 .30 ... .69 .78 ... .34 | ..8 ... .47 .83 .60 .48 .54 .41 .43 ... | .39 .10 .68 ... .72 .44 .62 .63 .64 ..5 | ... .93 ... .22 .86 ... .26 .14 ... .82 | ..4 .91 .99 ... .25 .97 .36 .53 .84 .20 | .55 ... ..9 ... .45 .79 .29 .33 ... .21 | .74 .24 100 .73 .42 .67 .98 ..7 .65 ...

        .57 ..6 .66 .87 ... .23 ... ... .28 .34 | ..8 ... .47 ... .60 .48 .54 .41 .43 .27 | .39 .10 .68 ... .72 .44 .62 .63 .64 ... | .32 .93 .92 .22 .86 ... ... .14 ..3 .82 | ... .91 .99 .13 .25 ... ... ... .84 .20 | .55 .56 ... .11 .45 .79 .29 .33 .40 .21 | .74 .24 ... ... .42 .67 .98 ... .65 .94 | .76 ... .46 ... .31 .35 .85 ... ... .52 | .61 .81 .75 .80 .38 .95 .37 .71 .50 .89 | ... ... .16 .17 .15 ... .19 .96 .59 ...

        .32 .93 ... ... .86 ... .26 .14 ... .82 | ..4 .91 .99 .13 .25 ... ... .53 .84 .20 | .55 .56 ... .11 ... ... .29 ... .40 .21 | .74 .24 100 .73 .42 .67 .98 ..7 .65 .94 | .76 .90 .46 ... .31 .35 .85 .49 .88 .52 | .61 .81 .75 .80 ... .95 ... .71 ... .89 | ... ..1 .16 .17 .15 ..2 ... .96 .59 .12 | .57 ... ... .87 ... .23 .69 .78 .28 ... | ... .58 .47 .83 .60 .48 .54 .41 ... .27 | .39 .10 .68 .51 ... ... .62 .63 .64 ..5

        ----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+----------------------------------------

        ..7 .65 .94 .74 .24 100 ... .42 .67 .98 | ... .88 .52 .76 .90 .46 .70 .31 .35 .85 | .71 ... .89 ... ... ... .80 .38 ... .37 | .96 .59 .12 ... ... .16 .17 .15 ..2 .19 | .78 .28 ... ... ..6 .66 .87 .30 .23 .69 | .41 .43 .27 ..8 ... ... ... .60 .48 ... | .63 .64 ..5 ... .10 .68 ... ... ... .62 | .14 ... .82 .32 ... .92 ... .86 .18 .26 | ... .84 .20 ... ... .99 .13 .25 .97 .36 | .33 .40 .21 .55 ... ... .11 .45 ... .29

        .96 .59 .12 .77 ..1 .16 ... .15 ..2 .19 | .78 ... .34 .57 ... .66 ... .30 ... .69 | .41 ... .27 ..8 .58 ... .83 .60 .48 .54 | .63 ... ..5 ... .10 .68 ... .72 .44 .62 | ... ..3 ... .32 ... .92 .22 .86 .18 .26 | ... .84 .20 ..4 .91 .99 ... .25 ... ... | .33 .40 .21 ... .56 ..9 .11 ... ... .29 | ..7 .65 .94 .74 .24 ... .73 ... ... .98 | ... .88 ... ... .90 .46 .70 .31 .35 .85 | .71 .50 ... .61 .81 .75 ... .38 ... ...

        .63 ... ..5 ... .10 ... .51 .72 .44 .62 | .14 ... .82 .32 ... .92 .22 ... .18 .26 | ... ... .20 ..4 .91 .99 ... .25 .97 .36 | .33 .40 .21 .55 .56 ..9 .11 .45 .79 ... | ... .65 .94 .74 .24 100 ... .42 .67 .98 | ... .88 .52 .76 .90 .46 .70 .31 .35 .85 | .71 ... .89 .61 .81 ... .80 .38 .95 .37 | ... .59 .12 .77 ..1 ... .17 ... ..2 .19 | ... .28 .34 .57 ..6 .66 .87 .30 .23 .69 | .41 .43 .27 ..8 .58 ... .83 ... .48 ...

        .33 .40 .21 .55 .56 ..9 .11 .45 ... .29 | ..7 ... ... ... .24 100 .73 .42 .67 .98 | .49 .88 .52 .76 .90 .46 .70 .31 ... .85 | .71 .50 .89 .61 ... .75 .80 .38 .95 .37 | .96 .59 .12 .77 ..1 .16 .17 .15 ... .19 | .78 .28 .34 .57 ..6 ... ... .30 .23 ... | .41 .43 .27 ... .58 .47 ... ... .48 .54 | .63 ... ..5 .39 ... ... .51 .72 .44 ... | .14 ..3 .82 ... ... .92 .22 .86 .18 .26 | ... .84 .20 ..4 .91 .99 .13 .25 .97 .36

        .71 .50 .89 .61 .81 .75 ... .38 ... .37 | .96 .59 .12 .77 ..1 .16 .17 .15 ..2 ... | ... .28 .34 .57 ... .66 .87 .30 .23 ... | .41 .43 .27 ..8 .58 .47 .83 .60 .48 ... | .63 ... ..5 ... .10 .68 ... .72 ... .62 | .14 ..3 .82 .32 .93 ... .22 ... ... .26 | .53 .84 .20 ..4 .91 .99 .13 .25 ... ... | .33 .40 .21 ... ... ... .11 .45 .79 .29 | ... ... .94 .74 .24 ... .73 .42 .67 .98 | .49 .88 .52 ... ... ... ... .31 ... .85

        .41 .43 .27 ..8 .58 .47 .83 ... .48 .54 | .63 ... ..5 .39 ... .68 ... .72 .44 .62 | ... ... ... .32 .93 .92 .22 .86 .18 .26 | ... .84 .20 ..4 .91 .99 .13 ... .97 ... | .33 .40 .21 .55 ... ..9 ... ... ... .29 | ..7 .65 ... .74 .24 ... .73 .42 .67 ... | ... ... .52 ... .90 .46 .70 .31 .35 .85 | .71 .50 .89 .61 .81 .75 ... .38 .95 .37 | .96 ... ... .77 ..1 .16 .17 .15 ... ... | .78 .28 .34 .57 ..6 ... .87 .30 .23 ...

        .53 .84 .20 ..4 .91 .99 .13 .25 .97 .36 | .33 .40 .21 ... ... ... .11 .45 ... .29 | ... .65 ... .74 .24 100 ... ... ... ... | .49 .88 .52 ... ... .46 ... .31 .35 ... | .71 .50 .89 ... .81 .75 .80 .38 ... .37 | .96 .59 .12 ... ... ... .17 .15 ..2 .19 | .78 ... .34 .57 ..6 .66 .87 .30 .23 .69 | .41 .43 ... ..8 .58 .47 .83 .60 .48 ... | .63 ... ..5 .39 ... .68 .51 .72 .44 .62 | .14 ..3 .82 ... .93 ... .22 ... .18 .26

        ... .88 .52 .76 .90 .46 ... .31 .35 .85 | .71 .50 .89 .61 .81 .75 .80 ... ... ... | .96 ... .12 .77 ..1 .16 .17 ... ..2 .19 | ... .28 .34 ... ... .66 .87 ... .23 .69 | ... ... .27 ..8 ... .47 .83 ... .48 ... | .63 .64 ..5 .39 .10 .68 .51 ... .44 .62 | .14 ..3 ... .32 .93 .92 .22 .86 .18 .26 | ... ... .20 ..4 .91 .99 .13 .25 .97 ... | .33 .40 ... .55 .56 ..9 .11 ... ... .29 | ..7 .65 ... .74 .24 100 .73 .42 ... ...

        .78 .28 ... .57 ..6 ... .87 .30 .23 .69 | .41 .43 .27 ..8 .58 .47 .83 .60 ... .54 | .63 .64 ..5 ... .10 ... .51 .72 .44 .62 | .14 ... .82 ... .93 .92 .22 .86 .18 ... | .53 .84 ... ..4 .91 .99 .13 ... ... ... | .33 ... .21 ... .56 ..9 .11 ... .79 .29 | ..7 .65 .94 ... .24 100 ... .42 ... .98 | .49 .88 .52 ... .90 .46 .70 .31 .35 ... | .71 .50 .89 .61 .81 .75 .80 ... .95 .37 | .96 .59 .12 ... ..1 .16 ... .15 ..2 ...

        .14 ..3 .82 .32 ... .92 .22 .86 .18 .26 | ... .84 ... ..4 .91 .99 .13 .25 .97 ... | .33 .40 ... .55 .56 ..9 .11 .45 .79 .29 | ..7 .65 .94 .74 ... 100 .73 .42 .67 ... | .49 .88 ... ... .90 .46 .70 .31 .35 .85 | .71 .50 .89 ... .81 .75 ... .38 .95 .37 | .96 .59 .12 .77 ..1 .16 .17 .15 ..2 .19 | .78 ... .34 .57 ... .66 .87 .30 .23 .69 | .41 .43 .27 ..8 .58 ... .83 .60 .48 .54 | .63 .64 ..5 .39 ... ... .51 .72 .44 .62

        ----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+----------------------------------------

        .42 .67 .98 ... .65 .94 .74 .24 100 .73 | .31 .35 .85 .49 .88 ... ... .90 .46 .70 | .38 ... .37 .71 .50 .89 .61 .81 ... .80 | ... ... .19 .96 .59 .12 .77 ..1 ... ... | ... .23 .69 .78 .28 ... .57 ..6 .66 .87 | ... .48 .54 .41 ... .27 ..8 ... ... ... | .72 .44 .62 .63 .64 ..5 .39 .10 ... .51 | ... .18 ... .14 ..3 ... .32 .93 .92 .22 | .25 .97 ... .53 ... .20 ..4 .91 .99 ... | ... .79 .29 .33 .40 ... .55 .56 ..9 .11

        .15 ... .19 .96 .59 .12 ... ... .16 .17 | .30 .23 .69 ... .28 ... .57 ..6 ... .87 | .60 .48 ... .41 .43 .27 ..8 .58 .47 .83 | .72 .44 .62 .63 .64 ... .39 .10 .68 ... | .86 .18 .26 .14 ... .82 .32 .93 .92 ... | .25 .97 .36 .53 .84 .20 ... ... .99 .13 | .45 .79 .29 .33 .40 ... .55 .56 ..9 .11 | .42 .67 .98 ..7 .65 ... .74 ... 100 .73 | .31 .35 ... ... ... .52 .76 ... ... .70 | ... .95 .37 ... ... .89 .61 .81 .75 ...

        ... .44 .62 .63 .64 ... .39 .10 ... .51 | .86 ... .26 .14 ..3 .82 .32 .93 .92 .22 | .25 .97 .36 .53 .84 .20 ... .91 .99 .13 | ... .79 .29 .33 ... .21 .55 .56 ..9 ... | .42 .67 .98 ..7 .65 .94 .74 ... ... .73 | .31 .35 ... .49 ... .52 .76 ... .46 .70 | ... ... ... .71 .50 .89 .61 .81 .75 .80 | .15 ... .19 .96 .59 .12 .77 ..1 .16 ... | ... ... .69 ... .28 .34 .57 ..6 ... .87 | ... .48 .54 .41 .43 .27 ..8 .58 .47 ...

        .45 .79 .29 .33 .40 ... .55 ... ..9 .11 | .42 ... .98 ..7 .65 ... ... .24 ... .73 | .31 .35 .85 .49 ... .52 .76 .90 .46 .70 | .38 .95 .37 .71 .50 .89 .61 ... ... .80 | ... ..2 ... .96 .59 ... ... ..1 .16 .17 | ... .23 ... .78 .28 ... ... ... .66 ... | .60 .48 .54 .41 ... .27 ... .58 ... .83 | .72 .44 ... .63 .64 ..5 .39 .10 .68 .51 | .86 .18 .26 .14 ..3 .82 .32 ... .92 .22 | .25 .97 .36 ... .84 .20 ... .91 .99 .13

        .38 ... ... .71 .50 .89 ... .81 ... .80 | .15 ..2 .19 .96 .59 .12 .77 ..1 .16 ... | .30 ... .69 .78 .28 .34 .57 ..6 .66 .87 | .60 .48 .54 ... .43 .27 ..8 ... .47 .83 | .72 ... .62 .63 .64 ..5 .39 .10 ... .51 | .86 .18 .26 .14 ..3 .82 .32 .93 .92 .22 | .25 ... .36 .53 .84 .20 ..4 ... .99 ... | .45 .79 .29 .33 .40 .21 ... .56 ..9 ... | ... .67 .98 ..7 .65 .94 .74 ... 100 ... | .31 .35 .85 .49 .88 .52 .76 .90 .46 ...

        .60 .48 ... .41 .43 .27 ..8 .58 .47 ... | ... .44 .62 ... .64 ... ... .10 .68 ... | .86 .18 .26 .14 ..3 .82 ... .93 .92 .22 | .25 .97 .36 .53 .84 .20 ..4 ... .99 .13 | .45 .79 .29 .33 .40 .21 .55 ... ..9 .11 | ... .67 .98 ... .65 .94 ... .24 100 .73 | .31 .35 .85 .49 .88 .52 .76 .90 ... .70 | ... .95 .37 .71 .50 .89 .61 ... ... .80 | .15 ..2 .19 .96 .59 ... .77 ..1 ... .17 | .30 .23 .69 .78 .28 .34 ... ..6 ... ...

        .25 .97 ... ... ... .20 ... .91 .99 ... | .45 .79 .29 .33 .40 .21 .55 .56 ... .11 | ... .67 .98 ..7 .65 .94 .74 .24 100 .73 | .31 .35 .85 .49 .88 .52 .76 ... .46 ... | ... ... .37 .71 .50 ... ... .81 .75 .80 | .15 ..2 .19 ... .59 .12 .77 ..1 .16 .17 | .30 ... .69 .78 .28 .34 .57 ..6 .66 .87 | ... .48 .54 .41 .43 ... ..8 ... .47 .83 | .72 ... .62 .63 .64 ..5 .39 .10 .68 .51 | ... .18 .26 .14 ..3 .82 ... .93 ... ...

        ... .35 .85 .49 ... ... .76 ... .46 .70 | .38 ... .37 .71 .50 ... .61 .81 ... .80 | ... ... .19 ... .59 .12 .77 ..1 .16 .17 | .30 .23 .69 .78 .28 .34 ... ..6 ... .87 | .60 ... .54 .41 .43 .27 ..8 .58 ... .83 | .72 .44 .62 .63 .64 ..5 .39 .10 ... .51 | .86 .18 .26 .14 ..3 .82 .32 ... .92 .22 | .25 ... .36 .53 ... .20 ..4 .91 .99 ... | .45 ... ... .33 .40 .21 ... .56 ..9 .11 | .42 .67 .98 ... .65 ... .74 .24 100 .73

        .30 .23 .69 .78 ... .34 .57 ..6 .66 ... | .60 .48 .54 .41 .43 .27 ..8 .58 ... .83 | .72 .44 ... .63 .64 ... ... .10 .68 .51 | .86 .18 ... .14 ..3 .82 .32 .93 .92 .22 | .25 ... .36 .53 .84 .20 ..4 .91 .99 .13 | ... .79 .29 .33 .40 .21 ... ... ... .11 | .42 .67 .98 ... .65 .94 ... ... 100 .73 | .31 ... .85 .49 .88 .52 .76 .90 ... ... | .38 .95 .37 .71 ... .89 ... .81 .75 .80 | .15 ..2 .19 ... .59 ... .77 ..1 .16 ...

        .86 .18 .26 .14 ..3 .82 .32 .93 .92 ... | .25 .97 .36 ... .84 .20 ..4 ... ... .13 | .45 .79 .29 .33 .40 .21 .55 .56 ..9 .11 | .42 .67 .98 ... .65 .94 ... .24 100 .73 | .31 ... .85 .49 .88 ... ... ... .46 ... | .38 ... .37 .71 .50 .89 .61 .81 ... ... | .15 ... .19 .96 .59 .12 .77 ..1 .16 ... | .30 .23 .69 .78 .28 .34 .57 ..6 .66 ... | ... .48 .54 .41 .43 .27 ..8 .58 .47 .83 | .72 .44 .62 .63 .64 ..5 .39 .10 .68 ...

        ----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+----------------------------------------

        .24 ... .73 ... .67 .98 ..7 .65 .94 .74 | .90 .46 .70 .31 .35 .85 ... .88 .52 .76 | ... ... .80 ... .95 ... ... .50 .89 .61 | ..1 .16 .17 ... ..2 .19 .96 .59 .12 .77 | ..6 .66 .87 .30 .23 ... .78 .28 .34 ... | .58 .47 .83 .60 .48 .54 .41 .43 .27 ..8 | .10 .68 .51 ... .44 .62 .63 ... ... .39 | ... .92 ... .86 .18 .26 .14 ... .82 .32 | .91 ... .13 ... .97 .36 .53 .84 .20 ..4 | .56 ..9 .11 .45 .79 .29 .33 .40 .21 .55

        ... .16 .17 .15 ..2 .19 .96 .59 .12 .77 | ..6 .66 .87 .30 .23 .69 .78 ... .34 .57 | .58 .47 .83 .60 .48 .54 .41 .43 ... ... | .10 ... .51 .72 ... .62 ... .64 ... .39 | .93 .92 ... ... ... .26 .14 ..3 ... .32 | .91 .99 .13 .25 .97 .36 .53 .84 .20 ..4 | .56 ..9 .11 ... .79 .29 ... .40 ... ... | .24 100 .73 .42 .67 .98 ... .65 .94 .74 | ... .46 .70 .31 .35 .85 .49 .88 .52 ... | .81 ... ... .38 ... .37 .71 .50 .89 .61

        .10 ... .51 ... .44 .62 .63 .64 ..5 .39 | ... .92 .22 ... ... .26 .14 ..3 .82 .32 | .91 .99 .13 ... .97 .36 ... .84 ... ..4 | .56 ..9 .11 ... .79 .29 .33 .40 ... .55 | .24 ... .73 .42 .67 .98 ..7 .65 .94 .74 | .90 .46 .70 ... .35 ... .49 .88 .52 .76 | ... .75 .80 .38 .95 .37 .71 .50 ... .61 | ..1 .16 .17 ... ..2 .19 ... ... .12 .77 | ..6 .66 .87 .30 .23 .69 .78 .28 .34 .57 | ... .47 .83 ... ... .54 .41 .43 .27 ..8

        ... ..9 .11 ... ... .29 .33 .40 ... .55 | .24 100 .73 .42 .67 .98 ..7 .65 .94 .74 | .90 .46 .70 .31 ... .85 .49 .88 ... .76 | .81 .75 .80 .38 .95 .37 ... .50 ... .61 | ... .16 .17 .15 ... .19 .96 .59 .12 .77 | ... ... .87 .30 .23 .69 ... ... .34 .57 | .58 .47 .83 .60 ... ... .41 .43 .27 ..8 | .10 ... ... .72 .44 .62 .63 ... ..5 .39 | ... .92 ... .86 .18 ... .14 ... .82 .32 | .91 .99 .13 ... .97 .36 .53 .84 .20 ...

        .81 ... ... .38 .95 .37 .71 .50 .89 ... | ... .16 .17 ... ..2 .19 .96 ... ... .77 | ..6 .66 ... .30 ... ... ... .28 ... .57 | ... .47 .83 .60 ... .54 .41 .43 .27 ..8 | .10 ... .51 ... .44 .62 .63 .64 ..5 .39 | .93 .92 .22 ... ... .26 ... ... .82 .32 | .91 .99 ... ... ... ... .53 ... ... ..4 | .56 ..9 .11 .45 .79 .29 .33 ... .21 .55 | .24 100 ... .42 .67 ... ..7 .65 ... .74 | .90 .46 .70 .31 .35 .85 ... ... .52 ...

        ... .47 ... ... .48 ... .41 .43 .27 ... | .10 .68 .51 .72 .44 .62 .63 .64 ..5 .39 | .93 .92 .22 .86 .18 ... .14 ..3 .82 .32 | ... .99 .13 .25 .97 .36 ... .84 ... ... | .56 ..9 ... .45 .79 ... ... .40 .21 ... | .24 100 .73 .42 .67 ... ..7 .65 ... .74 | .90 .46 ... .31 .35 .85 .49 .88 .52 ... | .81 ... .80 .38 .95 ... .71 .50 .89 .61 | ..1 .16 ... .15 ..2 .19 ... .59 .12 .77 | ..6 ... .87 .30 .23 .69 ... .28 .34 ...

        .91 .99 ... ... .97 .36 .53 ... .20 ..4 | ... ..9 .11 .45 ... .29 .33 ... .21 .55 | .24 100 .73 ... .67 ... ..7 ... .94 .74 | ... .46 .70 ... .35 .85 .49 .88 .52 .76 | .81 .75 .80 .38 ... .37 .71 .50 ... .61 | ..1 .16 .17 ... ..2 .19 .96 .59 .12 ... | ..6 .66 .87 .30 .23 .69 .78 ... ... .57 | .58 .47 ... .60 .48 .54 .41 .43 ... ..8 | .10 ... .51 .72 ... .62 ... ... ..5 .39 | .93 .92 ... ... .18 .26 .14 ..3 .82 .32

        .90 .46 .70 .31 ... ... .49 .88 ... .76 | .81 .75 ... .38 .95 .37 ... .50 .89 .61 | ... .16 .17 .15 ... .19 .96 .59 .12 .77 | ..6 ... .87 .30 .23 .69 .78 .28 .34 .57 | .58 .47 .83 .60 .48 .54 .41 .43 .27 ... | .10 .68 ... ... ... .62 .63 .64 ..5 ... | .93 .92 .22 .86 .18 .26 .14 ..3 .82 .32 | .91 .99 .13 .25 ... ... ... ... ... ..4 | .56 ... .11 .45 ... .29 .33 ... .21 .55 | ... 100 .73 .42 .67 .98 ... .65 ... ...

        ... .66 .87 .30 .23 ... .78 .28 .34 ... | .58 .47 .83 ... .48 .54 .41 .43 .27 ..8 | .10 .68 .51 .72 ... ... .63 .64 ... .39 | .93 .92 .22 ... .18 .26 .14 ... .82 ... | .91 ... .13 .25 .97 ... .53 ... .20 ..4 | .56 ..9 ... ... .79 .29 .33 .40 .21 .55 | .24 100 .73 ... .67 .98 ..7 .65 .94 .74 | .90 .46 .70 .31 ... .85 .49 ... .52 .76 | .81 .75 .80 .38 .95 ... .71 .50 .89 .61 | ..1 ... .17 .15 ..2 ... .96 .59 .12 .77

        .93 .92 .22 .86 .18 .26 .14 ..3 .82 ... | .91 .99 .13 .25 .97 ... .53 .84 ... ..4 | .56 ..9 .11 .45 .79 .29 .33 .40 .21 .55 | .24 100 .73 .42 .67 .98 ..7 ... ... .74 | .90 ... .70 .31 .35 ... .49 .88 .52 .76 | .81 .75 .80 ... .95 ... .71 .50 .89 .61 | ..1 .16 .17 .15 ..2 .19 .96 .59 .12 .77 | ..6 .66 ... .30 .23 .69 .78 .28 ... .57 | .58 .47 ... .60 .48 .54 .41 .43 .27 ..8 | .10 .68 .51 ... ... .62 .63 .64 ..5 .39

        ----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+----------------------------------------

        ... .94 .74 .24 100 .73 .42 ... .98 ..7 | .88 ... .76 ... .46 .70 .31 .35 .85 .49 | ... ... .61 .81 ... ... .38 .95 .37 .71 | .59 .12 ... ... .16 .17 ... ..2 .19 .96 | .28 .34 .57 ..6 .66 ... .30 ... .69 .78 | .43 ... ..8 .58 .47 .83 .60 .48 .54 .41 | .64 ... .39 .10 .68 .51 .72 .44 .62 .63 | ..3 .82 ... .93 .92 ... .86 .18 .26 .14 | .84 .20 ..4 .91 ... .13 ... .97 .36 .53 | .40 .21 .55 .56 ... ... .45 ... .29 .33

        ... .12 .77 ... .16 .17 .15 ..2 ... ... | .28 .34 ... ..6 .66 .87 .30 .23 .69 ... | .43 .27 ..8 .58 .47 .83 .60 .48 .54 .41 | .64 ..5 .39 .10 ... .51 ... .44 .62 .63 | ..3 .82 .32 .93 ... .22 .86 .18 .26 .14 | .84 ... ... .91 .99 .13 ... .97 .36 .53 | .40 .21 .55 .56 ..9 .11 .45 .79 ... .33 | .65 .94 .74 ... 100 .73 .42 .67 ... ..7 | .88 ... .76 ... .46 .70 .31 .35 .85 ... | .50 .89 .61 .81 ... .80 ... .95 .37 .71

        .64 ..5 ... .10 .68 .51 ... .44 .62 ... | ..3 ... .32 .93 .92 .22 .86 .18 ... .14 | ... ... ..4 .91 .99 .13 .25 .97 .36 .53 | .40 .21 .55 ... ... .11 .45 .79 ... ... | .65 .94 .74 .24 100 .73 .42 ... .98 ..7 | .88 .52 .76 .90 .46 .70 ... ... .85 .49 | .50 ... .61 ... .75 ... ... ... .37 .71 | .59 .12 .77 ..1 .16 .17 .15 ..2 .19 .96 | .28 ... .57 ..6 .66 .87 .30 .23 .69 .78 | .43 .27 ... .58 .47 .83 .60 .48 ... .41

        .40 .21 .55 ... ..9 .11 .45 .79 .29 .33 | ... .94 .74 .24 100 ... .42 .67 ... ... | .88 .52 .76 .90 .46 .70 .31 .35 .85 .49 | .50 .89 .61 .81 .75 .80 .38 .95 .37 .71 | .59 ... .77 ..1 .16 ... .15 ..2 .19 .96 | .28 .34 ... ..6 .66 ... .30 ... .69 .78 | .43 .27 ..8 .58 ... ... ... ... .54 ... | .64 ..5 .39 .10 .68 .51 .72 .44 ... ... | ..3 .82 .32 .93 .92 .22 ... .18 ... ... | .84 .20 ..4 .91 ... .13 .25 ... .36 .53

        .50 ... .61 .81 .75 .80 .38 .95 .37 ... | .59 .12 .77 ..1 .16 .17 .15 ..2 .19 ... | .28 .34 .57 ... .66 .87 ... .23 .69 ... | .43 .27 ..8 .58 .47 .83 .60 .48 .54 ... | ... ..5 ... .10 .68 .51 .72 .44 .62 .63 | ... .82 .32 .93 .92 .22 .86 ... .26 .14 | .84 .20 ..4 .91 .99 .13 .25 ... ... ... | .40 ... ... .56 ..9 ... .45 .79 .29 .33 | .65 .94 ... .24 100 ... .42 .67 ... ..7 | .88 .52 .76 .90 ... .70 .31 .35 .85 .49

        .43 .27 ..8 .58 .47 ... .60 .48 .54 .41 | .64 ..5 .39 ... .68 .51 ... .44 .62 ... | ..3 ... ... .93 .92 .22 .86 .18 .26 .14 | ... .20 ..4 .91 .99 .13 .25 .97 ... .53 | .40 ... ... .56 ..9 .11 .45 .79 .29 ... | .65 .94 .74 ... 100 .73 .42 .67 .98 ..7 | .88 ... .76 .90 .46 .70 .31 .35 .85 .49 | .50 .89 .61 ... ... .80 .38 ... .37 .71 | .59 .12 ... ... .16 .17 .15 ..2 .19 ... | .28 .34 ... ... .66 ... .30 ... .69 .78

        .84 ... ..4 .91 .99 .13 ... .97 .36 .53 | ... .21 .55 .56 ... ... ... .79 .29 .33 | .65 ... .74 .24 100 .73 .42 .67 .98 ..7 | ... ... .76 .90 .46 .70 .31 ... .85 .49 | ... .89 ... ... .75 .80 ... .95 .37 .71 | ... .12 .77 ..1 ... .17 .15 ... .19 .96 | .28 .34 .57 ..6 .66 .87 ... .23 .69 ... | .43 .27 ..8 ... ... .83 .60 .48 .54 .41 | .64 ..5 ... .10 .68 .51 ... ... .62 ... | ... .82 .32 ... .92 .22 .86 .18 .26 ...

        ... .52 .76 .90 .46 .70 .31 .35 .85 ... | ... .89 ... .81 .75 .80 .38 ... ... .71 | .59 ... .77 ..1 .16 .17 .15 ... ... .96 | ... .34 .57 ..6 ... .87 .30 .23 .69 ... | .43 .27 ..8 ... .47 .83 .60 ... .54 .41 | ... ..5 .39 .10 .68 .51 .72 .44 .62 .63 | ..3 ... .32 .93 ... .22 .86 .18 ... ... | .84 .20 ..4 .91 .99 .13 .25 .97 .36 .53 | .40 .21 .55 ... ..9 .11 .45 ... .29 ... | .65 .94 ... .24 100 .73 .42 .67 .98 ...

        .28 .34 .57 ..6 ... .87 .30 ... .69 ... | ... .27 ..8 .58 .47 ... ... ... .54 .41 | .64 ..5 .39 .10 ... ... .72 .44 ... ... | ... ... .32 ... .92 .22 .86 ... ... .14 | ... .20 ..4 .91 .99 .13 .25 ... .36 .53 | .40 .21 .55 .56 ... ... ... .79 ... .33 | ... .94 .74 .24 100 .73 .42 ... .98 ... | ... .52 ... .90 .46 ... .31 .35 ... .49 | .50 .89 .61 .81 .75 .80 .38 .95 .37 .71 | .59 .12 .77 ..1 .16 .17 ... ..2 .19 .96

        ..3 .82 .32 .93 .92 .22 .86 ... ... .14 | .84 .20 ... .91 .99 .13 .25 .97 ... .53 | .40 .21 .55 ... ..9 .11 .45 .79 .29 .33 | .65 .94 .74 .24 100 .73 .42 ... .98 ... | ... .52 ... .90 ... .70 .31 .35 .85 .49 | .50 .89 .61 ... .75 .80 .38 .95 ... .71 | .59 .12 .77 ... ... .17 .15 ..2 .19 ... | .28 .34 .57 ..6 .66 .87 .30 .23 .69 .78 | .43 .27 ..8 .58 .47 .83 .60 .48 .54 ... | ... ..5 ... ... .68 .51 .72 .44 ... .63
      `;
      expect(board.prettyPrint()).toEqual(dedent(expected));
    });
  });

  describe('jsonPrint', () => {
    test('Prints solved 9x9 board', () => {
      const board = buildBoard(solvedBoard);
      expect(board.jsonPrint()).toEqual(JSON.stringify(solvedBoard));
    });

    test('Prints unsolved 9x9 board', () => {
      const board = buildBoard(validBoard);
      expect(board.jsonPrint()).toEqual(JSON.stringify(validBoard));
    });

    test('Prints solved 4x4 board', () => {
      const board = buildBoard(solvedFourByFourBoard);
      expect(board.jsonPrint()).toEqual(JSON.stringify(solvedFourByFourBoard));
    });

    test('Prints unsolved 4x4 board', () => {
      const board = buildBoard(fourByFourBoard);
      expect(board.jsonPrint()).toEqual(JSON.stringify(fourByFourBoard));
    });

    test('Prints solved 16x16 board', () => {
      const board = buildBoard(solvedSixteenBySixteenBoard);
      expect(board.jsonPrint()).toEqual(
        JSON.stringify(solvedSixteenBySixteenBoard)
      );
    });

    test('Prints 16x16 board', () => {
      const board = buildBoard(sixteenBySixteenBoard);
      expect(board.jsonPrint()).toEqual(JSON.stringify(sixteenBySixteenBoard));
    });
  });
});
