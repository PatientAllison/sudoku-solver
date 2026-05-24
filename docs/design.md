# Design Document: Sudoku Solver

## Overview

The Sudoku Solver is a language-agnostic library and command-line program that reads a Sudoku puzzle, validates it, solves it using human-style logic techniques followed by backtracking, and outputs the completed board. The design is intentionally implementation-neutral: it describes components, data models, interfaces, and algorithms in pseudocode and plain English so that the same spec can guide independent implementations in TypeScript, Kotlin, Java, Python, Ruby, Go, Rust, and C-family languages.

### Primary Target

A standard 9×9 Sudoku puzzle (Box Size N=3). All dimensions derive from N:

- Board size: N² × N² cells (9×9 = 81 cells)
- Digit range: 1 through N² (1–9)
- Units per board: 3 × N² (27 units: 9 rows + 9 columns + 9 boxes)

### Stretch Goals (open, not required for initial implementation)

- **Variable board size**: Any N≥2 producing an N²×N² grid (e.g., N=2 for 4×4, N=4 for 16×16)
- **Samurai Sudoku**: Five overlapping standard boards in an X pattern

### Design Principles

1. **Logic-first**: Apply human-style techniques in tiers before backtracking.
2. **Parameterized by N**: No dimension is hardcoded; everything derives from Box Size N.
3. **Result types, not exceptions**: All fallible operations return a result value (success+value or failure+error). This maps to `Result`/`Either` in functional languages, checked exceptions in Java/Kotlin, error codes in C, `(value, error)` tuples in Go, etc.
4. **Units as the abstraction boundary**: The Solver operates on a list of Units, not on a hardcoded grid. This is the key extensibility hook for Samurai Sudoku.
5. **No implementation code**: This document describes *what* each component does, not *how* to write it in any language.

---

## Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Entry Point                          │
│  (CLI argument / stdin → parse → validate → solve → print)  │
└──────────┬──────────────────────────────────────────────────┘
           │ orchestrates
    ┌──────▼──────┐   ┌───────────┐   ┌────────┐   ┌──────────────┐
    │   Parser    │   │ Validator │   │ Solver │   │ PrettyPrinter│
    └──────┬──────┘   └─────┬─────┘   └───┬────┘   └──────┬───────┘
           │                │             │                │
           └────────────────┴─────────────┴────────────────┘
                                    │
                              ┌─────▼──────┐
                              │   Board    │
                              │ (+ Cells,  │
                              │   Units)   │
                              └────────────┘
```

### Components and Responsibilities

| Component | Responsibility |
|-----------|---------------|
| **Board** | Holds the N²×N² grid of Cells and the complete list of Units. Provides indexed access and mutation of non-Given Cells. |
| **Cell** | Stores a single position's value (0=empty or digit 1–N²), its `isGiven` flag, and its mutable candidate set. |
| **Unit** | An abstract grouping of exactly N² Cells (a Row, Column, or Box). Carries a type tag and index for error reporting. |
| **Parser** | Converts a JSON array-of-arrays string into a Board. Infers N from array dimensions. Returns a Result. |
| **Validator** | Checks all 3×N² Units for duplicate digits. Returns a Result with violation details on failure. |
| **Solver** | Applies logic techniques in tiers, then backtracking. Returns a Result containing the solved Board or a no-solution indicator. |
| **PrettyPrinter** | Converts a Board to either a JSON array-of-arrays string or a human-readable grid with box separators. |
| **Entry Point** | Wires all components together: reads input, calls Parser → Validator → Solver → PrettyPrinter, handles errors, exits with appropriate status codes. |

---

## Data Models

### Cell

A Cell represents a single position on the board.

```
Cell {
  value:        Integer        // 0 = empty; 1–N² = placed digit
  isGiven:      Boolean        // true if this digit was part of the puzzle input
  candidates:   Set<Integer>   // for empty cells: digits still possible; for filled cells: {value}
}
```

**Invariants:**
- If `value = 0` (empty), then `candidates` is a non-empty subset of {1, …, N²}, or empty only when a contradiction has been detected.
- If `value ≠ 0` (filled), then `candidates = {value}` — a singleton set containing exactly the placed digit.
- A cell with `isGiven = true` has `value ≠ 0` and `candidates = {value}`.
- `isGiven` is set once at parse time and never changes.

**Rationale for singleton candidates on filled cells:** Keeping `candidates = {value}` for filled cells means logic techniques can iterate over all cells' candidate sets uniformly, without special-casing filled cells. For example, Hidden Single scans candidate sets across a unit — if filled cells had empty candidate sets, they would incorrectly appear as "no candidate here" rather than "this digit is already placed here." The singleton representation makes the distinction between "this digit is impossible here" (not in candidates) and "this digit is already placed here" (candidates = {value}) explicit and consistent.

### Unit

A Unit is an abstract grouping of exactly N² Cells that must each contain a distinct digit.

```
Unit {
  kind:   UnitKind          // ROW | COLUMN | BOX
  index:  Integer           // 0–(N²−1), used for error reporting
  cells:  List<CellRef>     // ordered list of N² references into the Board's cell grid
}
```

`CellRef` is a reference (pointer, index pair, or equivalent) to a specific Cell in the Board. The same Cell object appears in exactly three Units: one Row, one Column, and one Box.

**Unit construction rules:**
- Row `r`: cells at positions (r, 0), (r, 1), …, (r, N²−1)
- Column `c`: cells at positions (0, c), (1, c), …, (N²−1, c)
- Box `b` (where b = boxRow × N + boxCol, boxRow = b ÷ N, boxCol = b mod N):
  cells at positions (boxRow×N + dr, boxCol×N + dc) for dr in 0–(N−1), dc in 0–(N−1)

### Board

The Board is the central data structure. It owns all Cells and all Units.

```
Board {
  N:      Integer           // Box size (default 3)
  size:   Integer           // N² — the board's side length
  cells:  Grid<Cell>        // N²×N² grid, indexed by (row, col)
  units:  List<Unit>        // all 3×N² units: N² rows + N² cols + N² boxes
}
```

**Derived values** (computed from N, not stored separately):
- `size = N × N`
- Total cells: `size × size`
- Digit range: 1 through `size`
- Total units: `3 × size`

**Board construction:**
1. Allocate a `size × size` grid of Cells, all initially empty with full candidate sets {1…size}.
2. Build all Row, Column, and Box Units, each holding references to the appropriate Cells.
3. For each Given in the input, set the Cell's value, set `isGiven = true`, set its candidates to `{value}`, and propagate the placement (remove the digit from peers' candidate sets).

### Result Type

All fallible operations return a Result. The exact representation is language-specific, but the abstract shape is:

```
Result<T> =
  | Success { value: T }
  | Failure { error: ErrorDescription }

ErrorDescription {
  kind:    ErrorKind        // e.g., OUT_OF_BOUNDS, GIVEN_CELL, INVALID_BOARD, PARSE_ERROR, NO_SOLUTION
  message: String           // human-readable description
  details: Any              // optional structured data (e.g., violation list, row/col position)
}
```

**Language mapping guidance:**
- TypeScript/Kotlin/Rust: a discriminated union / sealed class / `Result<T, E>` enum
- Java: checked exceptions or a `Result<T>` wrapper class
- Go: `(T, error)` return pair
- Python/Ruby: raise exceptions or return `(value, error)` tuples
- C: return code + output parameter

---

## Components and Interfaces

This section describes what each component exposes. Interfaces are described abstractly — not as code in any language.

### Board Interface

| Operation | Inputs | Output | Notes |
|-----------|--------|--------|-------|
| `getCell` | row, col | `Result<Cell>` | Fails if out of bounds |
| `setCell` | row, col, digit | `Result<Unit>` | Fails if out of bounds or isGiven; sets value, sets candidates to {digit}, removes digit from peers' candidate sets |
| `clearCell` | row, col | `Result<Unit>` | Fails if out of bounds or isGiven; sets value to 0, recomputes candidates from peers |
| `getCandidates` | row, col | `Result<Set<Integer>>` | Returns current candidate set; {value} for filled cells, subset of {1…N²} for empty cells |
| `getUnit` | kind, index | `Result<Unit>` | Returns the specified Unit |
| `allUnits` | — | `List<Unit>` | Returns all 3×N² Units |
| `isEmpty` | row, col | `Result<Boolean>` | True if cell value is 0 (candidate set size > 1 is not sufficient — use value = 0) |
| `isSolved` | — | Boolean | True if no empty cells remain (all values ≠ 0) |
| `clone` | — | Board | Deep copy for backtracking |

### Parser Interface

| Operation | Inputs | Output | Notes |
|-----------|--------|--------|-------|
| `parse` | jsonString | `Result<Board>` | Full pipeline: structural check → dimension check → value check → Board construction |

Error cases (in order of checking):
1. Not valid JSON or not an array of arrays of numbers → structural parse error
2. Outer array length is not a perfect square N² for some N≥2 → invalid dimensions
3. Any inner array length ≠ outer array length → malformed row (include row index, expected length, actual length)
4. Any cell value not an integer in 0–N² → invalid value (include row, col, value)

### Validator Interface

| Operation | Inputs | Output | Notes |
|-----------|--------|--------|-------|
| `validate` | board | `Result<Board>` | Returns the board on success; returns violation list on failure |

A violation is: `{ kind: UnitKind, index: Integer, digit: Integer, positions: List<(row,col)> }`

### Solver Interface

| Operation | Inputs | Output | Notes |
|-----------|--------|--------|-------|
| `solve` | board | `Result<Board>` | Returns solved board, or failure with NO_SOLUTION or INVALID_BOARD |

The Solver validates the board first. If already solved, returns immediately. Otherwise applies logic techniques then backtracking.

### PrettyPrinter Interface

| Operation | Inputs | Output | Notes |
|-----------|--------|--------|-------|
| `toJson` | board | String | JSON array-of-arrays; round-trippable by Parser |
| `toGrid` | board | String | Human-readable grid with box separators |

**Grid format example (N=3):**

```
5 3 . | . 7 . | . . .
6 . . | 1 9 5 | . . .
. 9 8 | . . . | . 6 .
------+-------+------
8 . . | . 6 . | . . 3
4 . . | 8 . 3 | . . 1
7 . . | . 2 . | . . 6
------+-------+------
. 6 . | . . . | 2 8 .
. . . | 4 1 9 | . . 5
. . . | . 8 . | . 7 9
```

Rules:
- Each cell is rendered in a fixed-width column. The column width `W` equals the number of digits in N² (e.g., N=3 → max digit 9 → W=1; N=4 → max digit 16 → W=2; N=5 → max digit 25 → W=2).
- Digits are right-aligned within their column width. Empty cells are rendered as `.` right-aligned in the same width (e.g., ` .` for W=2).
- Cells within a box are separated by a single space.
- `|` separates boxes horizontally, with a single space on each side.
- A horizontal separator line appears between box rows. Each segment is `W×N + (N−1)` dashes wide (one per cell including intra-box spaces), with `+` at box column junctions.

**Grid format example (N=4, digits up to 16, W=2):**

```
 5  3  . 11 |  . 16  .  . |  .  .  .  . |  .  .  .  .
 .  .  .  . |  1  9  5  . |  .  .  .  . |  .  .  .  .
```

The key rule: **all cells in the grid use the same column width W**, determined once from N² at print time.

### Entry Point Interface

The Entry Point is not a library component — it is the program's main function. It:
1. Reads input (CLI arg or stdin)
2. Calls `Parser.parse` → on failure, prints error and exits non-zero
3. Calls `Validator.validate` → on failure, prints violation report and exits non-zero
4. Calls `Solver.solve` → on failure (no solution), prints message and exits non-zero
5. Calls `PrettyPrinter.toGrid` → prints result and exits 0
6. If no input provided, prints usage message and exits non-zero

---

## Algorithms

### Candidate Propagation

Candidate propagation is the process of keeping each Cell's candidate set consistent with the current board state. It runs after every digit placement.

**Initial candidate computation (for a single cell at row r, col c):**
```
candidates(r, c) =
  {1 … N²}
  minus { value of each filled cell in row r }
  minus { value of each filled cell in column c }
  minus { value of each filled cell in the box containing (r, c) }
```

Note: "filled cell" means a cell whose value ≠ 0. Since filled cells have `candidates = {value}`, you can equivalently compute this as the union of all peers' candidate sets subtracted from {1…N²} — but iterating over values directly is clearer.

**Propagation after placing digit D at (r, c):**
```
set cell(r, c).value = D
set cell(r, c).candidates = {D}   // singleton — not empty
for each peer cell P that shares a unit with (r, c):
  remove D from P.candidates
```

A "peer" of (r, c) is any cell that shares at least one unit with (r, c), excluding (r, c) itself. Each cell has exactly 3×(N²−1) − (overlaps) peers; for N=3 this is 20 peers.

**Propagation after clearing digit D from (r, c) (used during backtracking):**
```
set cell(r, c).value = 0
recompute cell(r, c).candidates from scratch (as above)
for each peer cell P that shares a unit with (r, c):
  if D does not appear as the value of any other filled cell in any shared unit:
    add D back to P.candidates
```

In practice, backtracking implementations often snapshot and restore the full candidate state rather than recomputing incrementally.

---

### Logic Techniques

All logic techniques follow the same contract:
- **Input**: the current Board (with up-to-date candidate sets)
- **Output**: a Boolean indicating whether any progress was made (a digit was placed or a candidate was eliminated)
- **Side effects**: modifies the Board in place (places digits or removes candidates)

The Solver calls techniques in tier order. After any technique returns `true` (progress made), the Solver restarts from Tier 1.

#### Tier 1 — Basic Techniques

**Naked Single**

An empty cell has exactly one candidate remaining. That candidate must be the cell's digit.

```
for each empty cell C on the board (where C.value = 0):
  if |C.candidates| = 1:
    place the single candidate digit in C
    return true (progress made)
return false
```

**Hidden Single**

Within a unit, a digit appears as a candidate in exactly one *empty* cell. That cell must contain that digit.

```
for each unit U:
  for each digit D in 1…N²:
    cells_with_D = [ C in U.cells | D in C.candidates AND C.value = 0 ]
    if |cells_with_D| = 1:
      place D in cells_with_D[0]
      return true
return false
```

Note: the filter `C.value = 0` is essential here. Without it, a filled cell with `candidates = {D}` would be counted, incorrectly treating an already-placed digit as a hidden single candidate.

#### Tier 2 — Intermediate Techniques *(Out of scope for initial implementation)*

> The following techniques are documented for reference but are not implemented. Backtracking handles all cases the basic techniques cannot solve, with acceptable performance (hard 100×100 boards solve in ~120ms).

**Naked Pair**

Two empty cells in a unit share the same candidate set of exactly two digits. Those two digits can be eliminated from all other empty cells in the unit.

```
for each unit U:
  for each pair of empty cells (A, B) in U (where A.value = 0 and B.value = 0):
    if A.candidates = B.candidates and |A.candidates| = 2:
      eliminated = false
      for each other empty cell C in U (C ≠ A, C ≠ B, C.value = 0):
        for each digit D in A.candidates:
          if D in C.candidates:
            remove D from C.candidates
            eliminated = true
      if eliminated: return true
return false
```

**Hidden Pair**

Two digits each appear as candidates in only the same two *empty* cells within a unit. All other candidates can be removed from those two cells.

```
for each unit U:
  for each pair of digits (D1, D2):
    cells_D1 = [ C in U.cells | D1 in C.candidates AND C.value = 0 ]
    cells_D2 = [ C in U.cells | D2 in C.candidates AND C.value = 0 ]
    if cells_D1 = cells_D2 and |cells_D1| = 2:
      (A, B) = cells_D1
      eliminated = false
      for each digit D in A.candidates where D ≠ D1 and D ≠ D2:
        remove D from A.candidates; eliminated = true
      for each digit D in B.candidates where D ≠ D1 and D ≠ D2:
        remove D from B.candidates; eliminated = true
      if eliminated: return true
return false
```

**Pointing Pair/Triple**

Within a box, all candidates for a digit lie in a single row or column (considering only empty cells). That digit can be eliminated from the rest of that row or column outside the box.

```
for each box B:
  for each digit D:
    candidate_cells = [ C in B.cells | D in C.candidates AND C.value = 0 ]
    if |candidate_cells| in {2, 3}:
      rows = set of row indices of candidate_cells
      cols = set of col indices of candidate_cells
      eliminated = false
      if |rows| = 1:
        r = the single row index
        for each empty cell C in row r that is NOT in box B:
          if D in C.candidates:
            remove D from C.candidates; eliminated = true
      else if |cols| = 1:
        c = the single col index
        for each empty cell C in column c that is NOT in box B:
          if D in C.candidates:
            remove D from C.candidates; eliminated = true
      if eliminated: return true
return false
```

**Box-Line Reduction**

Within a row or column, all candidates for a digit lie in a single box (considering only empty cells). That digit can be eliminated from the rest of that box.

```
for each row (or column) L:
  for each digit D:
    candidate_cells = [ C in L.cells | D in C.candidates AND C.value = 0 ]
    if |candidate_cells| in {2, 3}:
      boxes = set of box indices of candidate_cells
      if |boxes| = 1:
        B = the single box
        eliminated = false
        for each empty cell C in box B that is NOT in line L:
          if D in C.candidates:
            remove D from C.candidates; eliminated = true
        if eliminated: return true
return false
```

#### Tier 3 — Advanced Techniques *(Out of scope for initial implementation)*

**Naked Triple**

Three empty cells in a unit have candidate sets that are all subsets of the same three digits. Those three digits can be eliminated from all other empty cells in the unit.

```
for each unit U:
  for each triple of empty cells (A, B, C) in U (where A.value = B.value = C.value = 0):
    union = A.candidates ∪ B.candidates ∪ C.candidates
    if |union| = 3:
      eliminated = false
      for each other empty cell X in U (X ≠ A, B, C, X.value = 0):
        for each digit D in union:
          if D in X.candidates:
            remove D from X.candidates; eliminated = true
      if eliminated: return true
return false
```

**Hidden Triple**

Three digits each appear as candidates in only the same three *empty* cells within a unit. All other candidates can be removed from those three cells.

```
for each unit U:
  for each triple of digits (D1, D2, D3):
    cells_D1 = [ C in U.cells | D1 in C.candidates AND C.value = 0 ]
    cells_D2 = [ C in U.cells | D2 in C.candidates AND C.value = 0 ]
    cells_D3 = [ C in U.cells | D3 in C.candidates AND C.value = 0 ]
    combined = cells_D1 ∪ cells_D2 ∪ cells_D3
    if |combined| = 3:
      eliminated = false
      for each cell X in combined:
        for each digit D in X.candidates where D ∉ {D1, D2, D3}:
          remove D from X.candidates; eliminated = true
      if eliminated: return true
return false
```

**X-Wing**

A digit appears in exactly two empty cells in each of two rows, and those four cells share the same two columns. The digit can be eliminated from all other empty cells in those two columns.

```
for each digit D:
  // Row-based X-Wing
  qualifying_rows = []
  for each row R:
    cells = [ C in R.cells | D in C.candidates AND C.value = 0 ]
    if |cells| = 2:
      qualifying_rows.append( (R, col_indices_of(cells)) )
  for each pair (R1, cols1), (R2, cols2) in qualifying_rows:
    if cols1 = cols2:
      eliminated = false
      for each col index c in cols1:
        for each empty cell X in column c where X is not in R1 or R2:
          if D in X.candidates:
            remove D from X.candidates; eliminated = true
      if eliminated: return true
  // Column-based X-Wing: same logic with rows and columns swapped
return false
```

**Swordfish**

A digit appears in exactly two or three empty cells in each of three rows, and all such cells fall within the same three columns. The digit can be eliminated from all other empty cells in those three columns.

```
for each digit D:
  // Row-based Swordfish
  qualifying_rows = []
  for each row R:
    cells = [ C in R.cells | D in C.candidates AND C.value = 0 ]
    if |cells| in {2, 3}:
      qualifying_rows.append( (R, col_indices_of(cells)) )
  for each triple (R1, cols1), (R2, cols2), (R3, cols3) in qualifying_rows:
    combined_cols = cols1 ∪ cols2 ∪ cols3
    if |combined_cols| = 3:
      eliminated = false
      for each col index c in combined_cols:
        for each empty cell X in column c where X is not in R1, R2, or R3:
          if D in X.candidates:
            remove D from X.candidates; eliminated = true
      if eliminated: return true
  // Column-based Swordfish: same logic with rows and columns swapped
return false
```

---

### Logic-First Solver Algorithm

```
function solve(board):
  validation_result = Validator.validate(board)
  if validation_result is Failure:
    return Failure(INVALID_BOARD, validation_result.violations)

  if board.isSolved():
    return Success(board)

  // Initialize all candidate sets
  for each empty cell C:
    C.candidates = computeCandidates(board, C)

  return solveWithLogic(board)

function solveWithLogic(board):
  loop:
    // Check solved and validate at the top of every iteration.
    // Validation catches both unsolvable inputs and bugs in technique implementations —
    // we do not distinguish between the two at runtime.
    if board.isSolved():
      return Success(board)

    validation_result = Validator.validate(board)
    if validation_result is Failure:
      return Failure(INVALID_BOARD, validation_result.violations)

    progress = false

    // Tier 1: Basic
    if applyNakedSingle(board):  progress = true; continue
    if applyHiddenSingle(board): progress = true; continue

    // Tier 2 and Tier 3 techniques (Naked/Hidden Pair, Pointing Pair,
    // Box-Line Reduction, Naked/Hidden Triple, X-Wing, Swordfish) are
    // out of scope for the initial implementation. Backtracking handles
    // all cases the basic techniques cannot solve.

    // No technique made progress — fall back to backtracking
    break

  if board.isSolved():
    return Success(board)

  return backtrack(board)
```

**Important notes on the loop structure:**
- `isSolved()` is checked at the *top* of every iteration, not just at the end. This avoids running all techniques on a board that was just completed by the previous technique.
- `Validator.validate()` is called at the *top* of every iteration, immediately after the solved check. If any technique introduced an invalid state (duplicate digit in a unit), the solver aborts with `INVALID_BOARD` rather than continuing. This catches both bugs in technique implementations and inputs that become contradictory mid-solve. The two cases are not distinguished at runtime.
- Each `applyXxx` call returns `true` if it made any progress (placed a digit or eliminated a candidate). On `true`, `continue` restarts the loop from the top (re-checking solved and validity before trying Tier 1 again). This ensures simpler techniques are always tried first after any change.

---

### Backtracking Algorithm

Backtracking is used only when all logic techniques are exhausted and the board is not yet solved.

```
function backtrack(board):
  if board.isSolved():
    return Success(board)

  // Select the empty cell with the fewest candidates (MRV heuristic)
  cell = selectEmptyCell(board)
  if cell is None:
    return Failure(NO_SOLUTION)  // no empty cells but board not solved — contradiction

  if |cell.candidates| = 0:
    return Failure(NO_SOLUTION)  // dead end — no candidates for this cell

  for each digit D in cell.candidates (ascending order):
    snapshot = board.clone()
    place D in cell          // sets cell.value = D, cell.candidates = {D}
    propagate candidates

    result = backtrack(board)
    if result is Success:
      return result

    // Restore board state
    board = snapshot

  return Failure(NO_SOLUTION)

function selectEmptyCell(board):
  // Minimum Remaining Values (MRV) heuristic:
  // choose the empty cell (value = 0) with the smallest candidate set.
  // Ties broken by row-major order (row 0 to N²−1, left to right).
  // Note: filled cells have candidates = {value} (size 1) and must be excluded
  // by checking value = 0, not by checking candidate set size.
  best = None
  for each cell C in row-major order where C.value = 0:
    if best is None or |C.candidates| < |best.candidates|:
      best = C
  return best
```

The MRV heuristic significantly reduces the search space by choosing the most constrained cell first. For the basic implementation, row-major order (no MRV) is also acceptable and simpler to implement.

---

## Data Flow Diagram

The following shows how the Entry Point orchestrates the components for a typical solve run:

```
User Input (CLI arg or stdin)
         │
         ▼
    ┌─────────┐
    │  Entry  │
    │  Point  │
    └────┬────┘
         │ jsonString
         ▼
    ┌─────────┐
    │  Parser │ ──── Failure ──► print parse error, exit 1
    └────┬────┘
         │ Board (with Givens set, candidates initialized)
         ▼
    ┌───────────┐
    │ Validator │ ──── Failure ──► print violation report, exit 1
    └─────┬─────┘
          │ Valid Board
          ▼
    ┌────────┐
    │ Solver │ ──── Failure(NO_SOLUTION) ──► print "no solution", exit 1
    └────┬───┘
         │ Solved Board
         ▼
    ┌──────────────┐
    │ PrettyPrinter│
    │  .toGrid()   │
    └──────┬───────┘
           │ formatted string
           ▼
      stdout, exit 0
```

**Internal Solver data flow:**

```
Valid Board
    │
    ▼
Initialize Candidates
    │
    ▼
┌──────────────────────────────────────────────────┐
│  Logic Loop (top of each iteration)              │
│                                                  │
│  1. isSolved? ──yes──► return Success            │
│  2. validate? ──fail─► return INVALID_BOARD      │
│       ↓ (valid, not solved)                      │
│  Tier 1: Naked Single → Hidden Single            │
│       ↓ (no progress)                            │
│  ← restart (continue) after any progress ←      │
└──────────────────────┬───────────────────────────┘
                       │ (all techniques exhausted)
                       ▼
                ┌────────────┐
                │ Backtracking│
                │  (MRV cell  │
                │  selection) │
                └─────┬───────┘
                      │
              Solved Board or NO_SOLUTION
```

---

## Error Handling

All components use the Result type described in the Data Models section. The following table summarizes the error kinds and which components produce them.

| Error Kind | Produced By | Meaning |
|------------|-------------|---------|
| `PARSE_ERROR_STRUCTURAL` | Parser | Input is not valid JSON or not an array of arrays of numbers |
| `PARSE_ERROR_DIMENSIONS` | Parser | Outer array length is not a perfect square N² for N≥2 |
| `PARSE_ERROR_ROW_LENGTH` | Parser | An inner array's length ≠ outer array length |
| `PARSE_ERROR_CELL_VALUE` | Parser | A cell value is not an integer in 0–N² |
| `INVALID_BOARD` | Validator, Solver | A digit appears more than once in a unit |
| `OUT_OF_BOUNDS` | Board | Row or column index is outside 0–(N²−1) |
| `GIVEN_CELL` | Board | Attempt to modify a Given cell |
| `NO_SOLUTION` | Solver | No solved board exists for the input |

**Error propagation rule:** Each component returns its own Result. The Entry Point is the only place that converts Results into exit codes and user-facing messages. Library components never print to stdout/stderr directly.

**Backtracking and errors:** During backtracking, a `NO_SOLUTION` result from a recursive call is not a fatal error — it means "this branch is a dead end, try the next candidate." Only when all candidates are exhausted does the backtracker return `NO_SOLUTION` to its caller.

---

## Testing Strategy

### Overview

Testing uses a dual approach:
- **Unit/example tests**: verify specific behaviors, edge cases, and error conditions with concrete inputs
- **Property-based tests**: verify universal invariants across many randomly generated inputs

Both are necessary. Unit tests catch concrete bugs; property tests verify general correctness across the full input space.

### Property-Based Testing Library Selection

Choose the standard PBT library for your target language:

| Language | Library |
|----------|---------|
| TypeScript | `fast-check` |
| Kotlin | `kotest` (property testing module) |
| Java | `jqwik` |
| Python | `hypothesis` |
| Ruby | `rantly` or `propcheck` |
| Go | `gopter` or `rapid` |
| Rust | `proptest` |
| C | `theft` |

Each property test must run a minimum of **100 iterations**.

### Tag Format

Each property test must include a comment referencing the design property it validates:

```
// Feature: sudoku-solver, Property N: <property text>
```

### Unit Test Focus Areas

- Parser: each error kind with a concrete malformed input
- Validator: boards with known violations (duplicate in row, column, box)
- Solver: known puzzles with known solutions (easy, medium, hard, expert)
- PrettyPrinter: known board → expected JSON string and grid string
- Board: out-of-bounds access, Given cell protection, candidate updates after placement

### Integration Tests

- Full pipeline: parse → validate → solve → print for a set of real puzzles
- Unsolvable puzzle: verify NO_SOLUTION result and correct exit code
- Already-solved board: verify immediate return without modification


---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

The properties below are derived from the acceptance criteria in the requirements document. Each is universally quantified and suitable for property-based testing. Properties that test infrastructure wiring, CLI behavior, or architectural separation are excluded (those are covered by integration and smoke tests).

---

### Property 1: Board Dimensions Invariant

*For any* Box Size N≥2, a constructed Board has exactly N²×N² cells, exactly N² rows, exactly N² columns, and exactly N² boxes, for a total of 3×N² units.

**Validates: Requirements 1.1, 10.1, 10.5**

---

### Property 2: Cell Value Range Invariant

*For any* board state (after any sequence of valid placements and clears), every cell's value is either 0 (empty) or an integer in the range 1–N².

**Validates: Requirements 1.2, 10.2**

---

### Property 3: Cell Access Round-Trip

*For any* valid board, any non-Given empty cell at position (r, c), and any digit D in 1–N²: after placing D at (r, c), reading the cell at (r, c) returns D.

**Validates: Requirements 1.4, 1.5**

---

### Property 4: Given Cell Protection

*For any* board with at least one Given cell, attempting to set any Given cell to any digit returns a Failure result with error kind GIVEN_CELL, and the board state is unchanged.

**Validates: Requirements 1.3, 1.6, 3.8**

---

### Property 5: Out-of-Bounds Error

*For any* board of Box Size N and any index pair (r, c) where r < 0, r ≥ N², c < 0, or c ≥ N²: both getCell(r, c) and setCell(r, c, D) return a Failure result with error kind OUT_OF_BOUNDS.

**Validates: Requirements 1.7**

---

### Property 6: Validator Accepts Valid Boards

*For any* board where no digit appears more than once in any unit (including boards with empty cells), the Validator returns Success.

**Validates: Requirements 2.2, 2.4**

---

### Property 7: Validator Rejects Invalid Boards with Details

*For any* board where at least one digit appears more than once in at least one unit, the Validator returns Failure, and the failure result includes the unit kind (ROW/COLUMN/BOX), unit index, and the conflicting digit for every violating unit.

**Validates: Requirements 2.3, 2.5**

---

### Property 8: Solver Correctness — Solvable Puzzles

*For any* valid board that has at least one solution, the Solver returns a Solved Board such that: (a) every cell contains a digit in 1–N², (b) no digit appears more than once in any unit, and (c) every Given cell retains its original value.

**Validates: Requirements 3.5, 3.8, 9.1, 9.2**

---

### Property 9: Solver Returns NO_SOLUTION for Unsolvable Puzzles

*For any* valid board for which no assignment of digits to empty cells produces a solved board, the Solver returns Failure with error kind NO_SOLUTION.

**Validates: Requirements 3.6, 4.4**

---

### Property 10: Solver Rejects Invalid Boards

*For any* board that the Validator rejects (contains a duplicate digit in some unit), the Solver returns Failure with error kind INVALID_BOARD, and the failure result contains the same violation details that the Validator would produce.

**Validates: Requirements 3.7**

---

### Property 11: Backtracking State Restoration

*For any* board state S before a digit placement attempt during backtracking: if the placement leads to a dead end (no solution reachable from that state), the board state after backtracking is identical to S — including all cell values and all candidate sets.

**Validates: Requirements 4.3**

---

### Property 12: Candidate Set Correctness

*For any* board state and any empty cell at position (r, c): the cell's candidate set equals exactly {1…N²} minus the set of digits already present in row r, column c, and the box containing (r, c). Furthermore, after placing digit D at any cell (r', c'), D does not appear in the candidate set of any peer of (r', c').

**Validates: Requirements 5.1, 5.2, 5.3**

---

### Property 13: Logic Techniques Make No False Eliminations

*For any* valid solvable board B with a unique solution S, and *for any* logic technique T: applying T to B never removes from any cell's candidate set a digit that equals the corresponding digit in S. Equivalently, no logic technique ever eliminates the correct answer for any cell.

**Validates: Requirements 6.1, 6.2, 6.3**

---

### Property 14: Serialization Round-Trip

*For any* valid board B, parsing the JSON output of the Pretty Printer produces a board B' such that: (a) every cell in B' has the same value as the corresponding cell in B, and (b) every cell in B' has the same isGiven flag as the corresponding cell in B.

**Validates: Requirements 7.7, 7.9**

---

### Property 15: Parser Rejects Invalid Inputs with Correct Error Kinds

*For any* input that is structurally invalid, the Parser returns a Failure with the appropriate error kind:
- Input that is not a JSON array of arrays of numbers → PARSE_ERROR_STRUCTURAL
- Outer array length that is not a perfect square N² for any N≥2 → PARSE_ERROR_DIMENSIONS
- Any inner array whose length ≠ outer array length → PARSE_ERROR_ROW_LENGTH (with the correct row index, expected length, and actual length)
- Any cell value that is not an integer in 0–N² → PARSE_ERROR_CELL_VALUE (with the correct row and column position)

**Validates: Requirements 7.2, 7.3, 7.4, 7.5**

---

### Property 16: Solver Determinism

*For any* valid board (including boards with multiple solutions), calling the Solver twice on equivalent board states returns the same solved board both times. When multiple solutions exist, the returned solution is the lexicographically first one in row-major order (smallest digit at the earliest position).

**Validates: Requirements 9.3**

---

## Extensibility Notes

### Variable Board Size (Stretch Goal)

The design is already parameterized by N throughout. To support N≠3:

1. **Board construction**: Replace any hardcoded `9`, `3`, or `81` with expressions derived from N. The Board constructor takes N as its only size parameter.
2. **Parser**: The `parse` function already infers N from the outer array length (find integer N≥2 such that N²= outer length). No API change needed.
3. **PrettyPrinter**: The `toGrid` function places separators every N columns and every N rows. For N=2 (4×4), separators appear after column/row 2; for N=4 (16×16), after column/row 4, 8, 12.
4. **Logic techniques**: All techniques are written in terms of N² (board size) and N (box size). No technique hardcodes 9 or 3.
5. **Digit representation**: For N=4 (16×16), digits 10–16 require two characters. The PrettyPrinter computes column width `W = len(str(N²))` once at print time and right-aligns all cells (digits and empty markers) to that width. For N=3, W=1 (no change from the basic format). For N=4, W=2. For N=5, W=2. For N=10, W=3.

**Testing**: All Property 1 and Property 2 tests should be parameterized over N∈{2, 3, 4} to verify the stretch goal.

### Samurai Sudoku (Stretch Goal)

Samurai Sudoku consists of five overlapping 9×9 boards arranged in an X pattern. The center board shares one box with each corner board.

The design supports this through the Unit abstraction:

1. **Board model**: A Cell can belong to Units from more than one Board. The Cell data model has no reference to a specific Board — it only knows its value, isGiven flag, and candidates. A Samurai puzzle can be represented as a single flat collection of Cells with a merged Unit list.

2. **Solver extensibility**: The Solver's `solve` function accepts a Board (which owns a `units` list). For Samurai Sudoku, construct a composite Board whose `units` list is the union of all five boards' units. The Solver's logic techniques and backtracking operate on `board.allUnits()` — they never assume a fixed 27-unit structure.

3. **Shared cells**: The overlapping boxes contain the same Cell objects in both boards' Unit lists. Candidate propagation naturally handles this: when a digit is placed in a shared cell, it propagates through all units that reference that cell, regardless of which board they belong to.

4. **Parser/PrettyPrinter**: Not required to support Samurai Sudoku in the initial implementation. A future Samurai parser would construct the composite Board and merged Unit list from a Samurai-specific input format.

**Key architectural rule**: Never pass a raw grid or hardcoded indices to the Solver. Always pass a Board with its `units` list. This is the single most important design decision for Samurai extensibility.

---

## Design Decisions and Rationale

| Decision | Rationale |
|----------|-----------|
| Board parameterized by N, not board size | All dimensions derive from one value; prevents inconsistency |
| Units as the Solver's abstraction boundary | Enables Samurai Sudoku without redesigning the Solver |
| Candidates stored on Cell, not computed on demand | Logic techniques need fast candidate lookup; storing them avoids O(N²) recomputation per technique application |
| Result types instead of exceptions | Language-agnostic; maps naturally to every target language's error handling idiom |
| Logic-first, then backtracking | Mirrors human solving; exercises more interesting algorithms; produces solutions faster for easy/medium puzzles |
| MRV heuristic for cell selection in backtracking | Dramatically reduces search space; standard technique in constraint satisfaction |
| JSON array-of-arrays for serialization | Unambiguous for any N; no encoding issues with multi-digit values (N=4 gives digits up to 16) |
| Parser infers N from dimensions | No separate size parameter needed; reduces API surface |
| Restart from Tier 1 after any progress | Ensures simpler techniques are always preferred; mirrors human solving strategy |
