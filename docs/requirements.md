# Requirements Document

## Introduction

A language-agnostic Sudoku Solver that reads a standard Sudoku puzzle, validates it, solves it using a combination of human-style logic techniques and a backtracking algorithm, and outputs the completed board. The design is intended to guide independent implementations in multiple languages (TypeScript, Kotlin, Java, Python, Ruby, Go, Rust, C-family) as a learning exercise. The spec focuses on *what* the solver must do, not *how* to implement it in any specific language.

The primary target is the standard 9×9 puzzle, but the design must remain open to other "square of squares" board sizes (4×4, 16×16, 25×25) as a stretch goal, and to composite puzzle variants such as Samurai Sudoku as a further stretch goal. Neither stretch goal is required for initial implementation.

## Glossary

- **Board**: An N²×N² grid of Cells representing a Sudoku puzzle, where N is the Box size. The standard Board has N=3 (9×9).
- **Box Size (N)**: The side length of a single Box. Determines the full board dimensions (N²×N²), the number of Units (3×N² Units total), and the Digit range (1–N²).
- **Cell**: A single position on the Board, identified by a row index (0–N²−1) and a column index (0–N²−1), containing either an Empty value or a Digit.
- **Digit**: An integer in the range 1–N² inclusive. For a standard Board (N=3), Digits are 1–9.
- **Empty**: The absence of a Digit in a Cell; represented as `0` in serialized form.
- **Given**: A Cell whose Digit is fixed as part of the puzzle input and may not be changed by the Solver.
- **Row**: One of the N² horizontal groups of N² Cells sharing the same row index.
- **Column**: One of the N² vertical groups of N² Cells sharing the same column index.
- **Box**: One of the N² non-overlapping N×N sub-grids of the Board.
- **Unit**: Any Row, Column, or Box — the three constraint groups of a Sudoku puzzle.
- **Candidate Set**: The set of Digits not yet present in any Unit that contains a given Cell.
- **Valid Board**: A Board where no Digit appears more than once in any Unit.
- **Solved Board**: A Valid Board where every Cell contains a Digit.
- **Unsolvable Puzzle**: A puzzle for which no Solved Board exists.
- **Serialized Board**: A JSON representation of a Board as a 2D array of numbers (see Requirement 7).
- **Parser**: The component responsible for converting a Serialized Board into a Board.
- **Pretty Printer**: The component responsible for converting a Board into a human-readable string.
- **Validator**: The component responsible for checking whether a Board is Valid.
- **Solver**: The component responsible for finding a Solved Board from a Valid Board with Givens.
- **Logic Technique**: A deterministic rule that eliminates one or more candidates from one or more Cells without guessing.
- **Samurai Sudoku** *(stretch goal)*: A composite puzzle consisting of five overlapping standard Boards arranged in an X pattern, where each corner Board shares one Box with the center Board.

---

## Requirements

### Requirement 1: Board Representation

**User Story:** As a learner implementing the solver, I want a well-defined Board data model, so that I can represent the puzzle state consistently across all language implementations.

#### Acceptance Criteria

1. THE Board SHALL contain exactly N²×N² Cells arranged in a grid indexed by row (0–N²−1) and column (0–N²−1), where N is the Box Size. For the standard Board, N=3, giving a 9×9 grid of 81 Cells.
2. THE Board SHALL represent each Cell as either Empty or a Digit in the range 1–N².
3. THE Board SHALL distinguish Given Cells from non-Given Cells so that the Solver cannot overwrite a Given.
4. WHEN a Cell is accessed by row and column index, THE Board SHALL return the Cell's current value.
5. WHEN a non-Given Cell is set by row and column index with a Digit, THE Board SHALL update that Cell's value.
6. IF a caller attempts to set a Given Cell, THEN THE Board SHALL refuse the update and return a result indicating the error.
7. IF a caller accesses or sets a Cell using a row or column index outside the range 0–N²−1, THEN THE Board SHALL return a result indicating an out-of-bounds error.

---

### Requirement 2: Constraint Validation

**User Story:** As a learner implementing the solver, I want a Validator that checks Sudoku constraints, so that I can verify puzzle states during solving and understand the rules of the game.

#### Acceptance Criteria

1. THE Validator SHALL check all 3×N² Units: N² Rows (indexed 0–N²−1), N² Columns (indexed 0–N²−1), and N² Boxes (indexed 0–N²−1). For the standard Board (N=3), this is 27 Units.
2. IF no Digit appears more than once in any Unit of a Board, THEN THE Validator SHALL return a result indicating the Board is valid.
3. IF any Digit appears more than once in any Unit of a Board, THEN THE Validator SHALL return a result indicating the Board is invalid.
4. THE Validator SHALL treat Empty Cells as non-conflicting (two Empty Cells in the same Unit do not constitute a violation).
5. WHEN given a Board that is invalid, THE Validator SHALL include in its result the type (Row, Column, or Box) and index (0–N²−1) of each Unit containing a violation.

---

### Requirement 3: Logic-First Solver

**User Story:** As a learner implementing the solver, I want the solver to apply human-style logic techniques before resorting to brute force, so that I can practice implementing constraint propagation and pattern recognition algorithms.

#### Acceptance Criteria

1. WHEN given a Valid Board with Givens, THE Solver SHALL first attempt to fill Empty Cells using Logic Techniques before resorting to backtracking.
2. THE Solver SHALL apply Logic Techniques in order of increasing complexity, exhausting simpler techniques before attempting more complex ones.
3. WHEN a Logic Technique places a Digit or eliminates a candidate, THE Solver SHALL restart the technique sequence from the simplest technique before continuing.
4. WHEN no Logic Technique makes progress, THE Solver SHALL fall back to backtracking (see Requirement 4).
5. WHEN a Solved Board is found (by any method), THE Solver SHALL return it.
6. WHEN no Solved Board exists (Unsolvable Puzzle), THE Solver SHALL return a result that is distinct from a Solved Board, indicating no solution exists.
7. IF the input Board is not Valid, THEN THE Solver SHALL invoke the Validator and return a result containing the Validator's violation report rather than attempting to solve.
8. THE Solver SHALL not modify Given Cells during solving.
9. WHEN the input Board has no Empty Cells and is Valid, THE Solver SHALL return it immediately as a Solved Board without further processing.

---

### Requirement 4: Backtracking Solver

**User Story:** As a learner implementing the solver, I want a backtracking algorithm as a fallback when logic techniques are exhausted, so that the solver can handle any valid puzzle regardless of difficulty.

#### Acceptance Criteria

1. WHEN all Logic Techniques fail to make progress on a Valid Board with remaining Empty Cells, THE Solver SHALL select an Empty Cell and attempt to place a Digit using backtracking.
2. WHEN the Solver places a Digit in an Empty Cell and no solution is reachable from that state, THE Solver SHALL remove that Digit and try the next candidate.
3. WHEN the Solver backtracks, THE Solver SHALL restore the Board to its state before the failed placement, including restoring all Candidate Sets modified during that branch.
4. WHEN the candidate set for an Empty Cell is empty during backtracking, THE Solver SHALL treat this as a dead end and backtrack to the previous decision point.

---

### Requirement 5: Candidate Enumeration

**User Story:** As a learner implementing the solver, I want a way to enumerate and maintain valid candidate Digits for each Cell, so that logic techniques and backtracking can both operate on an up-to-date set of possibilities.

#### Acceptance Criteria

1. WHEN given a Board and a Cell position, THE Solver SHALL compute the Candidate Set as the set of Digits not already present in the Cell's Row, Column, or Box.
2. WHEN a Cell already contains a Digit, THE Solver SHALL return an empty Candidate Set for that Cell.
3. WHEN a Digit is placed in a Cell, THE Solver SHALL remove that Digit from the Candidate Sets of all Cells in the same Row, Column, and Box.
4. WHEN the Solver selects an Empty Cell during backtracking, THE Solver SHALL attempt only the Digits in that Cell's current Candidate Set, in ascending order.

---

### Requirement 6: Logic Techniques

**User Story:** As a learner implementing the solver, I want a defined set of logic techniques implemented in order of complexity, so that I can practice each technique independently and understand how they interact.

#### Acceptance Criteria

1. THE Solver SHALL implement the following Basic techniques:
   - **Naked Single**: IF a Cell's Candidate Set contains exactly one Digit, THEN place that Digit in the Cell.
   - **Hidden Single**: IF a Digit appears in the Candidate Sets of exactly one Cell within a Unit, THEN place that Digit in that Cell.

2. THE Solver SHALL implement the following Intermediate techniques:
   - **Naked Pair**: IF exactly two Cells in a Unit share the same Candidate Set of exactly two Digits, THEN eliminate those two Digits from the Candidate Sets of all other Cells in that Unit.
   - **Hidden Pair**: IF exactly two Digits each appear in the Candidate Sets of only the same two Cells within a Unit, THEN remove all other candidates from those two Cells.
   - **Pointing Pair/Triple**: IF a Digit's candidates within a Box are all confined to a single Row or Column, THEN eliminate that Digit from the Candidate Sets of all other Cells in that Row or Column outside the Box.
   - **Box-Line Reduction**: IF a Digit's candidates within a Row or Column are all confined to a single Box, THEN eliminate that Digit from the Candidate Sets of all other Cells in that Box.

3. THE Solver SHALL implement the following Advanced techniques:
   - **Naked Triple**: IF exactly three Cells in a Unit have Candidate Sets that are subsets of the same three Digits, THEN eliminate those three Digits from the Candidate Sets of all other Cells in that Unit.
   - **Hidden Triple**: IF exactly three Digits each appear only within the same three Cells of a Unit, THEN remove all other candidates from those three Cells.
   - **X-Wing**: IF a Digit appears in exactly two Cells in each of two Rows, and those four Cells share the same two Columns, THEN eliminate that Digit from all other Cells in those two Columns. The same rule applies with Rows and Columns swapped.
   - **Swordfish**: IF a Digit appears in exactly two or three Cells in each of three Rows, and all such Cells fall within the same three Columns, THEN eliminate that Digit from all other Cells in those three Columns. The same rule applies with Rows and Columns swapped.

4. WHEN a technique from a lower complexity tier makes progress, THE Solver SHALL not apply a higher-tier technique until all lower-tier techniques are exhausted again.

5. WHEN none of the Logic Techniques in Requirements 6.1–6.3 make progress, THE Solver SHALL fall back to backtracking as defined in Requirement 4.

---

### Requirement 7: Serialization and Parsing

**User Story:** As a learner implementing the solver, I want to read puzzles from a structured format and write solutions back to that same format, so that I can test my implementation with real puzzle inputs and handle any supported board size without encoding ambiguity.

#### Acceptance Criteria

1. THE Parser SHALL accept a Serialized Board in JSON format: a JSON array of rows, where each row is a JSON array of numbers, `0` represents an Empty Cell, and any non-zero number represents a Given.
2. WHEN a JSON value is provided that is not an array of arrays of numbers (e.g. malformed JSON, wrong types, null values), THE Parser SHALL return a result indicating a structural parse error before performing any Sudoku-specific validation.
3. WHEN the outer array length is not a perfect square (i.e. there is no integer N≥2 such that N²equals the outer array length), THE Parser SHALL return a result indicating the board dimensions are invalid.
4. WHEN any inner array's length differs from the outer array's length, THE Parser SHALL return a result indicating which row is malformed and what length was expected versus received.
5. WHEN any cell value is not an integer in the range 0–N², THE Parser SHALL return a result indicating the invalid value and its row and column position.
6. WHEN a structurally valid JSON input is provided, THE Parser SHALL produce a Board of the correct Box Size N with the correct Givens and Empty Cells.
7. THE Pretty Printer SHALL produce a Serialized Board as a JSON array of arrays of numbers, as described in criterion 1, suitable for round-trip parsing.
8. THE Pretty Printer SHALL also format a Board as a human-readable grid using `|` as column separators at Box boundaries, `-` as row separators at Box boundaries, and spaces between Digits within a Box, suitable for terminal display.
9. FOR ALL valid Boards, parsing the JSON output of the Pretty Printer SHALL produce an equivalent Board (round-trip property).

---

### Requirement 8: Entry Point and Program Flow

**User Story:** As a learner running the solver, I want a clear entry point that ties all components together, so that I can run the solver from the command line and see the result.

#### Acceptance Criteria

1. THE Solver Program SHALL accept a puzzle as a command-line argument; IF no command-line argument is provided, THE Solver Program SHALL read the puzzle from standard input.
2. WHEN a puzzle string is available (from argument or stdin), THE Solver Program SHALL parse it, and if parsing succeeds, validate it, and if validation succeeds, solve it, and if a solution is found, print it using the Pretty Printer.
3. WHEN no puzzle is provided via command-line argument and standard input is empty, THE Solver Program SHALL print a usage message that includes the expected JSON array-of-arrays format and exit with a non-zero status code.
4. WHEN the puzzle is Unsolvable, THE Solver Program SHALL print a message indicating no solution exists and exit with a non-zero status code.
5. WHEN the puzzle input is malformed, THE Solver Program SHALL print an error message indicating the nature of the malformation (wrong length or invalid character) and exit with a non-zero status code.
6. WHEN the puzzle parses successfully but the Validator reports it as invalid, THE Solver Program SHALL print an error message identifying the violating Units and exit with a non-zero status code.
7. WHEN a Solved Board is found, THE Solver Program SHALL print the solution in the human-readable grid format and exit with status code 0.

---

### Requirement 9: Puzzle Scope (Informational)

**User Story:** As a learner, I want to understand the scope of puzzles the solver is expected to handle, so that I can set appropriate expectations for my implementation.

#### Acceptance Criteria

1. THE Solver SHALL accept any Valid Board as input, regardless of the number of Givens or the difficulty of the puzzle.
2. IF a Solved Board exists for the input, THEN THE Solver SHALL return one; THE Solver is not required to verify whether the solution is unique.
3. WHERE multiple solutions exist, THE Solver SHALL return the first solution found by scanning Cells in row-major order (row 0 to row N²−1, left to right within each row) and trying Digits in ascending order (1 through N²).

---

### Requirement 10: Variable Board Size (Stretch Goal)

**User Story:** As a learner, I want the solver to support board sizes beyond 9×9, so that the design remains extensible and I can practice with 4×4 puzzles as a simpler test case.

#### Acceptance Criteria

1. THE Board SHALL be parameterized by Box Size N, supporting any N≥2 that produces a valid "square of squares" grid (N²×N²). Initial implementation targets N=3 (9×9) only.
2. THE Digit range SHALL be 1–N² for a Board of Box Size N.
3. THE Parser SHALL determine the Board's Box Size N from the dimensions of the JSON input: the outer array length must equal N² and each inner array length must also equal N², for some integer N≥2. No separate size parameter is required.
4. THE Pretty Printer SHALL adapt its column and row separator positions to the Box Size N of the Board being printed.
5. THE Validator and Solver SHALL operate correctly for any supported Box Size N without hardcoding N=3.

---

### Requirement 11: Samurai Sudoku (Stretch Goal)

**User Story:** As a learner, I want the design to remain open to supporting Samurai Sudoku puzzles in the future, so that I do not make architectural decisions that would prevent adding this variant later.

#### Acceptance Criteria

1. THE Board model SHALL be designed such that a Cell can belong to Units from more than one Board, enabling composite puzzle structures without requiring a redesign of the core Board or Unit types.
2. THE Solver SHALL be designed such that its constraint-checking logic operates on a provided set of Units rather than assuming a fixed single-Board Unit structure, so that a composite puzzle can supply a merged Unit set.
3. THE Parser and Pretty Printer are not required to support Samurai Sudoku in the initial implementation; this requirement applies only to the Board and Solver interfaces.
