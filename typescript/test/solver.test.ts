import { describe, expect, test } from 'vitest';
import { solveWithBackTracking } from '../src/solver';
import {
  buildBoard,
  validBoard,
  solvedBoard,
  rowConflict,
  unsolvableBoard,
} from './fixtures';

describe('solveWithBacktracking', () => {
  test('Solvable board is solved', () => {
    const board = buildBoard(validBoard);
    const solvedCells = solveWithBackTracking(board).cells;
    const solvedValues = solvedCells.map((row) =>
      row.map((cell) => cell.getValue())
    );
    expect(solvedValues).toEqual(solvedBoard);
  });

  test('Invalid board throws validation error', () => {
    const board = buildBoard(rowConflict);
    expect(() => solveWithBackTracking(board)).toThrow(/Board is invalid!/);
  });

  test('Unsolvable but not conflicting board throws unsolvable error', () => {
    const board = buildBoard(unsolvableBoard);
    expect(() => solveWithBackTracking(board)).toThrow(
      /All candidates exhausted! Board is unsolvable!/
    );
  });
});
