package dev.patientallison.sudoku

import dev.patientallison.sudoku.primitives.Board

private fun convertNsToDisplayedTime(elapsedTime: Long): String {
    val milliseconds = ((elapsedTime / 1_000_000) % 1000).toInt()
    val seconds = (elapsedTime / 1_000_000_000).toInt()

    return when {
        seconds == 0 && milliseconds < 2 -> "${elapsedTime}ns"
        seconds == 0 -> "${milliseconds}ms"
        else -> "${seconds}s ${milliseconds.toString().padStart(3, '0')}ms"
    }
}

fun printWithTime(
    board: Board,
    elapsedTime: Long,
): String {
    val printedBoard = board.prettyPrint()
    val timeLine = "Time: ${convertNsToDisplayedTime(elapsedTime)}"
    val newLine = "\n"

    return listOf(
        printedBoard,
        newLine,
        timeLine,
    ).joinToString(newLine)
}
