# Sudoku Solver

A multi-language Sudoku solver built as a learning project. The same language-agnostic design is implemented independently in each language, starting with TypeScript and working toward Kotlin, Java, Python, and others.

While AI was used for the design process and some basic setup, all implementation will be done by hand due to this project's nature as a practice project.

## Motivation

This project revisits an old broken Java Sudoku solver I wrote in 2022 as a practice project (located at https://github.com/PatientAllison/SudokuSolver). With 2 years of learning and 2 years of on the job experience with programming under my belt, the goal is to do it properly this time — with a real design, tests, and implementations across multiple languages — as practice for expanding my knowledge of different coding languages.

## Design

The solver uses a **logic-first strategy** before falling back to brute-force backtracking:

1. **Basic** — Naked Single, Hidden Single
2. **Backtracking** — when logic techniques are exhausted

Higher-level techniques (Naked/Hidden Pairs, X-Wing, Swordfish, etc.) are out of scope for the initial implementation — backtracking handles all cases the basic techniques can't solve, and performance is already excellent (hard 100×100 boards solve in ~120ms).

Puzzles are accepted as JSON arrays-of-arrays, which handles any board size without encoding ambiguity:

```json
[
  [5,3,0, 0,7,0, 0,0,0],
  [6,0,0, 1,9,5, 0,0,0],
  [0,9,8, 0,0,0, 0,6,0],

  [8,0,0, 0,6,0, 0,0,3],
  [4,0,0, 8,0,3, 0,0,1],
  [7,0,0, 0,2,0, 0,0,6],

  [0,6,0, 0,0,0, 2,8,0],
  [0,0,0, 4,1,9, 0,0,5],
  [0,0,0, 0,8,0, 0,7,9]
]
```

`0` represents an empty cell. The board size is inferred from the array dimensions — any "square of squares" (4×4, 9×9, 16×16, 25×25) is supported by design.

Full design documentation, including data models, algorithm pseudocode, and correctness properties for property-based testing, lives in [`docs/design.md`](docs/design.md).

## Languages

| Language | Status |
|----------|--------|
| TypeScript | ✅ Complete |
| Kotlin | ✅ Complete |
| Java | ⏳ Planned |
| Python | ⏳ Planned |
| Ruby | ⏳ Planned |
| Go | ⏳ Planned |
| Rust | ⏳ Planned |
| C/C++/C# | ⏳ Planned |

## Repository Structure

```
sudoku-solver/
├── docs/                  # Language-agnostic design and requirements
│   ├── requirements.md
│   ├── design.md
│   └── tasks.md
├── typescript/            # TypeScript implementation
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

## Running (TypeScript)

```bash
cd typescript
npm install
npx tsx src/solve.ts --puzzle-path ../resources/puzzleInputs/9x9/easy/0.json
# or pass puzzle JSON directly:
npx tsx src/solve.ts --puzzle '[[5,3,0,...]]'
```

## Testing (TypeScript)

```bash
cd typescript
npm test
```
