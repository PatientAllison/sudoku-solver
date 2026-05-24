import { describe, expect, test } from 'vitest';
import { solveWithBackTracking, solveWithLogic } from '../src/solver';
import {
  buildBoard,
  validBoard,
  solvedBoard,
  rowConflict,
  unsolvableBoard,
  hundredByHundredBoard,
  solvedHundredByHundredBoard,
  hardNineByNineBoard,
  solvedHardNineByNineBoard,
  evilNineByNineBoard,
  solvedEvilNineByNineBoard,
} from './fixtures';

describe('solver', () => {
  describe('solveWithBacktracking', () => {
    test('Easy 9x9 board is solved', () => {
      const board = buildBoard(validBoard);
      board.initializeCandidates();
      const solvedBoardWithProgress = solveWithBackTracking(board);
      const solvedCells = solvedBoardWithProgress.board.cells;
      const solvedValues = solvedCells.map((row) =>
        row.map((cell) => cell.getValue())
      );
      expect(solvedValues).toEqual(solvedBoard);
      expect(solvedBoardWithProgress.solved).toEqual(true);
      expect(solvedBoardWithProgress.progress).toBeUndefined();
    });

    test('Hard 9x9 board is solved', () => {
      const board = buildBoard(hardNineByNineBoard);
      board.initializeCandidates();
      const solvedBoardWithProgress = solveWithBackTracking(board);
      const solvedCells = solvedBoardWithProgress.board.cells;
      const solvedValues = solvedCells.map((row) =>
        row.map((cell) => cell.getValue())
      );
      expect(solvedValues).toEqual(solvedHardNineByNineBoard);
      expect(solvedBoardWithProgress.solved).toEqual(true);
      expect(solvedBoardWithProgress.progress).toBeUndefined();
    });

    test('Evil 9x9 board is solved', () => {
      const board = buildBoard(evilNineByNineBoard);
      board.initializeCandidates();
      const solvedBoardWithProgress = solveWithBackTracking(board);
      const solvedCells = solvedBoardWithProgress.board.cells;
      const solvedValues = solvedCells.map((row) =>
        row.map((cell) => cell.getValue())
      );
      expect(solvedValues).toEqual(solvedEvilNineByNineBoard);
      expect(solvedBoardWithProgress.solved).toEqual(true);
      expect(solvedBoardWithProgress.progress).toBeUndefined();
    });

    test('Easy 100x100 board is solved', () => {
      const board = buildBoard(hundredByHundredBoard);
      board.initializeCandidates();
      const solvedBoardWithProgress = solveWithBackTracking(board);
      const solvedCells = solvedBoardWithProgress.board.cells;
      const solvedValues = solvedCells.map((row) =>
        row.map((cell) => cell.getValue())
      );
      expect(solvedValues).toEqual(solvedHundredByHundredBoard);
      expect(solvedBoardWithProgress.solved).toEqual(true);
      expect(solvedBoardWithProgress.progress).toBeUndefined();
    });

    test('Already solved board is a no-op', () => {
      const board = buildBoard(solvedBoard);
      board.initializeCandidates();
      const solvedBoardWithProgress = solveWithBackTracking(board);
      const solvedCells = solvedBoardWithProgress.board.cells;
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

  describe('solveWithLogic', () => {
    test('Easy 9x9 board is solved', () => {
      const board = buildBoard(validBoard);
      board.initializeCandidates();
      const solvedBoardWithProgress = solveWithLogic(board);
      const solvedCells = solvedBoardWithProgress.board.cells;
      const solvedValues = solvedCells.map((row) =>
        row.map((cell) => cell.getValue())
      );
      expect(solvedValues).toEqual(solvedBoard);
      expect(solvedBoardWithProgress.solved).toEqual(true);
      expect(solvedBoardWithProgress.progress).toBeUndefined();
    });

    test('Hard 9x9 board is solved', () => {
      const board = buildBoard(hardNineByNineBoard);
      board.initializeCandidates();
      const solvedBoardWithProgress = solveWithLogic(board);
      const solvedCells = solvedBoardWithProgress.board.cells;
      const solvedValues = solvedCells.map((row) =>
        row.map((cell) => cell.getValue())
      );
      expect(solvedValues).toEqual(solvedHardNineByNineBoard);
      expect(solvedBoardWithProgress.solved).toEqual(true);
      expect(solvedBoardWithProgress.progress).toBeUndefined();
    });

    test('Evil 9x9 board is solved', () => {
      const board = buildBoard(evilNineByNineBoard);
      board.initializeCandidates();
      const solvedBoardWithProgress = solveWithLogic(board);
      const solvedCells = solvedBoardWithProgress.board.cells;
      const solvedValues = solvedCells.map((row) =>
        row.map((cell) => cell.getValue())
      );
      expect(solvedValues).toEqual(solvedEvilNineByNineBoard);
      expect(solvedBoardWithProgress.solved).toEqual(true);
      expect(solvedBoardWithProgress.progress).toBeUndefined();
    });

    test('Easy 100x100 board is solved', () => {
      const board = buildBoard(hundredByHundredBoard);
      board.initializeCandidates();
      const solvedBoardWithProgress = solveWithLogic(board);
      const solvedCells = solvedBoardWithProgress.board.cells;
      const solvedValues = solvedCells.map((row) =>
        row.map((cell) => cell.getValue())
      );
      expect(solvedValues).toEqual(solvedHundredByHundredBoard);
      expect(solvedBoardWithProgress.solved).toEqual(true);
      expect(solvedBoardWithProgress.progress).toBeUndefined();
    });

    test('Already solved board is a no-op', () => {
      const board = buildBoard(solvedBoard);
      board.initializeCandidates();
      const solvedBoardWithProgress = solveWithLogic(board);
      const solvedCells = solvedBoardWithProgress.board.cells;
      const solvedValues = solvedCells.map((row) =>
        row.map((cell) => cell.getValue())
      );
      expect(solvedValues).toEqual(solvedBoard);
      expect(solvedBoardWithProgress.solved).toEqual(true);
      expect(solvedBoardWithProgress.progress).toBeUndefined();
    });

    test('Invalid board throws validation error', () => {
      const board = buildBoard(rowConflict);
      expect(() => solveWithLogic(board)).toThrow(/Board is invalid!/);
    });

    test('Unsolvable but not conflicting board throws unsolvable error', () => {
      const board = buildBoard(unsolvableBoard);
      expect(() => solveWithLogic(board)).toThrow(/Board is invalid!/);
    });
  });
});
