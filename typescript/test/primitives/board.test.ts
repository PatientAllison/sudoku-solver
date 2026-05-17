import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  buildCells,
  validBoard,
  wideBoard as tallBoard,
  nonSquareBoard,
} from '../fixtures';
import { Board } from '../../src/primitives/board';

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
  beforeEach(() => {
    mockIsSquare.mockReturnValue(true);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Board creation', () => {
    test('Valid board', () => {
      const cells = buildCells(validBoard);
      const board = new Board({ cells });
      expect(board.boxEdgeSize).toEqual(Math.sqrt(cells.length));
      expect(board.unitSize).toEqual(cells.length);
      expect(board.totalBoardSize).toEqual(cells.length * cells[0].length);
      expect(board.cells).toEqual(cells);
      // Unit assertions
      expect(board.units.length).toEqual(cells.length * 3);
      const rows = board.getRows();
      const cols = board.getColumns();
      const boxes = board.getBoxes();
      for (const filteredUnits of [rows, cols, boxes]) {
        expect(filteredUnits.length).toEqual(cells.length);
      }
      board.units.forEach((unit) =>
        expect(unit.cellCoords.length).toEqual(cells.length)
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
    const cells = buildCells(validBoard);

    test('Clone should be identical to original after creation', () => {
      const board = new Board({ cells });
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
      const board = new Board({ cells });
      const clone = board.clone();
      clone.cells[0][0].setValue(3);
      expect(board.cells[0][0].getValue()).not.toEqual(3);
    });

    test('operations on original do not affect clone', () => {
      const board = new Board({ cells });
      const clone = board.clone();
      board.cells[0][0].setValue(3);
      expect(clone.cells[0][0].getValue()).not.toEqual(3);
    });
  });
});
