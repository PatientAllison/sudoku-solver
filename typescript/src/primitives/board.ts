import { Coordinates, UnitType } from '../types.js';
import { isSquarePositiveInteger } from '../utils.js';
import { Cell } from './cell.js';
import { Box } from './units/box.js';
import { Column } from './units/column.js';
import { Row } from './units/row.js';
import { Unit } from './units/unit.js';

/**
 * Params for constructing a Board
 */
export interface BoardParams {
  cells: Cell[][];
}

export class Board {
  // Box edge size for easy lookup
  readonly boxEdgeSize: number;
  // Unit size for easy lookup
  readonly unitSize: number;
  // Total board size for easy lookup
  readonly totalBoardSize: number;
  // Cells contained within the board
  readonly cells: Cell[][];
  // Units contained within the board
  readonly units: Unit[];

  constructor(params: BoardParams) {
    const { cells } = params;
    // Validations
    // Check cells 2D array for individual side lengths
    if (!isSquarePositiveInteger(cells.length)) {
      throw new Error(`Height is not a square! Given height: ${cells.length}`);
    }

    // We already validated this was a positive integer above, non-null access is safe
    if (!isSquarePositiveInteger(cells[0]!.length)) {
      throw new Error(
        `Width is not a square! Given width: ${cells[0]!.length}`
      );
    }

    if (cells.length !== cells[0]!.length) {
      throw new Error(
        'Width and height are not the same! Board is not a square! ' +
          `Height: ${cells.length} ` +
          `Width: ${cells[0]!.length}`
      );
    }

    this.boxEdgeSize = Math.sqrt(cells.length);
    this.unitSize = cells.length;
    this.totalBoardSize = cells.length * cells[0]!.length;
    this.cells = cells;
    this.units = this.buildUnits();
  }

  private buildUnits() {
    const rowCoords: Coordinates[][] = Array.from(
      { length: this.unitSize },
      () => []
    );
    const colCoords: Coordinates[][] = Array.from(
      { length: this.unitSize },
      () => []
    );
    const boxCoords: Coordinates[][] = Array.from(
      { length: this.unitSize },
      () => []
    );

    for (let row = 0; row < this.cells.length; row++) {
      for (let col = 0; col < this.cells[row]!.length; col++) {
        const coords: Coordinates = {
          col,
          row,
        };

        const boxRow = Math.floor(row / this.boxEdgeSize);
        const boxCol = Math.floor(col / this.boxEdgeSize);
        const boxIndex = boxRow * this.boxEdgeSize + boxCol;

        // We pre-initialized these arrays, so the non-null accesses are safe
        rowCoords[row]!.push(coords);
        colCoords[col]!.push(coords);
        boxCoords[boxIndex]!.push(coords);
      }
    }

    const units: Unit[] = [];

    for (const row of rowCoords) {
      units.push(new Row({ cellCoords: row }));
    }

    for (const col of colCoords) {
      units.push(new Column({ cellCoords: col }));
    }

    for (const box of boxCoords) {
      units.push(new Box({ cellCoords: box }));
    }

    return units;
  }

  public clone() {
    const clonedCells = this.cells.map((row) =>
      row.map((cell) => cell.clone())
    );
    return new Board({ cells: clonedCells });
  }

  public getRows() {
    return this.units.filter((unit) => unit.unitType === UnitType.Row) as Row[];
  }

  public getColumns() {
    return this.units.filter(
      (unit) => unit.unitType === UnitType.Column
    ) as Column[];
  }

  public getBoxes() {
    return this.units.filter((unit) => unit.unitType === UnitType.Box) as Box[];
  }

  public validate() {
    const violations = new Map<Unit, Cell[]>();

    this.units.forEach((unit) => {
      const cells = this.getCellsForUnit(unit);

      const duplicatesMap = new Map<number, Cell[]>();
      cells.forEach((cell) => {
        const value = cell.getValue();
        if (value === undefined) {
          return;
        }
        const coordinatesWithValue: Cell[] = duplicatesMap.get(value) ?? [];
        coordinatesWithValue.push(cell);
        duplicatesMap.set(value, coordinatesWithValue);
      });

      duplicatesMap.values().forEach((cells) => {
        if (cells.length > 1) {
          violations.set(unit, cells);
        }
      });
    });

    if (violations.size > 0) {
      const stringifiedViolations = Array.from(
        violations.entries().map((entry) => {
          const stringifiedUnit = entry[0].toString();

          const stringifiedCells = entry[1]
            .map((cell) => cell.toString())
            .join(', ');

          return `{ Violated Unit: ${stringifiedUnit}, Violated Cells: ${stringifiedCells} }`;
        })
      );

      throw new Error(
        `Board is invalid! Violations: [ ${stringifiedViolations.join(', ')} ]`
      );
    }
  }

  public getCellsForUnit(unit: Unit) {
    return unit.cellCoords.map((coord) => this.cells[coord.row]![coord.col]!);
  }
}
