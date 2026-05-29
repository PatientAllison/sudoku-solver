package dev.patientallison.sudoku

import dev.patientallison.sudoku.data.BoardWithProgress
import dev.patientallison.sudoku.exceptions.UnsolvableBoardException
import dev.patientallison.sudoku.primitives.Board

fun solveWithBackTracking(board: Board): BoardWithProgress {
    // Check if the board is in a valid state first
    board.validate()
    // Check if the board is solved
    if (board.isFilled()) {
        return BoardWithProgress(board, null, true)
    }

    val emptyCell = board.selectEmptyCell()
    val candidates = emptyCell.getCandidates()
    candidates.forEach {
        val clonedBoard = board.clone()
        val clonedCell = clonedBoard.getCellFromCoordinates(emptyCell.coordinates)
        clonedCell.setValue(it)
        clonedBoard.removeCandidatesFromPeers(clonedCell.coordinates, it)
        try {
            return solveWithBackTracking(clonedBoard)
        } catch (_: Exception) {
            return@forEach
        }
    }

    throw UnsolvableBoardException("All candidates exhausted! Board is unsolvable!")
}
