import { Coordinates, UnitType } from '../../types.js';
import { Unit } from './unit.js';

export interface RowParams {
  cellCoords: Coordinates[];
}

export class Row extends Unit {
  constructor(params: RowParams) {
    super({
      unitType: UnitType.Row,
      cellCoords: params.cellCoords,
    });
  }
}
