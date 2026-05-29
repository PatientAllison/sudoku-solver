import dev.patientallison.sudoku.data.Coordinates
import dev.patientallison.sudoku.primitives.Board
import dev.patientallison.sudoku.primitives.Cell
import kotlinx.serialization.json.Json
import java.util.Random
import kotlin.test.assertEquals

// Valid unsolved puzzles
val easy9x9 = loadBoard("/puzzleInputs/9x9/easy/0.json")
val hard9x9 = loadBoard("/puzzleInputs/9x9/hard/0.json")
val evil9x9 = loadBoard("/puzzleInputs/9x9/evil/0.json")
val easy4x4 = loadBoard("/puzzleInputs/4x4/easy/0.json")
val easy16x16 = loadBoard("/puzzleInputs/16x16/easy/0.json")
val easy100x100 = loadBoard("/puzzleInputs/100x100/easy/0.json")

// Puzzles for specific techniques
val nakedSingleBoard = loadBoard("/testData/techniques/nakedSingle.json")
val hiddenSingleBoard = loadBoard("/testData/techniques/hiddenSingle.json")
val noSingleBoard = loadBoard("/testData/techniques/noSingle.json")

// Conflicting puzzles
val rowConflict = loadBoard("/testData/conflicts/rowConflict.json")
val colConflict = loadBoard("/testData/conflicts/columnConflict.json")
val boxConflict = loadBoard("/testData/conflicts/boxConflict.json")
val fullButInvalid = loadBoard("/testData/conflicts/invalid.json")
val unsolvableBoard = loadBoard("/testData/conflicts/unsolvable.json")

// Solved puzzles
val solved9x9 = loadBoard("/testData/solvedBoards/easy/9x9.json")
val solvedHard9x9 = loadBoard("/testData/solvedBoards/hard/9x9.json")
val solvedEvil9x9 = loadBoard("/testData/solvedBoards/evil/9x9.json")
val solved4x4 = loadBoard("/testData/solvedBoards/easy/4x4.json")
val solved16x16 = loadBoard("/testData/solvedBoards/easy/16x16.json")
val solvedEasy100x100 = loadBoard("/testData/solvedBoards/easy/100x100.json")

private fun loadBoard(path: String): List<List<Int>> {
    val json = object {}::class.java.getResource(path)!!.readText()
    return Json.decodeFromString(json)
}

fun buildCells(values: List<List<Int>>): List<List<Cell>> {
    val unitSize = values.size
    return values.mapIndexed { row, rowValues ->
        rowValues.mapIndexed { col, value ->
            Cell(
                coordinates = Coordinates(row, col),
                houseSize = unitSize,
                givenValue = if (value != 0) value else null,
            )
        }
    }
}

fun buildBoard(values: List<List<Int>>): Board {
    return Board(buildCells(values))
}

fun assertClonedCellEqualsOriginal(
    original: Cell,
    clone: Cell,
) {
    assertEquals(original.coordinates, clone.coordinates)
    assertEquals(original.getValue(), clone.getValue())
    assertEquals(original.getCandidates(), clone.getCandidates())
    assertEquals(original.isGiven, clone.isGiven)
}

fun getRandomIndex(
    max: Int,
    min: Int = 0,
): Int = Random().nextInt(min, max)

fun buildEmptyBoard(houseSize: Int): List<List<Int>> {
    return (0 until houseSize).map {
        (0 until houseSize).map { 0 }
    }
}
