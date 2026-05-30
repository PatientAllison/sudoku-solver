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
            return solveWithLogic(clonedBoard)
        } catch (_: Exception) {
            return@forEach
        }
    }

    throw UnsolvableBoardException("All candidates exhausted! Board is unsolvable!")
}

fun solveWithLogic(board: Board): BoardWithProgress {
    // Check if the board is in a valid state first
    board.validate()
    // Check if the board is solved
    if (board.isFilled()) {
        return BoardWithProgress(board, null, true)
    }

    val nakedSingleApplied = nakedSingle(board)
    if (nakedSingleApplied.progress == true) {
        return solveWithLogic(nakedSingleApplied.board)
    }
    val hiddenSingleApplied = hiddenSingle(board)
    if (hiddenSingleApplied.progress == true) {
        return solveWithLogic(hiddenSingleApplied.board)
    }
    return solveWithBackTracking(board)
}
