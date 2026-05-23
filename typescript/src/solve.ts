import { parseArgs } from 'node:util';
import { parse, parseFromFile } from './parser.js';
import { solveWithLogic } from './solver.js';
import { Board } from './primitives/board.js';
import { printWithStats } from './printer.js';

const solve = () => {
  const { values } = parseArgs({
    options: {
      'puzzle-path': { type: 'string' },
      puzzle: { type: 'string' },
    },
  });

  let board: Board;

  if (values['puzzle-path'] !== undefined && values.puzzle !== undefined) {
    console.error('Choose either --puzzle-path or --puzzle, not both!');
    process.exit(1);
  } else if (values['puzzle-path'] !== undefined) {
    board = parseFromFile(values['puzzle-path']);
  } else if (values.puzzle !== undefined) {
    board = parse(values.puzzle);
  } else {
    console.error(
      'Usage: ' +
        'npx tsx src/solve.ts --puzzle-path <path-to-puzzle.json> ' +
        'OR ' +
        'npx tsx src/solve.ts --puzzle <raw puzzle json> '
    );
    process.exit(1);
  }

  board.initializeCandidates();

  const startingCandidateCount = board.getCandidateCount();
  const startingTime = Date.now();
  const solvedBoard = solveWithLogic(board).board;
  console.log(
    printWithStats(solvedBoard, startingTime, startingCandidateCount)
  );
};

solve();
