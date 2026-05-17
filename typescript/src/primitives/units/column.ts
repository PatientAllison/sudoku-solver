import { Coordinates, UnitType } from '../../types.js';
import { Unit } from './unit.js';

export interface ColumnParams {
  cellCoords: Coordinates[];
}

export class Column extends Unit {
  constructor(params: ColumnParams) {
    super({
      unitType: UnitType.Column,
      cellCoords: params.cellCoords,
    });
  }
}
