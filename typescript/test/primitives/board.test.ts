import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  buildCells,
  validBoard,
  wideBoard as tallBoard,
  nonSquareBoard,
  rowConflict,
  columnConflict,
  boxConflict,
} from '../fixtures';
import { Board } from '../../src/primitives/board';
import { Cell } from '../../src/primitives/cell';

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
      const cells = buildCells(rowConflict);
      const board = new Board({ cells });
      expect(() => board.validate()).toThrow(
        'Board is invalid! Violations: [ { Violated Unit: { UnitType: ROW'
      );
    });

    test('column conflict throws error', () => {
      const cells = buildCells(columnConflict);
      const board = new Board({ cells });
      expect(() => board.validate()).toThrow(
        'Board is invalid! Violations: [ { Violated Unit: { UnitType: COLUMN'
      );
    });

    test('box conflict throws error', () => {
      const cells = buildCells(boxConflict);
      const board = new Board({ cells });
      expect(() => board.validate()).toThrow(
        'Board is invalid! Violations: [ { Violated Unit: { UnitType: BOX'
      );
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
});
