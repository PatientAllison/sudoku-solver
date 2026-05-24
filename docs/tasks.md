# Implementation Plan: Sudoku Solver (TypeScript)

## Overview

This plan is structured so that each component is fully implemented and tested before moving on to the next. The scaffolding tasks (tooling, shared types, stub files) are handled first to get the project compiling. All non-trivial logic — algorithms, constraint propagation, solving techniques — is written by Allison. Property-based testing comes last, after all components are working.

The implementation targets Node.js with TypeScript, using Vitest as the test runner and `fast-check` for property-based testing.

---

## Phase 0: Project Setup (scaffolding — done for you)

- [x] 0.1 Fix `tsconfig.json`
  - Remove `"jsx": "react-jsx"` (this is a CLI/library project, not React)
  - _Requirements: (project infrastructure)_

- [x] 0.2 Configure `package.json`
  - Add `"build": "tsc"` script
  - Add `"test": "vitest run"` script (single-run, not watch)
  - Add `"dev": "tsc --watch"` script
  - Add dev dependencies: `vitest@3`, `@vitest/coverage-v8@3`, `fast-check@3`
  - _Requirements: (project infrastructure)_

- [x] 0.3 Create `vitest.config.ts`
  - Configure Vitest to find `src/**/*.test.ts`
  - Enable coverage via `@vitest/coverage-v8`
  - _Requirements: (project infrastructure)_

- [x] 0.4 Create `src/` directory layout with stub files
  - All files export stubs that compile cleanly; no logic implemented
  - Files: `types.ts`, `cell.ts`, `unit.ts`, `board.ts`, `parser.ts`, `validator.ts`, `solver.ts`, `prettyPrinter.ts`, `index.ts`
  - _Requirements: (project infrastructure)_

- [x] 0.5 Define shared types in `src/types.ts`
  - `Result<T, E>` discriminated union: `{ ok: true; value: T } | { ok: false; error: E }`
  - `ErrorKind` enum: `OUT_OF_BOUNDS`, `GIVEN_CELL`, `INVALID_BOARD`, `PARSE_ERROR_STRUCTURAL`, `PARSE_ERROR_DIMENSIONS`, `PARSE_ERROR_ROW_LENGTH`, `PARSE_ERROR_CELL_VALUE`, `NO_SOLUTION`
  - `UnitKind` enum: `ROW`, `COLUMN`, `BOX`
  - `SolverError` type: `{ kind: ErrorKind; message: string; details?: unknown }`
  - `Violation` type: `{ kind: UnitKind; index: number; digit: number; positions: Array<[number, number]> }`
  - _Requirements: 1.6, 1.7, 2.5, 3.6, 3.7, 7.2–7.5_

- [x] 0.6 Verify `npm run build` exits without errors
  - All stub files compile; `dist/` is produced
  - _Requirements: (project infrastructure)_

---

## Phase 1: Cell

- [ ] 1.1 Implement `Cell` in `src/cell.ts`
  - Fields: `value: number`, `isGiven: boolean`, `candidates: Set<number>`
  - Constructor: `constructor(value: number, isGiven: boolean, candidates: Set<number>)`
  - Invariant: if `value !== 0`, then `candidates` must equal `{value}` (singleton); if `value === 0`, `candidates` is a subset of `{1…N²}`
  - `clone(): Cell` — returns a deep copy (new Set for candidates)
  - _Requirements: 1.2, 1.3, 5.1_

- [ ] 1.2 Write unit tests for `Cell` in `src/cell.test.ts`
  - Construction with a given value sets `candidates = {value}`
  - Construction with value 0 accepts any candidate set
  - `clone()` produces an independent copy (mutating the clone does not affect the original)
  - _Requirements: 1.2, 1.3_

---

## Phase 2: Unit

- [ ] 2.1 Implement `Unit` in `src/unit.ts`
  - Fields: `kind: UnitKind`, `index: number`, `cells: Array<[number, number]>` (row/col index pairs into the Board grid)
  - Constructor: `constructor(kind: UnitKind, index: number, cells: Array<[number, number]>)`
  - _Requirements: 2.1, 11.1, 11.2_

- [ ] 2.2 Write unit tests for `Unit` in `src/unit.test.ts`
  - A Unit constructed with N² cell references holds exactly N² references
  - The `kind` and `index` fields are stored correctly
  - _Requirements: 2.1_

---

## Phase 3: Board

- [ ] 3.1 Implement `Board` constructor in `src/board.ts`
  - Fields: `readonly N: number`, `readonly size: number` (= N²), `cells: Cell[][]`, `units: Unit[]`
  - Constructor allocates a `size × size` grid of empty Cells (value=0, candidates={1…size})
  - Constructor builds all 3×N² Units: N² Rows, N² Columns, N² Boxes
  - Box index formula: `b = boxRow × N + boxCol` where `boxRow = Math.floor(b / N)`, `boxCol = b % N`
  - _Requirements: 1.1, 2.1, 10.1_

- [ ] 3.2 Implement `getCell` and `isEmpty`
  - `getCell(row, col)`: returns `Failure(OUT_OF_BOUNDS)` if index out of range; otherwise `Success(cell)`
  - `isEmpty(row, col)`: returns `Failure(OUT_OF_BOUNDS)` if out of range; otherwise `Success(cell.value === 0)`
  - _Requirements: 1.4, 1.7_

- [ ] 3.3 Implement `setCell` and `clearCell`
  - `setCell(row, col, digit)`: fails if out of bounds or `isGiven`; sets `cell.value = digit`, `cell.candidates = {digit}`, removes `digit` from all peer cells' candidate sets
  - `clearCell(row, col)`: fails if out of bounds or `isGiven`; sets `cell.value = 0`, recomputes `cell.candidates` from scratch, restores the digit to peers' candidate sets where valid
  - Peers: all cells sharing a Row, Column, or Box with (row, col), excluding (row, col) itself
  - _Requirements: 1.5, 1.6, 5.3_

- [ ] 3.4 Implement `getCandidates`, `getUnit`, `allUnits`, `isSolved`
  - `getCandidates(row, col)`: delegates to `getCell`; returns the cell's candidate set
  - `getUnit(kind, index)`: returns `Failure(OUT_OF_BOUNDS)` if index out of range; otherwise the matching Unit
  - `allUnits()`: returns the full `units` array
  - `isSolved()`: returns true if every cell has `value !== 0`
  - _Requirements: 1.4, 2.1, 3.9_

- [ ] 3.5 Implement `clone`
  - Deep copy: new Cell instances (using `Cell.clone()`), new Unit instances referencing the new cells, same N and size
  - _Requirements: 4.3_

- [ ] 3.6 Write unit tests for `Board` in `src/board.test.ts`
  - A freshly constructed Board has the correct dimensions (N²×N² cells, 3×N² units)
  - All cells start empty with full candidate sets {1…N²}
  - `getCell` / `isEmpty` return correct values and OUT_OF_BOUNDS on bad indices
  - `setCell` updates value and candidates; propagates removal to peers
  - `setCell` on a Given cell returns GIVEN_CELL and leaves the board unchanged
  - `clearCell` restores value and recomputes candidates
  - `isSolved` returns false for a partial board, true when all cells are filled
  - `clone` produces an independent copy
  - _Requirements: 1.1–1.7, 5.1–5.4_

---

## Phase 4: Parser

- [ ] 4.1 Implement `parse` in `src/parser.ts`
  - Input: a JSON string
  - Check 1 — structural: must be a JSON array of arrays of numbers; return `PARSE_ERROR_STRUCTURAL` otherwise
  - Check 2 — dimensions: outer array length must be N² for some integer N≥2; return `PARSE_ERROR_DIMENSIONS` otherwise
  - Check 3 — row length: each inner array must have length equal to the outer array length; return `PARSE_ERROR_ROW_LENGTH` (with row index, expected, actual) otherwise
  - Check 4 — cell values: each value must be an integer in 0–N²; return `PARSE_ERROR_CELL_VALUE` (with row, col, value) otherwise
  - On success: construct a Board of Box Size N, set each non-zero cell as a Given (call `setCell` then mark `isGiven = true`), return `Success(board)`
  - _Requirements: 7.1–7.6, 10.3_

- [ ] 4.2 Write unit tests for `Parser` in `src/parser.test.ts`
  - Malformed JSON → `PARSE_ERROR_STRUCTURAL`
  - Not an array → `PARSE_ERROR_STRUCTURAL`
  - Array of non-arrays → `PARSE_ERROR_STRUCTURAL`
  - Outer length not a perfect square (e.g. length 5) → `PARSE_ERROR_DIMENSIONS`
  - Outer length 1 (N=1, invalid) → `PARSE_ERROR_DIMENSIONS`
  - Inner array wrong length → `PARSE_ERROR_ROW_LENGTH` with correct row index
  - Cell value out of range (negative, or > N²) → `PARSE_ERROR_CELL_VALUE` with correct position
  - Valid 4×4 input (N=2) → Board with N=2, correct Givens
  - Valid 9×9 input (N=3) → Board with N=3, correct Givens and empty cells
  - _Requirements: 7.1–7.6_

---

## Phase 5: Validator

- [ ] 5.1 Implement `validate` in `src/validator.ts`
  - Iterate all 3×N² Units
  - For each Unit, collect all non-zero cell values; if any digit appears more than once, record a `Violation`
  - Empty cells (value=0) are non-conflicting
  - If any violations found: return `Failure(INVALID_BOARD)` with `details` = array of `Violation` objects (each with kind, index, digit, positions)
  - If no violations: return `Success(board)`
  - _Requirements: 2.1–2.5, 10.5_

- [ ] 5.2 Write unit tests for `Validator` in `src/validator.test.ts`
  - Empty board → valid
  - Fully solved valid board → valid
  - Duplicate digit in a row → invalid, violation includes correct row index and digit
  - Duplicate digit in a column → invalid, violation includes correct column index
  - Duplicate digit in a box → invalid, violation includes correct box index
  - Multiple violations → all reported
  - Empty cells alongside filled cells → empty cells do not cause violations
  - _Requirements: 2.1–2.5_

---

## Phase 6: Solver — Logic Techniques

Implement each technique as a standalone function. Each returns `true` if it made any progress (placed a digit or eliminated a candidate), `false` otherwise. Work through them in tier order; each builds on the same candidate-set infrastructure.

- [ ] 6.1 Implement `applyNakedSingle`
  - For each empty cell (value=0): if `|candidates| === 1`, place the digit
  - _Requirements: 6.1_

- [ ] 6.2 Implement `applyHiddenSingle`
  - For each unit, for each digit 1–N²: if the digit appears in exactly one empty cell's candidates, place it
  - Filter on `cell.value === 0` when scanning candidates
  - _Requirements: 6.1_

- [ ] 6.3 ~~Implement `applyNakedPair`~~ *(Out of scope)*
  - ~~For each unit, find pairs of empty cells with identical 2-element candidate sets; eliminate those two digits from all other empty cells in the unit~~
  - _Requirements: 6.2_

- [ ] 6.4 ~~Implement `applyHiddenPair`~~ *(Out of scope)*
  - ~~For each unit, find pairs of digits that appear in exactly the same two empty cells; remove all other candidates from those two cells~~
  - _Requirements: 6.2_

- [ ] 6.5 ~~Implement `applyPointingPair`~~ *(Out of scope)*
  - ~~For each box, for each digit: if all candidates for that digit in the box lie in a single row or column, eliminate the digit from the rest of that row/column outside the box~~
  - _Requirements: 6.2_

- [ ] 6.6 ~~Implement `applyBoxLineReduction`~~ *(Out of scope)*
  - ~~For each row/column, for each digit: if all candidates for that digit in the row/column lie in a single box, eliminate the digit from the rest of that box~~
  - _Requirements: 6.2_

- [ ] 6.7 ~~Implement `applyNakedTriple`~~ *(Out of scope)*
  - ~~For each unit, find triples of empty cells whose candidate union has exactly 3 digits; eliminate those digits from all other empty cells in the unit~~
  - _Requirements: 6.3_

- [ ] 6.8 ~~Implement `applyHiddenTriple`~~ *(Out of scope)*
  - ~~For each unit, find triples of digits that appear only within the same three empty cells; remove all other candidates from those three cells~~
  - _Requirements: 6.3_

- [ ] 6.9 ~~Implement `applyXWing`~~ *(Out of scope)*
  - ~~Row-based: find two rows where a digit appears in exactly two empty cells sharing the same two columns; eliminate from those columns elsewhere~~
  - ~~Column-based: same logic transposed~~
  - _Requirements: 6.3_

- [ ] 6.10 ~~Implement `applySwordfish`~~ *(Out of scope)*
  - ~~Row-based: find three rows where a digit appears in 2–3 empty cells all within the same three columns; eliminate from those columns elsewhere~~
  - ~~Column-based: same logic transposed~~
  - _Requirements: 6.3_

- [ ] 6.11 Write unit tests for logic techniques in `src/solver.test.ts`
  - For each technique (6.1–6.10): at least one test with a board state where the technique applies and one where it does not
  - Verify the correct digit is placed or the correct candidates are eliminated
  - Verify the function returns `true` when progress is made and `false` when not
  - _Requirements: 6.1–6.3_

---

## Phase 7: Solver — Backtracking and Main Loop

- [ ] 7.1 Implement `selectEmptyCell`
  - Scan cells in row-major order (row 0 to N²−1, left to right)
  - Return the empty cell (value=0) with the fewest candidates (MRV heuristic)
  - Ties broken by row-major order
  - Simple alternative: just return the first empty cell in row-major order (acceptable for initial implementation)
  - _Requirements: 4.1, 9.3_

- [ ] 7.2 Implement `backtrack`
  - If `board.isSolved()`, return `Success(board)`
  - Select an empty cell via `selectEmptyCell`; if none, return `Failure(NO_SOLUTION)`
  - For each digit in the cell's candidates (ascending): clone the board, place the digit, recurse; if `Success`, return it; otherwise continue
  - If all candidates exhausted, return `Failure(NO_SOLUTION)`
  - _Requirements: 4.1–4.4_

- [ ] 7.3 Implement the main `solve` function and `solveWithLogic` loop
  - Validate the board first; return `Failure(INVALID_BOARD)` if invalid
  - If already solved, return `Success(board)` immediately
  - Initialize all candidate sets for empty cells
  - Logic loop: at the top of each iteration, check `isSolved()` then `validate()`; apply techniques in tier order, restarting from Tier 1 on any progress; break when no technique makes progress
  - Fall through to `backtrack` when logic is exhausted
  - _Requirements: 3.1–3.9, 4.1–4.4_

- [ ] 7.4 Write unit tests for the full solver in `src/solver.test.ts`
  - Already-solved valid board → returned immediately, unchanged
  - Invalid board (duplicate digit) → `Failure(INVALID_BOARD)`
  - Unsolvable board (valid but no solution) → `Failure(NO_SOLUTION)`
  - Easy puzzle (solvable by naked/hidden singles alone) → correct solution
  - Hard puzzle (requires backtracking) → correct solution
  - Given cells in the solution match the input Givens
  - _Requirements: 3.1–3.9, 4.1–4.4, 9.1–9.3_

---

## Phase 8: PrettyPrinter

- [ ] 8.1 Implement `toJson` in `src/prettyPrinter.ts`
  - Output: a JSON array of arrays of numbers, row by row
  - Each cell value is its number (0 for empty)
  - Must be parseable by `parse` (round-trip property)
  - _Requirements: 7.7, 7.9_

- [ ] 8.2 Implement `toGrid` in `src/prettyPrinter.ts`
  - Compute column width `W = String(board.size).length` (e.g. N=3 → W=1, N=4 → W=2)
  - Right-align all digits and empty markers (`.`) to width W
  - Separate cells within a box with a single space
  - Separate boxes horizontally with ` | `
  - Insert a horizontal separator line between box rows: each segment is `W×N + (N−1)` dashes, joined by `+`
  - _Requirements: 7.8, 10.4_

- [ ] 8.3 Write unit tests for `PrettyPrinter` in `src/prettyPrinter.test.ts`
  - `toJson` on a known board produces the expected JSON string
  - `toJson` output is parseable by `parse` and produces an equivalent board (round-trip)
  - `toGrid` on a known 9×9 board produces the expected grid string (verify separator positions)
  - `toGrid` on a 4×4 board (N=2) produces correct output with W=1
  - _Requirements: 7.7–7.9_

---

## Phase 9: Entry Point

- [ ] 9.1 Implement `src/index.ts`
  - Read input: `process.argv[2]` first; fall back to reading all of stdin
  - If no input: print usage message (show the JSON array-of-arrays format) and `process.exit(1)`
  - Call `parse` → on failure, print error and `process.exit(1)`
  - Call `validate` → on failure, print violation report and `process.exit(1)`
  - Call `solve` → on `NO_SOLUTION`, print "No solution exists." and `process.exit(1)`; on `INVALID_BOARD`, print violation report and `process.exit(1)`
  - Call `toGrid` → print result and `process.exit(0)`
  - _Requirements: 8.1–8.7_

- [ ] 9.2 Manual smoke test
  - Run `node dist/index.js` with a known 9×9 puzzle JSON and verify the solution prints correctly
  - Run with no input and verify the usage message appears
  - Run with an unsolvable puzzle and verify the correct message and exit code
  - _Requirements: 8.1–8.7_

---

## Phase 10: Property-Based Testing

- [ ] 10.1 Read the PBT introduction in the design document (Testing Strategy section)
  - Understand the difference between unit tests (specific examples) and property tests (universal invariants)
  - Review the 16 correctness properties listed in the design

- [ ] 10.2 Write `fast-check` arbitrary generators in `src/properties.test.ts`
  - `arbBoxSize()` — generates N ∈ {2, 3}
  - `arbValidBoard(N)` — generates a valid partial board of box size N
  - `arbSolvedBoard(N)` — generates a fully solved valid board
  - `arbGivenPosition(board)` — generates a (row, col) pair that is a Given cell
  - `arbOutOfBoundsIndex(N)` — generates an index outside 0–(N²−1)
  - `arbInvalidJson()` — generates strings that are not valid JSON arrays-of-arrays

- [ ] 10.3 Implement property tests for Board (Properties 1–5)
  - Property 1: Board dimensions invariant
  - Property 2: Cell value range invariant
  - Property 3: Cell access round-trip
  - Property 4: Given cell protection
  - Property 5: Out-of-bounds error
  - Each test: `// Feature: sudoku-solver, Property N: <property text>`

- [ ] 10.4 Implement property tests for Validator (Properties 6–7)
  - Property 6: Validator accepts valid boards
  - Property 7: Validator rejects invalid boards with details

- [ ] 10.5 Implement property tests for Solver (Properties 8–13)
  - Property 8: Solver correctness — solvable puzzles
  - Property 9: Solver returns NO_SOLUTION for unsolvable puzzles
  - Property 10: Solver rejects invalid boards
  - Property 11: Backtracking state restoration
  - Property 12: Candidate set correctness
  - Property 13: Logic techniques make no false eliminations

- [ ] 10.6 Implement property tests for Parser and PrettyPrinter (Properties 14–16)
  - Property 14: Serialization round-trip
  - Property 15: Parser rejects invalid inputs with correct error kinds
  - Property 16: Solver determinism

---

## Notes

- Phase 0 is done for you — the project compiles and `npm test` runs
- All non-trivial logic is written by Allison; the stubs are there to guide the shape of each function
- Write tests alongside each implementation phase, not after
- The MRV heuristic in Phase 7.1 is optional — row-major order is acceptable and simpler for a first pass
- PBT (Phase 10) builds on top of working unit tests; don't start it until all components pass their unit tests

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["0.1", "0.2", "0.3", "0.4", "0.5", "0.6"] },
    { "id": 1, "tasks": ["1.1"] },
    { "id": 2, "tasks": ["1.2", "2.1"] },
    { "id": 3, "tasks": ["2.2", "3.1"] },
    { "id": 4, "tasks": ["3.2", "3.3", "3.4", "3.5"] },
    { "id": 5, "tasks": ["3.6", "4.1"] },
    { "id": 6, "tasks": ["4.2", "5.1"] },
    { "id": 7, "tasks": ["5.2", "6.1", "6.2"] },
    { "id": 8, "tasks": ["6.3", "6.4", "6.5", "6.6"] },
    { "id": 9, "tasks": ["6.7", "6.8", "6.9", "6.10"] },
    { "id": 10, "tasks": ["6.11", "7.1", "7.2"] },
    { "id": 11, "tasks": ["7.3"] },
    { "id": 12, "tasks": ["7.4", "8.1", "8.2"] },
    { "id": 13, "tasks": ["8.3", "9.1"] },
    { "id": 14, "tasks": ["9.2"] },
    { "id": 15, "tasks": ["10.1"] },
    { "id": 16, "tasks": ["10.2"] },
    { "id": 17, "tasks": ["10.3", "10.4"] },
    { "id": 18, "tasks": ["10.5"] },
    { "id": 19, "tasks": ["10.6"] }
  ]
}
```
