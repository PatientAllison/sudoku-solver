import { describe, expect, test, vi } from 'vitest';
import { parse, parseFromFile } from '../src/parser';
import { validBoard } from './fixtures';
import jsonData from '../../resources/puzzleInputs/16x16/easy/0.json' with { type: 'json' };

const mockReadFile = vi.hoisted(() => vi.fn());

vi.mock('fs', () => {
  return {
    readFileSync: mockReadFile,
  };
});

describe('parser', () => {
  describe('parse', () => {
    test('Successfully parses valid board', () => {
      const board = parse(JSON.stringify(validBoard));
      // Don't bother validating all board fields, we already do that in the Board tests
      expect(board).toBeDefined();
    });

    test('Throws error if string is not valid json', () => {
      expect(() => parse('Not JSON')).toThrow(/is not valid json!/);
    });

    test('Throws error if json is not an array', () => {
      const obj = { someProp: 'someValue' };
      expect(() => parse(JSON.stringify(obj))).toThrow(/is not a valid array!/);
    });

    test('Throws error if json is an empty array', () => {
      const arr: never[] = [];
      expect(() => parse(JSON.stringify(arr))).toThrow(
        /Parsed array is empty!/
      );
    });

    test('Throws error if json is a flat array', () => {
      const arr = [0];
      expect(() => parse(JSON.stringify(arr))).toThrow(
        /Parsed object is not an array of arrays!/
      );
    });

    test('Throws error if elements are not numbers', () => {
      const arr = [['string']];

      expect(() => parse(JSON.stringify(arr))).toThrow(
        /Not all inner array elements are integers!/
      );
    });

    test('Throws error if elements are not integers', () => {
      const arr = [[0.5]];

      expect(() => parse(JSON.stringify(arr))).toThrow(
        /Not all inner array elements are integers!/
      );
    });
  });

  describe('parseFromFile', () => {
    test('Successfully parses valid board', () => {
      mockReadFile.mockReturnValueOnce(JSON.stringify(jsonData));
      const board = parseFromFile(
        '../../resources/puzzleInputs/16x16/easy/0.json'
      );
      // Don't bother validating all board fields, we already do that in the Board tests
      expect(board).toBeDefined();
    });

    test('Throws error when file fails to read', () => {
      mockReadFile.mockImplementationOnce(() => {
        throw new Error('File not found');
      });
      expect(() =>
        parseFromFile('../../resources/puzzleInputs/16x16/easy/0.json')
      ).toThrow(/Failed to read file/);
    });
  });
});
