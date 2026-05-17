import { Coordinates, UnitType } from '../../types.js';
import { Unit } from './unit.js';

/**
 * Params for constructing a box
 */
export interface BoxParams {
  cellCoords: Coordinates[];
}

/**
 * Wrapper class around unit specifically for constructing a box
 */
export class Box extends Unit {
  /**
   * Constructs a box. Validation is performed in the parent constructor.
   * @param params cell coordinates
   * @throws if box is invalid somehow
   */
  constructor(params: BoxParams) {
    super({
      unitType: UnitType.Box,
      cellCoords: params.cellCoords,
    });
  }
}
