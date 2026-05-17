import { beforeEach, describe, expect, test, vi } from 'vitest';
import { Cell } from '../../src/primitives/cell.js';

const mockIsSquare = vi.hoisted(() => vi.fn());
const mockIsPositive = vi.hoisted(() => vi.fn());

vi.mock('../../src/utils.js', () => {
  return {
    isSquarePositiveInteger: mockIsSquare,
    isPositiveInteger: mockIsPositive,
  };
});

describe('Cell', () => {
  let cell: Cell;
  const coordinates = {
    row: 0,
    col: 1,
  };
  const unitSize = 9;
  const givenValue = 5;
  mockIsSquare.mockReturnValue(true);
  mockIsPositive.mockReturnValue(true);

  beforeEach(() => {
    cell = new Cell({
      coordinates,
      unitSize,
    });
  });

  describe('Basic variable access', () => {
    test('Variables are accessible when no value is given', () => {
      const expectedCandidates = new Set<number>();
      for (let i = 1; i <= unitSize; i++) {
        expectedCandidates.add(i);
      }

      expect(cell.coordinates).toEqual(coordinates);
      expect(cell.isGiven).toEqual(false);
      expect(cell.getCandidates()).toEqual(expectedCandidates);
      expect(cell.getValue()).toBeUndefined();
    });

    test('Variables are accessible when a value is given', () => {
      cell = new Cell({
        coordinates,
        unitSize,
        givenValue,
      });

      expect(cell.coordinates).toEqual(coordinates);
      expect(cell.isGiven).toEqual(true);
      expect(cell.getCandidates()).toEqual(new Set([givenValue]));
      expect(cell.getValue()).toEqual(givenValue);
    });
  });

  describe('Constructor validations', () => {
    test('Non-square unit size throws an error', () => {
      mockIsSquare.mockReturnValueOnce(false);

      expect(
        () =>
          new Cell({
            coordinates,
            unitSize: 10,
          })
      ).toThrow(/Unit size must be a square postitive integer!/);
    });

    test('Column out of bounds throws an error', () => {
      expect(
        () =>
          new Cell({
            coordinates: {
              col: 9,
              row: 0,
            },
            unitSize: 9,
          })
      ).toThrow(/Column is greater than or equal to unit size!/);
    });

    test('Row out of bounds throws an error', () => {
      expect(
        () =>
          new Cell({
            coordinates: {
              col: 0,
              row: 10,
            },
            unitSize: 9,
          })
      ).toThrow('Row is greater than or equal to unit size!');
    });

    test('Given non-positive value throws an error', () => {
      mockIsPositive.mockReturnValueOnce(false);

      expect(
        () =>
          new Cell({
            coordinates,
            unitSize: 9,
            givenValue: -0.5,
          })
      ).toThrow(/Cannot set a value that is not a positive integer!/);
    });

    test('Given value too large throws an error', () => {
      expect(
        () =>
          new Cell({
            coordinates,
            unitSize: 9,
            givenValue: 10,
          })
      ).toThrow(/Cannot set a value larger than the unit size!/);
    });
  });

  describe('removeCandidate', () => {
    test('Candidate is removed from candidate set', () => {
      const valueToRemove = 5;

      cell.removeCandidate(valueToRemove);

      expect(cell.getCandidates()).not.toContain(valueToRemove);
    });
  });

  describe('setValue', () => {
    test('Attempting to set value for a cell with a different value throws an error', () => {
      cell = new Cell({
        coordinates,
        unitSize,
        givenValue,
      });

      expect(() => cell.setValue(4)).toThrow(
        /This cell already has a different value!/
      );
    });

    test('Attempting to set non-positive value throws an error', () => {
      mockIsPositive.mockReturnValueOnce(false);
      expect(() => cell.setValue(-0.5)).toThrow(
        /Cannot set a value that is not a positive integer!/
      );
    });

    test('Attempting to set a value larger than the unit size throws an error', () => {
      expect(() => cell.setValue(10)).toThrow(
        /Cannot set a value larger than the unit size!/
      );
    });

    test('Attempting to set a value not in the candidates list throws an error', () => {
      const valueToSet = 3;
      cell.removeCandidate(valueToSet);
      expect(() => cell.setValue(valueToSet)).toThrow(
        /Cannot set a value that is not a valid candidate for the cell!/
      );
    });

    test('Set value if value is valid and not already set', () => {
      const valueToSet = 4;
      const expectedCandidates = new Set([valueToSet]);

      cell.setValue(valueToSet);
      expect(cell.getValue()).toEqual(valueToSet);
      expect(cell.getCandidates()).toEqual(expectedCandidates);
    });

    test('setValue is no-op if attempting to set the same valid value', () => {
      const expectedCandidates = new Set([givenValue]);

      cell = new Cell({
        coordinates,
        unitSize,
        givenValue,
      });

      cell.setValue(givenValue);
      expect(cell.getValue()).toEqual(givenValue);
      expect(cell.getCandidates()).toEqual(expectedCandidates);
    });
  });

  describe('clone', () => {
    test('clone creates equivalent cell without a value', () => {
      const clone = cell.clone();

      expect(clone).toEqual(cell);
    });

    test('clone creates equivalent cell with a given value', () => {
      const expectedCandidates = new Set([givenValue]);

      cell = new Cell({
        coordinates,
        unitSize,
        givenValue,
      });

      const clone = cell.clone();

      expect(clone).toEqual(cell);
      expect(clone.isGiven).toEqual(true);
      expect(clone.getValue()).toEqual(givenValue);
      expect(clone.getCandidates()).toEqual(expectedCandidates);
    });

    test('clone creates equivalent cell with a non-given value', () => {
      const expectedCandidates = new Set([givenValue]);

      cell.setValue(givenValue);
      const clone = cell.clone();

      expect(clone).toEqual(cell);
      expect(clone.isGiven).toEqual(false);
      expect(clone.getValue()).toEqual(givenValue);
      expect(clone.getCandidates()).toEqual(expectedCandidates);
    });

    test('clone has same candidates as original', () => {
      const candidateToRemove = 1;

      cell.removeCandidate(candidateToRemove);
      const clone = cell.clone();

      expect(clone).toEqual(cell);
      expect(clone.getCandidates()).not.toContain(candidateToRemove);
    });

    test('operations on clone do not affect original', () => {
      const candidateToRemove = 1;
      const valueToSet = 2;

      const clone = cell.clone();

      clone.removeCandidate(candidateToRemove);

      expect(cell.getCandidates()).toContain(candidateToRemove);

      clone.setValue(valueToSet);

      expect(cell.getValue()).toBeUndefined();
      expect(cell.getCandidates().size).toBeGreaterThan(1);
    });

    test('operations on original do not affect clone', () => {
      const candidateToRemove = 1;
      const valueToSet = 2;

      const clone = cell.clone();

      cell.removeCandidate(candidateToRemove);

      expect(clone.getCandidates()).toContain(candidateToRemove);

      cell.setValue(valueToSet);

      expect(clone.getValue()).toBeUndefined();
      expect(clone.getCandidates().size).toBeGreaterThan(1);
    });
  });
});
