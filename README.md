# Sudoku Solver

A multi-language Sudoku solver built as a learning project. The same language-agnostic design is implemented independently in each language, starting with TypeScript and working toward Kotlin, Java, Python, and others.

While AI was used for the design process and some basic setup, all implementation will be done by hand due to this project's nature as a practice project.

## Motivation

This project revisits an old broken Java Sudoku solver I wrote in 2022 as a practice project (located at https://github.com/PatientAllison/SudokuSolver). With 2 years of learning and 2 years of on the job experience with programming under my belt, the goal is to do it properly this time — with a real design, tests, and implementations across multiple languages — as practice for expanding my knowledge of different coding languages.

## Design

The solver uses a **logic-first strategy** before falling back to brute-force backtracking:

1. **Basic** — Naked Single, Hidden Single
2. **Intermediate** — Naked/Hidden Pair, Pointing Pair/Triple, Box-Line Reduction
3. **Advanced** — Naked/Hidden Triple, X-Wing, Swordfish
4. **Backtracking** — only when all logic techniques are exhausted

See https://sudokupulse.com/articles/sudoku-technique-progression/ for an explanation of these techniques.

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
| TypeScript | 🚧 In progress |
| Kotlin | ⏳ Planned |
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
npm run build
node dist/index.js '[[5,3,0,...]]'
# or pipe from stdin:
echo '[[5,3,0,...]]' | node dist/index.js
```

## Testing (TypeScript)

```bash
cd typescript
npm test
```
