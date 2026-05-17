import { Coordinates } from '../types.js';
import { isSquarePositiveInteger } from '../utils.js';

export interface CellParams {
  coordinates: Coordinates;
  unitSize: number;
  givenValue?: number;
}

export class Cell {
  // Coordinates of the Cell within the Board
  readonly coordinates: Coordinates;
  // Whether a value was given at construction time
  readonly isGiven: boolean;
  // Size of a unit for the board (used in calculating candidates and cloning)
  private readonly unitSize: number;
  // Candidates for the cell's value
  private candidates: Set<number>;
  // The cell's final value
  private value?: number;

  /**
   * Creates a cell object.
   * @param col Column of cell
   * @param row Row of cell
   * @param unitSize Unit size for the whole board (used in calculating candidates)
   * @param givenValue Optional, used only when parsing initial input for the board
   */
  constructor(params: CellParams) {
    // Destructure input
    const { coordinates, unitSize, givenValue } = params;

    // Validations
    if (!isSquarePositiveInteger(unitSize)) {
      throw new Error('Unit size must be a square postitive integer!');
    } else if (coordinates.col >= unitSize) {
      throw new Error('Column is greater than or equal to unit size!');
    } else if (coordinates.row >= unitSize) {
      throw new Error('Row is greater than or equal to unit size!');
    }

    // Set Coords and unitSize
    this.coordinates = coordinates;
    this.unitSize = unitSize;

    if (givenValue !== undefined) {
      // Set appropriate values if givenValue is defined
      this.isGiven = true;
      this.value = givenValue;
      this.candidates = new Set([givenValue]);
    } else {
      // Add all possible candidates if givenValue is undefined
      this.isGiven = false;
      this.candidates = new Set<number>();
      for (let i = 1; i <= unitSize; i++) {
        this.candidates.add(i);
      }
    }
  }

  /**
   * Get candidates for the cell
   * @returns candidates for the cell
   */
  getCandidates() {
    return this.candidates;
  }

  /**
   * Get final value for the cell
   * @returns Value if set, undefined if not set
   */
  getValue() {
    return this.value;
  }

  /**
   * Remove a candidate for the cell
   * @param value Value to remove
   */
  removeCandidate(value: number) {
    this.candidates.delete(value);
  }

  /**
   * To be used when the solver has conclusively determined the cell's value
   * Setting the same value is a no-op so the solver does not need to care about if a cell is already solved
   * @param value Value to set
   * @throws If cell already has a different value
   */
  setValue(value: number) {
    // Invariant check: Do not allow setting a value for a cell that already has a different one
    if (this.value !== undefined && this.value !== value) {
      throw new Error(
        'This cell already has a different value!' +
          `Row: ${this.coordinates.row}, ` +
          `Col: ${this.coordinates.col}, ` +
          `Existing Value: ${this.value}, ` +
          `Your Value: ${value} ` +
          `isGiven: ${this.isGiven}`
      );
      // Set value if existing value is undefined
    } else if (this.value === undefined) {
      this.value = value;
      this.candidates = new Set([value]);
    }
    // No-op if value is the same
  }

  /**
   * Clones the cell for use in backtracking solve methods
   * @returns Deep clone of the cell
   */
  clone() {
    const cloned = new Cell({
      coordinates: {
        col: this.coordinates.col,
        row: this.coordinates.row,
      },
      unitSize: this.unitSize,
      givenValue: this.isGiven ? this.value : undefined,
    });

    if (this.value !== undefined && !this.isGiven) {
      cloned.setValue(this.value);
    }

    cloned.candidates = new Set(this.getCandidates());
    return cloned;
  }
}
