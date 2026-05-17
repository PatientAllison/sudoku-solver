import { Coordinates, UnitType } from '../../types.js';
import { Unit } from './unit.js';

/**
 * Params for constructing a row
 */
export interface RowParams {
  cellCoords: Coordinates[];
}

/**
 * Wrapper class around unit specifically for constructing a row
 */
export class Row extends Unit {
  /**
   * Constructs a row. Validation is performed in the parent constructor.
   * @param params cell coordinates
   * @throws if row is invalid somehow
   */
  constructor(params: RowParams) {
    super({
      unitType: UnitType.Row,
      cellCoords: params.cellCoords,
    });
  }
}
