import { describe, expect, test } from 'vitest';
import { Row } from '../../../src/primitives/units/row';
import { validRow } from '../../fixtures';
import { UnitType } from '../../../src/types';

describe('Row', () => {
  // Minimal tests, most of the validation lives on the Unit class
  // and are tested by its tests, this is just a wrapper class
  test('Valid row', () => {
    const row = new Row({ cellCoords: validRow });
    // constructor didn't throw, check properties
    for (let i = 0; i < row.cellCoords.length; i++) {
      expect(row.cellCoords[i]).toEqual(validRow[i]);
    }
    expect(row.unitType).toEqual(UnitType.Row);
    expect(row.cellCoords).toEqual(validRow);
    expect(row.topLeftIndex).toEqual(validRow[0]);
  });
});
