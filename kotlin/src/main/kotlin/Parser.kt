package dev.patientallison.sudoku

import dev.patientallison.sudoku.data.Coordinates
import dev.patientallison.sudoku.primitives.Board
import dev.patientallison.sudoku.primitives.Cell
import kotlinx.serialization.json.Json
import java.io.File

fun parse(json: String): Board {
    val parsed = Json.decodeFromString<List<List<Int>>>(json)

    val cells: List<List<Cell>> =
        parsed.mapIndexed { row, values ->
            List(values.size) { col ->
                Cell(
                    Coordinates(row, col),
                    parsed.size,
                    if (parsed[row][col] != 0) parsed[row][col] else null,
                )
            }
        }

    return Board(cells)
}

fun parseFromFile(filePath: String): Board = parse(File(filePath).readText())
