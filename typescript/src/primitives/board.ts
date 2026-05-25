import { Coordinates, UnitType } from '../types.js';
import { isSquarePositiveInteger } from '../utils.js';
import { Cell } from './cell.js';
import { Unit } from './unit.js';

/**
 * Params for constructing a Board
 */
export interface BoardParams {
  cells: Cell[][];
}

/**
 * A complete Sudoku board
 */
export class Board {
  // Box edge size for easy lookup
  readonly boxEdgeSize: number;
  // Unit size for easy lookup
  readonly unitSize: number;
  // Total board size for easy lookupc
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

    let width: number | undefined;
    cells.forEach((row) => {
      if (width !== undefined && width !== row.length) {
        throw new Error(
          'All rows must be the same width! ' +
            `Previous width: ${width} ` +
            `Current width: ${width}`
        );
      }

      if (!isSquarePositiveInteger(row.length)) {
        throw new Error(`Width is not a square! Given width: ${row.length}`);
      }

      if (cells.length !== row.length) {
        throw new Error(
          'Width and height are not the same! Board is not a square! ' +
            `Height: ${cells.length} ` +
            `Width: ${row.length}`
        );
      }

      width = row.length;
    });

    this.boxEdgeSize = Math.sqrt(cells.length);
    this.unitSize = cells.length;
    // Width is guaranteed to be assigned by this point so this non-null assertion is safe
    this.totalBoardSize = cells.length * width!;
    this.cells = cells;
    this.units = this.buildUnits();
  }

  /**
   * Builds units from a 2D array of cells
   * @returns Array of Units (rows, columns, boxes)
   */
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
      units.push(new Unit({ unitType: UnitType.Row, cellCoords: row }));
    }

    for (const col of colCoords) {
      units.push(new Unit({ unitType: UnitType.Column, cellCoords: col }));
    }

    for (const box of boxCoords) {
      units.push(new Unit({ unitType: UnitType.Box, cellCoords: box }));
    }

    return units;
  }

  /**
   * Clones the board for use in backtracking
   * @returns A cloned board
   */
  public clone() {
    const clonedCells = this.cells.map((row) =>
      row.map((cell) => cell.clone())
    );
    return new Board({ cells: clonedCells });
  }

  /**'
   * Validates that the current board state is valid
   * @throws A list of board violations
   */
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

  /**
   * Determines if every cell in the board has a value. Does not check validity
   * @returns if the board is already filled
   */
  public isFilled() {
    const cellsWithValues = this.cells
      .flat()
      .filter((cell) => cell.getValue() !== undefined);
    return cellsWithValues.length === this.totalBoardSize;
  }

  /**
   * Determines if the board is already solved
   * @returns If the board is solved or not
   */
  public isSolved() {
    try {
      this.validate();
    } catch (error) {
      console.log(error as Error);
      return false;
    }

    return this.isFilled();
  }

  public getCellsForUnit(unit: Unit) {
    return unit.cellCoords.map((coord) => this.cells[coord.row]![coord.col]!);
  }

  /**
   * Get the empty cell with the fewest candidates (best cell for use in backtracking)
   * @returns the empty cell with the fewest candidates
   * @throws if the board is already filled and there are no empty cells
   */
  public selectEmptyCell() {
    const emptyCells = this.cells
      .flat()
      .filter((cell) => cell.getValue() === undefined);

    if (emptyCells.length === 0) {
      throw new Error('Board is already filled! There are no empty cells!');
    }

    return emptyCells.reduce((min, cell) => {
      return cell.getCandidates().size < min.getCandidates().size ? cell : min;
    });
  }

  public getCellFromCoordinates(coordinates: Coordinates) {
    if (coordinates.row >= this.unitSize) {
      throw new Error(
        'Requested row is out of bounds for this board! ' +
          `Requested row: ${coordinates.row}, Max row: ${this.unitSize}`
      );
    } else if (coordinates.col >= this.unitSize) {
      throw new Error(
        'Requested column is out of bounds for this board! ' +
          `Requested column: ${coordinates.col}, Max column: ${this.unitSize}`
      );
    }

    // Non-null assertion is safe, we would have already thrown
    return this.cells[coordinates.row]![coordinates.col]!;
  }

  public getUnitsFromCoordinates(coordinates: Coordinates) {
    return this.units.filter((unit) =>
      unit.cellCoords.some(
        (c) => c.row === coordinates.row && c.col === coordinates.col
      )
    );
  }

  public getPeersFromCoordinates(targetCoordinates: Coordinates) {
    const unitsForCell = this.getUnitsFromCoordinates(targetCoordinates);
    const coordinates = unitsForCell.map((unit) => unit.cellCoords).flat();
    const otherCoordinates = coordinates.filter((other) => {
      return (
        other.row !== targetCoordinates.row ||
        other.col !== targetCoordinates.col
      );
    });
    return otherCoordinates.map((coordinates) =>
      this.getCellFromCoordinates(coordinates)
    );
  }

  public removeCandidatesFromPeers(coordinates: Coordinates, value: number) {
    this.getPeersFromCoordinates(coordinates).forEach((cell) =>
      cell.removeCandidate(value)
    );
  }

  public initializeCandidates() {
    this.cells.flat().forEach((cell) => {
      const value = cell.getValue();
      if (value !== undefined) {
        this.removeCandidatesFromPeers(cell.coordinates, value);
      }
    });
  }

  public getCandidateCount() {
    return this.cells
      .flat()
      .reduce(
        (count, cell) =>
          count +
          (cell.getValue() === undefined ? cell.getCandidates().size : 0),
        0
      );
  }

  public jsonPrint() {
    const result: number[][] = [];
    this.cells.forEach((row) => {
      const values = row.map((cell) => cell.getValue() ?? 0);
      result.push(values);
    });
    return JSON.stringify(result);
  }

  public prettyPrint() {
    const rows: string[] = [];
    for (let row = 0; row < this.unitSize; row++) {
      let result = '';
      for (let col = 0; col < this.unitSize; col++) {
        result += this.cells[row]![col]!.print();
        const plusOne = col + 1;
        const notAtEnd = plusOne !== this.unitSize;
        if (notAtEnd) {
          result += ' ';
        }
        if (plusOne % this.boxEdgeSize === 0 && notAtEnd) {
          result += '| ';
        }
      }
      rows.push(result);

      const plusOne = row + 1;
      const notAtEnd = plusOne !== this.unitSize;

      if (plusOne % this.boxEdgeSize === 0 && notAtEnd) {
        rows.push(this.getHorizontalDivider());
      }
    }
    // Extra newline for more square boxes on 100x100 and above
    const separator = this.unitSize.toString().length > 2 ? '\n\n' : '\n';
    return rows.join(separator);
  }

  private getHorizontalDivider() {
    const cellWidth = this.unitSize.toString().length;
    let divider = '';
    for (let i = 0; i < this.boxEdgeSize; i++) {
      const plusOne = i + 1;
      const isMiddle = i !== 0 && plusOne !== this.boxEdgeSize;
      // Add one box worth of divisions
      divider += '-'.repeat(this.boxEdgeSize * (cellWidth + 1));
      // Add one extra to account for the extra space between the vertical divider and the first element
      if (isMiddle) {
        divider += '-';
      }
      if (i + 1 !== this.boxEdgeSize) {
        divider += '+';
      }
    }
    return divider;
  }
}
