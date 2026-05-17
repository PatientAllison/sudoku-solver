import { describe, expect, test } from 'vitest';
import { Box } from '../../../src/primitives/units/box';
import { validBox } from '../../fixtures';
import { UnitType } from '../../../src/types';

describe('Box', () => {
  // Minimal tests, most of the validation lives on the Unit class
  // and are tested by its tests, this is just a wrapper class
  test('Valid box', () => {
    const box = new Box({ cellCoords: validBox });
    // constructor didn't throw, check properties
    for (let i = 0; i < box.cellCoords.length; i++) {
      expect(box.cellCoords[i]).toEqual(validBox[i]);
    }
    expect(box.unitType).toEqual(UnitType.Box);
    expect(box.cellCoords).toEqual(validBox);
    expect(box.topLeftIndex).toEqual(validBox[0]);
  });
});
