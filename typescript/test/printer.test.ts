import { describe, expect, test, vi } from 'vitest';
import { printWithTime } from '../src/printer';
import { buildBoard, solvedBoard, validBoard } from './fixtures';

describe('printWithTime', () => {
  test('Prints board with 500 us time', () => {
    // Set up board
    const board = buildBoard(validBoard);
    const printedBoard = board.prettyPrint();

    // Set up time
    const elapsedTime = 0.5;
    const us = elapsedTime * 1000;

    const result = printWithTime(board, elapsedTime);

    expect(result).toMatch(new RegExp(printedBoard));
    expect(result).toMatch(new RegExp(`Time: ${us.toString()}us`));
  });

  test('Prints board with 1.5 ms time', () => {
    // Set up board
    const board = buildBoard(validBoard);
    const printedBoard = board.prettyPrint();

    // Set up time
    const elapsedTime = 1.5;
    const us = elapsedTime * 1000;

    const result = printWithTime(board, elapsedTime);

    expect(result).toMatch(new RegExp(printedBoard));
    expect(result).toMatch(new RegExp(`Time: ${us.toString()}us`));
  });

  test('Prints board with 50ms time', () => {
    // Set up board
    const finishedBoard = buildBoard(solvedBoard);
    const printedBoard = finishedBoard.prettyPrint();

    // Set up time
    const elapsedTime = 50;

    const result = printWithTime(finishedBoard, elapsedTime);

    expect(result).toMatch(new RegExp(printedBoard));
    expect(result).toMatch(new RegExp(`Time: ${elapsedTime.toString()}ms`));
  });

  test('Prints board with 999ms time', () => {
    // Set up board
    const finishedBoard = buildBoard(solvedBoard);
    const printedBoard = finishedBoard.prettyPrint();

    // Set up time
    const elapsedTime = 999;

    const result = printWithTime(finishedBoard, elapsedTime);

    expect(result).toMatch(new RegExp(printedBoard));
    expect(result).toMatch(
      new RegExp(`Time: ${elapsedTime.toString().padStart(3, '0')}ms`)
    );
  });

  test('Prints board with 30s time', () => {
    // Set up board
    const finishedBoard = buildBoard(solvedBoard);
    const printedBoard = finishedBoard.prettyPrint();

    // Set up time
    const seconds = 30;
    const milliseconds = 0;
    const elapsedTime = seconds * 1000 + milliseconds;

    const result = printWithTime(finishedBoard, elapsedTime);

    expect(result).toMatch(new RegExp(printedBoard));
    expect(result).toMatch(
      new RegExp(
        `Time: ${seconds.toString().padStart(2, '0')}s ${milliseconds.toString().padStart(3, '0')}ms`
      )
    );
  });

  test('Prints board with 59.999 time', () => {
    // Set up board
    const finishedBoard = buildBoard(solvedBoard);
    const printedBoard = finishedBoard.prettyPrint();

    // Set up time
    const seconds = 59;
    const milliseconds = 999;
    const elapsedTime = seconds * 1000 + milliseconds;

    const result = printWithTime(finishedBoard, elapsedTime);

    expect(result).toMatch(new RegExp(printedBoard));
    expect(result).toMatch(
      new RegExp(
        `Time: ${seconds.toString().padStart(2, '0')}s ${milliseconds.toString().padStart(3, '0')}ms`
      )
    );
  });

  test('Prints board with 1m time', () => {
    // Set up board
    const finishedBoard = buildBoard(solvedBoard);
    const printedBoard = finishedBoard.prettyPrint();

    // Set up time
    const minutes = 1;
    const seconds = 0;
    const milliseconds = 0;
    const elapsedTime = minutes * 60 * 1000 + seconds * 1000 + milliseconds;
    const minutesString = minutes.toString().padStart(2, '0');
    const secondsString = seconds.toString().padStart(2, '0');
    const millisecondsString = milliseconds.toString().padStart(3, '0');

    const result = printWithTime(finishedBoard, elapsedTime);

    expect(result).toMatch(new RegExp(printedBoard));
    expect(result).toMatch(
      new RegExp(
        `Time: ${[minutesString, secondsString].join(':')}.${millisecondsString}`
      )
    );
  });

  test('Prints board with 1m30s500ms time', () => {
    // Set up board
    const finishedBoard = buildBoard(solvedBoard);
    const printedBoard = finishedBoard.prettyPrint();

    // Set up time
    const minutes = 1;
    const seconds = 30;
    const milliseconds = 500;
    const elapsedTime = minutes * 60 * 1000 + seconds * 1000 + milliseconds;
    const minutesString = minutes.toString().padStart(2, '0');
    const secondsString = seconds.toString().padStart(2, '0');
    const millisecondsString = milliseconds.toString().padStart(3, '0');

    const result = printWithTime(finishedBoard, elapsedTime);

    expect(result).toMatch(new RegExp(printedBoard));
    expect(result).toMatch(
      new RegExp(
        `Time: ${[minutesString, secondsString].join(':')}.${millisecondsString}`
      )
    );
  });

  test('Prints board with 1h time', () => {
    // Set up board
    const finishedBoard = buildBoard(solvedBoard);
    const printedBoard = finishedBoard.prettyPrint();

    // Set up time
    const hours = 1;
    const minutes = 0;
    const seconds = 0;
    const milliseconds = 0;
    const elapsedTime =
      hours * 60 * 60 * 1000 +
      minutes * 60 * 1000 +
      seconds * 1000 +
      milliseconds;
    const hoursString = hours.toString().padStart(2, '0');
    const minutesString = minutes.toString().padStart(2, '0');
    const secondsString = seconds.toString().padStart(2, '0');
    const millisecondsString = milliseconds.toString().padStart(3, '0');

    const result = printWithTime(finishedBoard, elapsedTime);

    expect(result).toMatch(new RegExp(printedBoard));
    expect(result).toMatch(
      new RegExp(
        `Time: ${[hoursString, minutesString, secondsString].join(':')}.${millisecondsString}`
      )
    );
  });

  test('Prints board with 23h59m59s999ms time', () => {
    // Set up board
    const finishedBoard = buildBoard(solvedBoard);
    const printedBoard = finishedBoard.prettyPrint();

    // Set up time
    const hours = 23;
    const minutes = 59;
    const seconds = 59;
    const milliseconds = 59;
    const elapsedTime =
      hours * 60 * 60 * 1000 +
      minutes * 60 * 1000 +
      seconds * 1000 +
      milliseconds;
    const hoursString = hours.toString().padStart(2, '0');
    const minutesString = minutes.toString().padStart(2, '0');
    const secondsString = seconds.toString().padStart(2, '0');
    const millisecondsString = milliseconds.toString().padStart(3, '0');

    const result = printWithTime(finishedBoard, elapsedTime);

    expect(result).toMatch(new RegExp(printedBoard));
    expect(result).toMatch(
      new RegExp(
        `Time: ${[hoursString, minutesString, secondsString].join(':')}.${millisecondsString}`
      )
    );
  });

  test('Prints board with 24h time', () => {
    // Set up board
    const finishedBoard = buildBoard(solvedBoard);
    const printedBoard = finishedBoard.prettyPrint();

    // Set up time
    const hours = 24;
    const minutes = 0;
    const seconds = 0;
    const milliseconds = 0;
    const elapsedTime =
      hours * 60 * 60 * 1000 +
      minutes * 60 * 1000 +
      seconds * 1000 +
      milliseconds;
    const hoursString = hours.toString().padStart(2, '0');
    const minutesString = minutes.toString().padStart(2, '0');
    const secondsString = seconds.toString().padStart(2, '0');
    const millisecondsString = milliseconds.toString().padStart(3, '0');

    const result = printWithTime(finishedBoard, elapsedTime);

    expect(result).toMatch(new RegExp(printedBoard));
    expect(result).toMatch(
      new RegExp(
        `Time: ${[hoursString, minutesString, secondsString].join(':')}.${millisecondsString}`
      )
    );
  });

  test('Prints board with 1 week time', () => {
    // Set up board
    const finishedBoard = buildBoard(solvedBoard);
    const printedBoard = finishedBoard.prettyPrint();

    // Set up time
    const hours = 168;
    const minutes = 0;
    const seconds = 0;
    const milliseconds = 0;
    const elapsedTime =
      hours * 60 * 60 * 1000 +
      minutes * 60 * 1000 +
      seconds * 1000 +
      milliseconds;
    const hoursString = hours.toString().padStart(2, '0');
    const minutesString = minutes.toString().padStart(2, '0');
    const secondsString = seconds.toString().padStart(2, '0');
    const millisecondsString = milliseconds.toString().padStart(3, '0');

    const result = printWithTime(finishedBoard, elapsedTime);

    expect(result).toMatch(new RegExp(printedBoard));
    expect(result).toMatch(
      new RegExp(
        `Time: ${[hoursString, minutesString, secondsString].join(':')}.${millisecondsString}`
      )
    );
  });
});
