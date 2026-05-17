import { Coordinates, UnitType } from '../../types.js';
import { isSquarePositiveInteger } from '../../utils.js';

/**
 * Params for constructing a unit
 */
export interface UnitParams {
  unitType: UnitType;
  cellCoords: Coordinates[];
}

/**
 * Unit class representing either a Row, Column, or Box
 */
export class Unit {
  // Type of the Unit, row, column, or box
  readonly unitType: UnitType;
  // Indices of cells contained within the unit
  readonly cellCoords: Coordinates[];
  // Index of the top left cell in the unit for easy access
  readonly topLeftIndex: Coordinates;

  /**
   * Creates a Unit, performing appropriate validations for each unit type along the way
   * @param params unitType, cellCoords
   * @throws if the Unit is invalid somehow
   */
  constructor(params: UnitParams) {
    const { unitType, cellCoords } = params;

    const unitSize = cellCoords.length;

    // Validations
    // Is Cell count square? (applicable to all unit types)
    if (!isSquarePositiveInteger(unitSize)) {
      throw new Error(
        `Cell count must be a square postitive integer! Cell Count: ${unitSize}`
      );
    }

    // Used by validations of individual unit types
    const rows = new Set(cellCoords.map((coord) => coord.row));
    const cols = new Set(cellCoords.map((coord) => coord.col));

    // Validate row, column, and box cell lists
    if (unitType === UnitType.Row) {
      this.validateRowColCoords(unitType, unitSize, rows, cols);
      const sortedRow = [...cellCoords];
      this.cellCoords = sortedRow.sort((a, b) => a.col - b.col);
    } else if (unitType === UnitType.Column) {
      this.validateRowColCoords(unitType, unitSize, cols, rows);
      const sortedColumn = [...cellCoords];
      this.cellCoords = sortedColumn.sort((a, b) => a.row - b.row);
    } else if (unitType === UnitType.Box) {
      this.cellCoords = this.validateAndSortBoxCoords(cellCoords);
    } else {
      // This code is unreachable but needed to make typescript happy
      throw new Error(`Unit type ${unitType} is invalid!`);
    }

    this.unitType = unitType;
    // Non-null assertion is safe, due to isSquarePositiveInteger passing
    this.topLeftIndex = this.cellCoords[0]!;
  }

  /**
   * Perform validations on the cells of a row or column
   * @param unitType Row or Column, used for printing error messages
   * @param unitSize Width of a row or Height of a column
   * @param shouldBeSame The coordinates that should be the same for a given unitType,
   * row for row, col for column
   * @param shouldBeDifferent The coordinates that should be the same for a given unitType,
   * col for row, row for column
   * @throws if the row or column is invalid somehow
   */
  private validateRowColCoords(
    unitType: UnitType,
    unitSize: number,
    shouldBeSame: Set<number>,
    shouldBeDifferent: Set<number>
  ) {
    // Validate all coords have the same row/col value
    if (shouldBeSame.size > 1) {
      throw new Error(
        `${unitType} coords are not in the same ${unitType.toLowerCase()}! ${unitType} coords present: ${Array.from(shouldBeSame).join(', ')}`
      );
    }

    // We've verified there's exactly one value, this access pattern including non-null assertion is safe
    const index = shouldBeSame.values().next().value!;
    if (index >= unitSize) {
      throw new Error(
        `${unitType} index is greater than cell count! Index: ${index}, Cell count: ${unitSize}`
      );
    }

    // Validate all col values are unique, consecutive, and start at 0
    const expectedDifferentValues = new Set<number>();
    for (let i = 0; i < unitSize; i++) {
      expectedDifferentValues.add(i);
    }

    if (
      shouldBeDifferent.size !== expectedDifferentValues.size ||
      shouldBeDifferent.difference(expectedDifferentValues).size > 0
    ) {
      let oppositeType: UnitType;
      switch (unitType) {
        case UnitType.Row: {
          oppositeType = UnitType.Column;
          break;
        }
        case UnitType.Column: {
          oppositeType = UnitType.Row;
          break;
        }
        /* istanbul ignore next */
        default: {
          // This code is unreachable if called correctly, but needed for absolute type safety
          throw new Error(
            `This function is only meant to be used with rows and columns! Given unit type: ${unitType}`
          );
        }
      }
      throw new Error(
        `Validation of ${oppositeType.toLowerCase()} values in a ${unitType} failed!`
      );
    }
  }

  /**
   * Perform validation on the cells of a box.
   * Also returns the box cells sorted as this is performed as part of the validation.
   * @param cellCoords Cell coordinates to validate
   * @returns Valid, sorted box
   * @throws if the box is invalid somehow
   */
  private validateAndSortBoxCoords(cellCoords: Coordinates[]) {
    // Validate all coords are unique
    const seen = new Set<string>();
    const dupes = new Set<Coordinates>();

    for (const cell of cellCoords) {
      const stringifiedCell = JSON.stringify(cell);

      if (seen.has(stringifiedCell)) {
        dupes.add(cell);
      }
      seen.add(stringifiedCell);
    }

    if (dupes.size > 0) {
      throw new Error(
        `Not all cell coordinates are unique! Duplicates: ${JSON.stringify(Array.from(dupes))}`
      );
    }

    // Sort cells top to bottom and left to right to make our lives easier
    const sortedCells = [...cellCoords];
    sortedCells.sort((a, b) => {
      const rowDiff = a.row - b.row;
      return rowDiff !== 0 ? rowDiff : a.col - b.col;
    });

    // Non-null assertions are safe, due to isSquarePositiveInteger passing
    const firstCol = sortedCells[0]!.col;
    const firstRow = sortedCells[0]!.row;

    const boxEdgeSize = Math.sqrt(cellCoords.length);

    // Validate the box is aligned with the overall board's grid
    const columnOffset = firstCol % boxEdgeSize;
    if (columnOffset !== 0) {
      throw new Error(
        'Box is not aligned with the overall board! ' +
          `Offset (to right): ${columnOffset}, ` +
          `Offset (to left): ${Math.abs(columnOffset - boxEdgeSize)}`
      );
    }

    const rowOffset = firstRow % boxEdgeSize;
    if (rowOffset !== 0) {
      throw new Error(
        'Box is not aligned with the overall board! ' +
          `Offset (downwards): ${rowOffset}, ` +
          `Offset (upwards): ${Math.abs(rowOffset - boxEdgeSize)}`
      );
    }

    const maxCol = firstCol + boxEdgeSize - 1;
    const maxRow = firstRow + boxEdgeSize - 1;

    // Validate all cells are within the box's bounds
    for (const cellCoord of sortedCells) {
      // Column is less than first column
      if (cellCoord.col < firstCol) {
        throw new Error(
          "Cell column is less than first cell's column! " +
            `First cell column: ${firstCol}, ` +
            `Violated cell column: ${cellCoord.col}`
        );
      }

      // Column is too high to be in the same box as first column
      if (cellCoord.col > maxCol) {
        throw new Error(
          'Cell column is too high to be in the same box as the first column! ' +
            `First cell column: ${firstCol}, ` +
            `Box edge size: ${boxEdgeSize} ` +
            `Violated cell column: ${cellCoord.col}`
        );
      }

      // Row is less than first row check not reachable due to sort

      // Row is too high to be in the same box as first column
      if (cellCoord.row > maxRow) {
        throw new Error(
          'Cell row is too high to be in the same box as the first row! ' +
            `First cell row: ${firstRow}, ` +
            `Box edge size: ${boxEdgeSize} ` +
            `Violated cell row: ${cellCoord.row}`
        );
      }
    }

    // We already did this as part of validation, no need to do it again in constructor
    return sortedCells;
  }
}
