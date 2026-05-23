import { describe, expect, test } from 'vitest';
import { nakedSingle } from '../src/techniques';
import {
  boardEligibleForNakedSingle,
  boardNotEligibleForNakedSingle,
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
      const board = buildBoard(boardNotEligibleForNakedSingle);
      const row = 0;
      const col = 3;
      // Cell is not yet solved
      expect(board.cells[row][col].getValue()).toBeUndefined();

      board.initializeCandidates();
      const boardWithProgress = nakedSingle(board);
      expect(boardWithProgress.board.cells[3][0].getValue()).toBeUndefined();
      expect(boardWithProgress.progress).toEqual(false);
    });
  });
});
