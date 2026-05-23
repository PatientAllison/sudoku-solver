import { Board } from './primitives/board.js';
import { Cell } from './primitives/cell.js';
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

export const hiddenSingle = (board: Board): BoardWithProgress => {
  const startingCandidateCount = board.getCandidateCount();

  board.units.forEach((unit) => {
    const cells = board.getCellsForUnit(unit);
    for (let i = 1; i <= board.unitSize; i++) {
      const cellsWithCandidate: Cell[] = [];
      cells.forEach((cell) => {
        if (cell.getValue() === undefined && cell.getCandidates().has(i)) {
          cellsWithCandidate.push(cell);
        }
      });
      if (cellsWithCandidate.length === 1) {
        // We already asserted cellsWithCandidate has length 1, this non-null assertion is safe
        const cellToSet = cellsWithCandidate[0]!;
        cellToSet.setValue(i);
        board.removeCandidatesFromPeers(cellToSet.coordinates, i);
      }
    }
  });

  const endingCandidateCount = board.getCandidateCount();
  const progress = startingCandidateCount - endingCandidateCount > 0;
  return {
    board,
    progress,
  };
};
