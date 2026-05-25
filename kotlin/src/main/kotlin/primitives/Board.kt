package dev.patientallison.sudoku.primitives

import dev.patientallison.sudoku.Coordinates
import dev.patientallison.sudoku.HouseType
import dev.patientallison.sudoku.isPositiveSquare
import kotlin.math.sqrt

class Board(
    val cells: List<List<Cell>>,
) {
    val boxEdgeSize: Int
    val houseSize: Int
    val totalBoardSize: Int
    val houses: List<House>

    init {
        require(isPositiveSquare(cells.size)) {
            "Height is not a square! Given height: ${cells.size}"
        }

        val width = cells[0].size
        require(isPositiveSquare(width)) { "Width is not a square! Given width: $width" }
        require(cells.size == width) {
            "Width and height are not the same! Board is not a square! Height: ${cells.size} Width: $width"
        }
        require(cells.all { it.size == width }) {
            "All rows must be the same width! Expected: $width"
        }

        boxEdgeSize = sqrt(cells.size.toDouble()).toInt()
        houseSize = cells.size
        totalBoardSize = houseSize * width
        houses = buildHouses()
    }

    private fun buildHouses(): List<House> {
        val allCoords =
            cells.flatMapIndexed { row, rowCells ->
                rowCells.indices.map { col -> Coordinates(row, col) }
            }

        val rowHouses = allCoords.groupBy { it.row }.values.map { House(HouseType.ROW, it) }
        val colHouses = allCoords.groupBy { it.col }.values.map { House(HouseType.COLUMN, it) }
        val boxHouses =
            allCoords.groupBy { (it.row / boxEdgeSize) * boxEdgeSize + (it.col / boxEdgeSize) }
                .values.map { House(HouseType.BOX, it) }

        return listOf(rowHouses, colHouses, boxHouses).flatten()
    }

    fun clone(): Board {
        val clonedCells = cells.map { row -> row.map { it.clone() } }
        return Board(clonedCells)
    }
}
