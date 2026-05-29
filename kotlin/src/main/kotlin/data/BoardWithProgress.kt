package dev.patientallison.sudoku.data

import dev.patientallison.sudoku.primitives.Board

data class BoardWithProgress(
    val board: Board,
    val progress: Boolean?,
    val solved: Boolean?,
)
