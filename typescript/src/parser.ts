import { readFileSync } from 'fs';
import { Board } from './primitives/board.js';
import { Cell } from './primitives/cell.js';
import { Coordinates } from './types.js';

export const parse = (json: string) => {
  let parsed;

  // Try parse the string in the first place
  try {
    parsed = JSON.parse(json);
  } catch (error) {
    throw new Error(`String ${json} is not valid json!`, { cause: error });
  }

  // Check if parsed is an array
  if (!Array.isArray(parsed)) {
    throw new Error(`${parsed} is not a valid array!`);
  }

  // Check if parsed is a non-empty array of arrays
  if (parsed.length === 0) {
    throw new Error('Parsed array is empty!');
  } else if (parsed.some((inner) => !Array.isArray(inner))) {
    throw new Error(`Parsed object is not an array of arrays! JSON: ${json}`);
  } else {
    // any[][] type is better typing than it was before (any[])
    // but we cannot conclusively give the array a type yet
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    parsed = parsed as any[][];
  }

  // Check if inner arrays are number arrays
  // could use isPositiveInteger here but will leave that check to primitive classes
  if (parsed.flat().some((element) => !Number.isInteger(element))) {
    throw new Error(`Not all inner array elements are integers! JSON: ${json}`);
  } else {
    parsed = parsed as number[][];
  }

  const cells: Cell[][] = [];
  for (let row = 0; row < parsed.length; row++) {
    for (let col = 0; col < parsed[row]!.length; col++) {
      const coordinates: Coordinates = {
        col,
        row,
      };

      if (cells[row] === undefined) {
        cells[row] = [];
      }

      // Non-nulls are safe, we're creating cell columns and
      // only accessing parsed.row when row < parsed.length
      cells[row]![col] = new Cell({
        coordinates,
        unitSize: parsed.length,
        givenValue: parsed[row]![col] !== 0 ? parsed[row]![col] : undefined,
      });
    }
  }
  return new Board({ cells });
};

export const parseFromFile = (filePath: string) => {
  let json: string;
  try {
    json = readFileSync(filePath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read file at ${filePath}`, { cause: error });
  }

  return parse(json);
};
