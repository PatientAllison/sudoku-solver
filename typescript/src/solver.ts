import { Board } from './primitives/board.js';
import { hiddenSingle, nakedSingle } from './techniques.js';
import { BoardWithProgress } from './types.js';

export const solveWithLogic = (board: Board): BoardWithProgress => {
  // Check if the board is in a valid state first
  board.validate();
  // Check if the board is solved
  if (board.isFilled()) {
    return { board, solved: true };
  }

  const nakedSingleApplied = nakedSingle(board);
  if (nakedSingleApplied.progress)
    return solveWithLogic(nakedSingleApplied.board);
  const hiddenSingleApplied = hiddenSingle(board);
  if (hiddenSingleApplied.progress)
    return solveWithLogic(hiddenSingleApplied.board);
  return solveWithBackTracking(board);
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
