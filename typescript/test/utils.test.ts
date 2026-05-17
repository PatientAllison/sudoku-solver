import { describe, expect, test } from 'vitest';
import { isSquarePositiveInteger } from '../src/utils.js';

describe('Utils', () => {
  describe('isSquarePositiveInteger', () => {
    test('Returns false for negative number', () => {
      expect(isSquarePositiveInteger(-4)).toBe(false);
    });

    test('Returns false for non-integer number', () => {
      expect(isSquarePositiveInteger(2.5)).toBe(false);
    });

    test('Returns false for non-square integer', () => {
      expect(isSquarePositiveInteger(3)).toBe(false);
    });

    test('Returns true for square postive integer', () => {
      expect(isSquarePositiveInteger(9)).toBe(true);
    });

    test('Returns true for very large squares', () => {
      expect(isSquarePositiveInteger(2 ** (2 ** (2 ** 2)))).toBe(true);
    });
  });
});
