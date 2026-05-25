import dev.patientallison.sudoku.Coordinates
import dev.patientallison.sudoku.primitives.Board
import dev.patientallison.sudoku.primitives.Cell
import kotlinx.serialization.json.Json
import kotlin.test.assertEquals

val valid9x9 = loadBoard("/puzzleInputs/9x9/easy/0.json")

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
