import { describe, expect, test } from 'vitest';
import { hiddenSingle, nakedSingle } from '../src/techniques';
import {
  boardEligibleForHiddenSingle,
  boardEligibleForNakedSingle,
  boardNotEligibleForSingle,
  buildBoard,
} from './fixtures';

describe('techniques', () => {
  describe('nakedSingle', () => {
    test('find naked single', () => {
      const board = buildBoard(boardEligibleForNakedSingle);
      const row = 0;
      const col = 0;
      // Cell is not yet solved
      expect(board.cells[col][row].getValue()).toBeUndefined();

      board.initializeCandidates();
      const boardWithProgress = nakedSingle(board);
      expect(boardWithProgress.board.cells[row][col].getValue()).toBeDefined();
      expect(boardWithProgress.progress).toEqual(true);
    });

    test('find nothing', () => {
      const board = buildBoard(boardEligibleForHiddenSingle);
      const row = 0;
      const col = 0;
      // Cell is not yet solved
      expect(board.cells[row][col].getValue()).toBeUndefined();

      board.initializeCandidates();
      const boardWithProgress = nakedSingle(board);
      expect(
        boardWithProgress.board.cells[row][col].getValue()
      ).toBeUndefined();
      expect(boardWithProgress.progress).toEqual(false);
    });
  });

  describe('hiddenSingle', () => {
    test('find hidden single', () => {
      const board = buildBoard(boardEligibleForHiddenSingle);
      const row = 0;
      const col = 0;
      // Cell is not yet solved
      expect(board.cells[col][row].getValue()).toBeUndefined();

      board.initializeCandidates();
      const boardWithProgress = hiddenSingle(board);
      expect(boardWithProgress.board.cells[row][col].getValue()).toBeDefined();
      expect(boardWithProgress.progress).toEqual(true);
    });

    test('find nothing', () => {
      const board = buildBoard(boardNotEligibleForSingle);
      const row = 0;
      const col = 3;
      // Cell is not yet solved
      expect(board.cells[row][col].getValue()).toBeUndefined();

      board.initializeCandidates();
      const boardWithProgress = hiddenSingle(board);
      expect(boardWithProgress.board.cells[3][0].getValue()).toBeUndefined();
      expect(boardWithProgress.progress).toEqual(false);
    });
  });
});
