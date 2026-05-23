import { Board } from './primitives/board.js';
import { nakedSingle } from './techniques.js';
import { BoardWithProgress } from './types.js';

export const solveWithLogic = (board: Board): BoardWithProgress => {
  // Check if the board is in a valid state first
  board.validate();
  // Check if the board is solved
  if (board.isFilled()) {
    return { board, solved: true };
  }

  const boardWithProgress = nakedSingle(board);
  if (boardWithProgress.progress) {
    return solveWithLogic(boardWithProgress.board);
  } else {
    return solveWithBackTracking(board);
  }
};

export const solveWithBackTracking = (board: Board): BoardWithProgress => {
  // Check if the board is in a valid state first
  board.validate();
  // Check if the board is solved
  if (board.isFilled()) {
    return { board, solved: true };
  }

  const emptyCell = board.selectEmptyCell();
  const candidates = Array.from(emptyCell.getCandidates());
  for (const candidate of candidates) {
    const clonedBoard = board.clone();
    const clonedCell = clonedBoard.getCellFromCoordinates(
      emptyCell.coordinates
    );
    clonedCell.setValue(candidate);
    clonedBoard.removeCandidatesFromPeers(clonedCell.coordinates, candidate);
    try {
      return solveWithLogic(clonedBoard);
    } catch {
      continue;
    }
  }

  throw new Error('All candidates exhausted! Board is unsolvable!');
};
