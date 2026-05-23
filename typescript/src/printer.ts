import { Board } from './primitives/board.js';

const convertMsToDisplayedTime = (elapsedTime: number) => {
  const milliseconds = Math.floor(elapsedTime % 1000);
  const seconds = Math.floor((elapsedTime / 1000) % 60);
  const minutes = Math.floor((elapsedTime / (1000 * 60)) % 60);
  const hours = Math.floor(elapsedTime / (1000 * 60 * 60));
  // We don't expect even the largest puzzles to take days but can change that if they do
  const msString = milliseconds.toString();

  // Use 00s000ms format
  if (hours === 0 && minutes === 0) {
    // Further breakdown the format to just ms or us
    if (seconds === 0) {
      // Further breakdown to us
      if (milliseconds < 2) {
        const microseconds = Math.floor(elapsedTime * 1000);
        return `${microseconds.toString()}us`;
      }
      return `${msString}ms`;
    } else {
      return `${seconds.toString()}s ${msString.padStart(3, '0')}ms`;
    }
    // Use 00:00:00.000 format
  } else {
    const times: string[] = [];
    if (hours > 0) {
      times.push(hours.toString().padStart(2, '0'));
      times.push(minutes.toString().padStart(2, '0'));
      times.push(seconds.toString().padStart(2, '0'));
    } else {
      times.push(minutes.toString().padStart(2, '0'));
      times.push(seconds.toString().padStart(2, '0'));
    }

    return `${times.join(':')}.${msString.padStart(3, '0')}`;
  }
};

export const printWithStats = (
  board: Board,
  elapsedTime: number,
  startingCandidateCount: number
) => {
  const printedBoard = board.prettyPrint();
  const statsLine = `Stats:`;
  const timeLine = `Time: ${convertMsToDisplayedTime(elapsedTime)}`;
  const currentCandidateCount = board.getCandidateCount();
  const progress =
    ((startingCandidateCount - currentCandidateCount) /
      startingCandidateCount) *
    100;
  const progressLine = `Progress: ${progress.toString()}%`;
  const newLine = '\n';

  const result = [
    printedBoard,
    newLine, // empty line between board and stats
    statsLine,
    timeLine,
    progressLine,
  ];

  return result.join(newLine);
};
