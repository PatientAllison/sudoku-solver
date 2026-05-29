package dev.patientallison.sudoku

import dev.patientallison.sudoku.data.BoardWithProgress
import dev.patientallison.sudoku.primitives.Board

fun nakedSingle(board: Board): BoardWithProgress {
    val startingCandidateCount = board.getCandidateCount()
    board.cells.flatten().forEach {
        val candidates = it.getCandidates()
        if (it.getValue() == null && candidates.size == 1) {
            val lastCandidate = candidates.first()
            it.setValue(lastCandidate)
            board.removeCandidatesFromPeers(it.coordinates, lastCandidate)
        }
    }
    val endingCandidateCount = board.getCandidateCount()
    val progress = endingCandidateCount < startingCandidateCount
    return BoardWithProgress(board, progress, null)
}
