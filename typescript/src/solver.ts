import { Board } from './primitives/board.js';

export const solveWithBackTracking = (board: Board): Board => {
  // Check if the board is in a valid state first
  board.validate();
  // Check if the board is solved
  if (board.isFilled()) {
    return board;
  }

  const emptyCell = board.selectEmptyCell();
  const candidates = Array.from(emptyCell.getCandidates());
  for (const candidate of candidates) {
    const clonedBoard = board.clone();
    const clonedCell = clonedBoard.getCellFromCoordinates(
      emptyCell.coordinates
    );
    clonedCell.setValue(candidate);
    try {
      return solveWithBackTracking(clonedBoard);
    } catch {
      continue;
    }
  }

  throw new Error('All candidates exhausted! Board is unsolvable!');
};
