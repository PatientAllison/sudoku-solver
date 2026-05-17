import { describe, expect, test } from 'vitest';
import { Column } from '../../../src/primitives/units/column';
import { validColumn } from '../../fixtures';
import { UnitType } from '../../../src/types';

describe('Column', () => {
  // Minimal tests, most of the validation lives on the Unit class
  // and are tested by its tests, this is just a wrapper class
  test('Valid column', () => {
    const column = new Column({ cellCoords: validColumn });
    // constructor didn't throw, check properties
    for (let i = 0; i < column.cellCoords.length; i++) {
      expect(column.cellCoords[i]).toEqual(validColumn[i]);
    }
    expect(column.unitType).toEqual(UnitType.Column);
    expect(column.cellCoords).toEqual(validColumn);
    expect(column.topLeftIndex).toEqual(validColumn[0]);
  });
});
