import { Coordinates, UnitType } from '../../types.js';
import { Unit } from './unit.js';

export interface BoxParams {
  cellCoords: Coordinates[];
}

export class Box extends Unit {
  constructor(params: BoxParams) {
    super({
      unitType: UnitType.Box,
      cellCoords: params.cellCoords,
    });
  }
}
