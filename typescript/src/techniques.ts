import { Board } from './primitives/board.js';
import { BoardWithProgress } from './types.js';

export const nakedSingle = (board: Board): BoardWithProgress => {
  const startingCandidateCount = board.getCandidateCount();
  board.cells.flat().forEach((cell) => {
    const candidates = cell.getCandidates();
    if (cell.getValue() === undefined && candidates.size === 1) {
      // We already validated the size was 1, this non-null assertion is safe
      const lastCandidate = candidates.keys().next().value!;
      cell.setValue(lastCandidate);
      board.removeCandidatesFromPeers(cell.coordinates, lastCandidate);
    }
  });

  const endingCandidateCount = board.getCandidateCount();
  const progress = startingCandidateCount - endingCandidateCount > 0;
  return {
    board,
    progress,
  };
};
