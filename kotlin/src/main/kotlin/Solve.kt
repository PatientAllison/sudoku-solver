package dev.patientallison.sudoku

fun main(args: Array<String>) {
    val puzzlePath = parseArg(args, "--puzzle-path")
    val puzzle = parseArg(args, "--puzzle")

    val board = when {
        puzzlePath != null && puzzle != null -> {
            System.err.println("Choose either --puzzle-path or --puzzle, not both!")
            return
        }
        puzzlePath != null -> parseFromFile(puzzlePath)
        puzzle != null -> parse(puzzle)
        else -> {
            System.err.println("Usage: --puzzle-path <path> OR --puzzle <json>")
            return
        }
    }

    board.initializeCandidates()
    val startTime = System.nanoTime()
    solveWithLogic(board).board
    val elapsed = System.nanoTime() - startTime
    println("Board is solved!")
    println("Time: ${elapsed / 1_000_000}ms")
}

private fun parseArg(args: Array<String>, key: String): String? =
    args.indexOf(key).let { if (it >= 0) args.getOrNull(it + 1) else null }

