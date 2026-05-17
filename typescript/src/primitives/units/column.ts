import { Coordinates, UnitType } from '../../types.js';
import { Unit } from './unit.js';

/**
 * Params for constructing a column
 */
export interface ColumnParams {
  cellCoords: Coordinates[];
}

/**
 * Wrapper class around unit specifically for constructing a column
 */
export class Column extends Unit {
  /**
   * Constructs a column. Validation is performed in the parent constructor.
   * @param params cell coordinates
   * @throws if column is invalid somehow
   */
  constructor(params: ColumnParams) {
    super({
      unitType: UnitType.Column,
      cellCoords: params.cellCoords,
    });
  }
}
