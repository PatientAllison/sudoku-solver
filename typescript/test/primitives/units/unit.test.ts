import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { Coordinates, UnitType } from '../../../src/types';
import { Unit } from '../../../src/primitives/units/unit';
import { validBox, validColumn, validRow } from '../../fixtures';

const mockIsSquare = vi.hoisted(() => vi.fn());

vi.mock('../../src/utils.js', () => {
  return {
    isSquarePositiveInteger: mockIsSquare,
  };
});

describe('Unit (constructor validation)', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Valid Units', () => {
    beforeEach(() => {
      mockIsSquare.mockReturnValue(true);
    });

    test('Valid row, pre-sorted', () => {
      const unitType = UnitType.Row;

      const row = new Unit({ unitType, cellCoords: validRow });
      // constructor didn't throw, check properties
      expect(row.unitType).toEqual(unitType);
      for (let i = 0; i < row.cellCoords.length; i++) {
        expect(row.cellCoords[i]).toEqual(validRow[i]);
      }
      expect(row.topLeftIndex).toEqual(validRow[0]);
    });

    test('Valid row, shuffled', () => {
      const unitType = UnitType.Row;

      const row = new Unit({
        unitType,
        cellCoords: shuffleCells(validRow),
      });
      // constructor didn't throw, check properties
      expect(row.unitType).toEqual(unitType);
      for (let i = 0; i < row.cellCoords.length; i++) {
        expect(row.cellCoords[i]).toEqual(validRow[i]);
      }
      expect(row.topLeftIndex).toEqual(validRow[0]);
    });

    test('Valid column, pre-sorted', () => {
      const unitType = UnitType.Column;

      const column = new Unit({
        unitType,
        cellCoords: validColumn,
      });
      // constructor didn't throw, check properties
      expect(column.unitType).toEqual(unitType);
      for (let i = 0; i < column.cellCoords.length; i++) {
        expect(column.cellCoords[i]).toEqual(validColumn[i]);
      }
      expect(column.topLeftIndex).toEqual(validColumn[0]);
    });

    test('Valid column, shuffled', () => {
      const unitType = UnitType.Column;

      const column = new Unit({
        unitType,
        cellCoords: shuffleCells(validColumn),
      });
      // constructor didn't throw, check properties
      expect(column.unitType).toEqual(unitType);
      for (let i = 0; i < column.cellCoords.length; i++) {
        expect(column.cellCoords[i]).toEqual(validColumn[i]);
      }
      expect(column.topLeftIndex).toEqual(validColumn[0]);
    });

    test('Valid box, pre-sorted', () => {
      const unitType = UnitType.Box;

      const box = new Unit({ unitType, cellCoords: validBox });
      // constructor didn't throw, check properties
      expect(box.unitType).toEqual(unitType);
      for (let i = 0; i < box.cellCoords.length; i++) {
        expect(box.cellCoords[i]).toEqual(validBox[i]);
      }
      expect(box.topLeftIndex).toEqual(validBox[0]);
    });

    test('Valid box, shuffled', () => {
      const unitType = UnitType.Box;

      const box = new Unit({
        unitType,
        cellCoords: shuffleCells(validBox),
      });
      // constructor didn't throw, check properties
      expect(box.unitType).toEqual(unitType);
      for (let i = 0; i < box.cellCoords.length; i++) {
        expect(box.cellCoords[i]).toEqual(validBox[i]);
      }
      expect(box.topLeftIndex).toEqual(validBox[0]);
    });
  });

  describe('Invalid Units', () => {
    describe('Non-square cellCoord arrays', () => {
      const errorRegex = /Cell count must be a square positive integer!/;
      beforeEach(() => {
        mockIsSquare.mockReturnValue(false);
      });

      test('Empty array is not square', () => {
        const cellCoords: Coordinates[] = [];
        expect(() => new Unit({ unitType: UnitType.Row, cellCoords })).toThrow(
          errorRegex
        );
      });

      test('Non-square positive coordinates count fails', () => {
        const cellCoords: Coordinates[] = [
          { col: 0, row: 0 },
          { col: 1, row: 0 },
          { col: 2, row: 0 },
        ];
        expect(
          () => new Unit({ unitType: UnitType.Column, cellCoords })
        ).toThrow(errorRegex);
      });
    });

    describe('Invalid rows', () => {
      beforeEach(() => {
        mockIsSquare.mockReturnValue(true);
      });

      test('Not all coords have the same row value', () => {
        expect(
          () => new Unit({ unitType: UnitType.Row, cellCoords: validColumn })
        ).toThrow(/ROW coords are not in the same row!/);
      });

      test('Row value out of bounds of board', () => {
        const cellCoords: Coordinates[] = [
          { col: 0, row: 9 }, // Out of bounds!
          { col: 1, row: 9 },
          { col: 2, row: 9 },
          { col: 3, row: 9 },
          { col: 4, row: 9 },
          { col: 5, row: 9 },
          { col: 6, row: 9 },
          { col: 7, row: 9 },
          { col: 8, row: 9 },
        ];
        expect(() => new Unit({ unitType: UnitType.Row, cellCoords })).toThrow(
          /ROW index is greater than cell count!/
        );
      });

      test('Col values have duplicates', () => {
        const cellCoords: Coordinates[] = [
          { col: 0, row: 0 },
          { col: 0, row: 0 }, // Duplicate!
          { col: 2, row: 0 },
          { col: 3, row: 0 },
          { col: 4, row: 0 },
          { col: 5, row: 0 },
          { col: 6, row: 0 },
          { col: 7, row: 0 },
          { col: 8, row: 0 },
        ];
        expect(() => new Unit({ unitType: UnitType.Row, cellCoords })).toThrow(
          /Validation of column values in a ROW failed!/
        );
      });

      test('Col values do not start at 0', () => {
        const cellCoords: Coordinates[] = [
          { col: 1, row: 0 }, // Starts at 1!
          { col: 2, row: 0 },
          { col: 3, row: 0 },
          { col: 4, row: 0 },
          { col: 5, row: 0 },
          { col: 6, row: 0 },
          { col: 7, row: 0 },
          { col: 8, row: 0 },
          { col: 9, row: 0 },
        ];
        expect(() => new Unit({ unitType: UnitType.Row, cellCoords })).toThrow(
          /Validation of column values in a ROW failed!/
        );
      });

      test('Col values are non-consecutive', () => {
        const cellCoords: Coordinates[] = [
          { col: 0, row: 0 },
          { col: 1, row: 0 },
          { col: 2, row: 0 },
          { col: 3, row: 0 },
          { col: 4, row: 0 },
          { col: 5, row: 0 },
          { col: 6, row: 0 },
          { col: 7, row: 0 },
          { col: 10, row: 0 }, // Jumps from 7 to 10!
        ];
        expect(() => new Unit({ unitType: UnitType.Row, cellCoords })).toThrow(
          /Validation of column values in a ROW failed!/
        );
      });
    });

    describe('Invalid columns', () => {
      beforeEach(() => {
        mockIsSquare.mockReturnValue(true);
      });

      test('Not all coords have the same column value', () => {
        expect(
          () => new Unit({ unitType: UnitType.Column, cellCoords: validRow })
        ).toThrow(/COLUMN coords are not in the same column!/);
      });

      test('Col value out of bounds of board', () => {
        const cellCoords: Coordinates[] = [
          { col: 9, row: 0 }, // Out of bounds!
          { col: 9, row: 1 },
          { col: 9, row: 2 },
          { col: 9, row: 3 },
          { col: 9, row: 4 },
          { col: 9, row: 5 },
          { col: 9, row: 6 },
          { col: 9, row: 7 },
          { col: 9, row: 8 },
        ];
        expect(
          () => new Unit({ unitType: UnitType.Column, cellCoords })
        ).toThrow(/COLUMN index is greater than cell count!/);
      });

      test('Row values have duplicates', () => {
        const cellCoords: Coordinates[] = [
          { col: 0, row: 0 },
          { col: 0, row: 0 }, // Duplicate!
          { col: 0, row: 2 },
          { col: 0, row: 3 },
          { col: 0, row: 4 },
          { col: 0, row: 5 },
          { col: 0, row: 6 },
          { col: 0, row: 7 },
          { col: 0, row: 8 },
        ];
        expect(
          () => new Unit({ unitType: UnitType.Column, cellCoords })
        ).toThrow(/Validation of row values in a COLUMN failed!/);
      });

      test('Row values do not start at 0', () => {
        const cellCoords: Coordinates[] = [
          { col: 0, row: 1 }, // Starts at 1!
          { col: 0, row: 2 },
          { col: 0, row: 3 },
          { col: 0, row: 4 },
          { col: 0, row: 5 },
          { col: 0, row: 6 },
          { col: 0, row: 7 },
          { col: 0, row: 8 },
          { col: 0, row: 9 },
        ];
        expect(
          () => new Unit({ unitType: UnitType.Column, cellCoords })
        ).toThrow(/Validation of row values in a COLUMN failed!/);
      });

      test('Row values are non-consecutive', () => {
        const cellCoords: Coordinates[] = [
          { col: 0, row: 0 },
          { col: 0, row: 1 },
          { col: 0, row: 2 },
          { col: 0, row: 3 },
          { col: 0, row: 4 },
          { col: 0, row: 5 },
          { col: 0, row: 6 },
          { col: 0, row: 7 },
          { col: 0, row: 10 }, // Jumps from 7 to 10!
        ];
        expect(
          () => new Unit({ unitType: UnitType.Column, cellCoords })
        ).toThrow(/Validation of row values in a COLUMN failed!/);
      });
    });

    describe('Invalid boxes', () => {
      beforeEach(() => {
        mockIsSquare.mockReturnValue(true);
      });

      test('Duplicate coords are invalid', () => {
        const cellCoords: Coordinates[] = [
          { col: 0, row: 0 },
          { col: 0, row: 0 }, // Duplicate!
          { col: 2, row: 0 },
          { col: 0, row: 1 },
          { col: 1, row: 1 },
          { col: 2, row: 1 },
          { col: 0, row: 2 },
          { col: 1, row: 2 },
          { col: 2, row: 2 },
        ];
        expect(() => new Unit({ unitType: UnitType.Box, cellCoords })).toThrow(
          /Not all cell coordinates are unique!/
        );
      });

      test('Horizontally misaligned box is invalid', () => {
        const cellCoords: Coordinates[] = [
          { col: 1, row: 0 },
          { col: 2, row: 0 },
          { col: 3, row: 0 },
          { col: 1, row: 1 },
          { col: 2, row: 1 },
          { col: 3, row: 1 },
          { col: 1, row: 2 },
          { col: 2, row: 2 },
          { col: 3, row: 2 },
        ];
        expect(() => new Unit({ unitType: UnitType.Box, cellCoords })).toThrow(
          /Box is not aligned with the overall board!/
        );
      });

      test('Vertically misaligned box is invalid', () => {
        const cellCoords: Coordinates[] = [
          { col: 0, row: 1 },
          { col: 1, row: 1 },
          { col: 2, row: 1 },
          { col: 0, row: 2 },
          { col: 1, row: 2 },
          { col: 2, row: 2 },
          { col: 0, row: 3 },
          { col: 1, row: 3 },
          { col: 2, row: 3 },
        ];
        expect(() => new Unit({ unitType: UnitType.Box, cellCoords })).toThrow(
          /Box is not aligned with the overall board!/
        );
      });

      test('Subsequent columns cannot be less than first column', () => {
        const cellCoords: Coordinates[] = [
          // These are from box [0, 1]
          { col: 3, row: 0 },
          { col: 4, row: 0 },
          { col: 5, row: 0 },
          // These are from box [0, 0]
          { col: 0, row: 1 },
          { col: 1, row: 1 },
          { col: 2, row: 1 },
          { col: 0, row: 2 },
          { col: 1, row: 2 },
          { col: 2, row: 2 },
        ];
        expect(() => new Unit({ unitType: UnitType.Box, cellCoords })).toThrow(
          /Cell column is less than first cell's column!/
        );
      });

      test('Subsequent columns cannot be greater than maxCol', () => {
        const cellCoords: Coordinates[] = [
          // These are from box [0, 1]
          { col: 3, row: 0 },
          { col: 4, row: 0 },
          { col: 5, row: 0 },
          // These are from box [0, 2]
          { col: 6, row: 1 },
          { col: 7, row: 1 },
          { col: 8, row: 1 },
          { col: 6, row: 2 },
          { col: 7, row: 2 },
          { col: 8, row: 2 },
        ];
        expect(() => new Unit({ unitType: UnitType.Box, cellCoords })).toThrow(
          /Cell column is too high to be in the same box as the first column!/
        );
      });

      test('Subsequent rows cannot be greater than maxRow', () => {
        const cellCoords: Coordinates[] = [
          // These are from box [1, 0]
          { col: 0, row: 3 },
          { col: 1, row: 3 },
          { col: 2, row: 3 },
          // These are from box [2, 0]
          { col: 0, row: 6 },
          { col: 1, row: 6 },
          { col: 2, row: 6 },
          { col: 0, row: 7 },
          { col: 1, row: 7 },
          { col: 2, row: 7 },
        ];
        expect(() => new Unit({ unitType: UnitType.Box, cellCoords })).toThrow(
          /Cell row is too high to be in the same box as the first row!/
        );
      });
    });

    describe('toString', () => {
      test('Row', () => {
        const row = new Unit({ unitType: UnitType.Row, cellCoords: validRow });
        expect(row.toString()).toEqual('{ UnitType: ROW, Row: 0 }');
      });

      test('Column', () => {
        const column = new Unit({
          unitType: UnitType.Column,
          cellCoords: validColumn,
        });
        expect(column.toString()).toEqual('{ UnitType: COLUMN, Column: 0 }');
      });

      test('Box', () => {
        const box = new Unit({ unitType: UnitType.Box, cellCoords: validBox });
        expect(box.toString()).toEqual('{ UnitType: BOX, Row: 0, Column: 0 }');
      });
    });
  });
});

const shuffleCells = (cellCoords: Coordinates[]) => {
  // Clone array, do not modify original to keep test state consistent
  const shuffledCells = [...cellCoords];
  for (let i = shuffledCells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledCells[i], shuffledCells[j]] = [shuffledCells[j], shuffledCells[i]];
  }

  return shuffledCells;
};
