package dev.patientallison.sudoku.primitives

import dev.patientallison.sudoku.HouseType
import dev.patientallison.sudoku.data.Coordinates
import dev.patientallison.sudoku.isPositiveSquare
import kotlin.math.abs
import kotlin.math.sqrt

/**
 * Creates a House, performing appropriate validations for each house type along the way
 * @param houseType Type of the House, row, column, or box
 * @param cellCoordinates Indices of cells contained within the house
 * @throws IllegalArgumentException if the house is invalid somehow
 */
class House(
    val houseType: HouseType,
    cellCoordinates: List<Coordinates>,
) {
    val cellCoordinates: List<Coordinates>
    val topLeftIndex: Coordinates

    init {
        val houseSize = cellCoordinates.size
        require(isPositiveSquare(houseSize)) {
            "Cell count must be a square positive integer! Cell Count: $houseSize"
        }

        val rows = cellCoordinates.map { it.row }.toSet()
        val cols = cellCoordinates.map { it.col }.toSet()

        when (houseType) {
            HouseType.ROW -> {
                validateRowColCoords(houseType, houseSize, rows, cols)
                this.cellCoordinates = cellCoordinates.sortedBy { it.col }
            }
            HouseType.COLUMN -> {
                validateRowColCoords(houseType, houseSize, cols, rows)
                this.cellCoordinates = cellCoordinates.sortedBy { it.row }
            }
            HouseType.BOX -> this.cellCoordinates = validateAndSortBoxCoords(cellCoordinates)
        }

        topLeftIndex = this.cellCoordinates[0]
    }

    /**
     * Perform validations on the cells of a row or column
     * @param houseType Row or Column, used for printing error messages
     * @param houseSize Width of a row or Height of a column
     * @param shouldBeSame The coordinates that should be the same for a given houseType,
     * row for row, col for column
     * @param shouldBeDifferent The coordinates that should be the same for a given houseType,
     * col for row, row for column
     * @throws IllegalArgumentException if the row or column is invalid somehow
     */
    private fun validateRowColCoords(
        houseType: HouseType,
        houseSize: Int,
        shouldBeSame: Set<Int>,
        shouldBeDifferent: Set<Int>,
    ) {
        // Validate all coords have the same row/col value
        require(shouldBeSame.size == 1) {
            "$houseType coords are not in the same ${houseType.name.lowercase()}! " +
                "$houseType coords present: ${shouldBeSame.joinToString{ ", " }}"
        }

        val index = shouldBeSame.elementAt(0)
        require(index < houseSize) {
            "$houseType index is greater than cell count! Index: $index, Cell count: $houseSize"
        }

        val expectedDifferentValues = (0 until houseSize).toSet()
        require(shouldBeDifferent == expectedDifferentValues) {
            val oppositeType =
                when (houseType) {
                    HouseType.ROW -> HouseType.COLUMN
                    HouseType.COLUMN -> HouseType.ROW
                    // This is unreachable but the compiler requires it
                    else -> throw IllegalArgumentException(
                        "This function is only meant to be used with rows and columns! Given house type: $houseType",
                    )
                }
            "Validation of ${oppositeType.name.lowercase()} values in a ${houseType.name} failed!"
        }
    }

    private fun validateAndSortBoxCoords(cellCoords: List<Coordinates>): List<Coordinates> {
        val dupes =
            cellCoords.groupBy { it }
                .filter { it.value.size > 1 }
                .keys

        require(dupes.isEmpty()) { "Not all cell coordinates are unique! Duplicates: $dupes" }

        val sortedCells = cellCoords.sortedWith(compareBy({ it.row }, { it.col }))
        val firstCol = sortedCells[0].col
        val firstRow = sortedCells[0].row

        val boxEdgeSize = sqrt(cellCoords.size.toDouble()).toInt()

        // Validate the box is aligned with the overall board's grid
        val colOffset = firstCol % boxEdgeSize
        require(colOffset == 0) {
            "Box is not aligned with the overall board! " +
                "Offset (to right): $colOffset, " +
                "Offset (to left): ${abs(colOffset - boxEdgeSize)}"
        }

        val rowOffset = firstRow % boxEdgeSize
        require(rowOffset == 0) {
            "Box is not aligned with the overall board! " +
                "Offset (downwards): $rowOffset, " +
                "Offset (upwards): ${abs(rowOffset - boxEdgeSize)}"
        }

        val maxCol = firstCol + boxEdgeSize - 1
        val maxRow = firstRow + boxEdgeSize - 1

        // Validate all cells are within the box's bounds
        sortedCells.forEach {
            // Column is less than first column
            require(it.col >= firstCol) {
                "Cell column is less than first cell's column! " +
                    "First cell column: $firstCol, " +
                    "Violated cell column: ${it.col}"
            }

            // Column is too high to be in the same box as first column
            require(it.col <= maxCol) {
                "Cell column is too high to be in the same box as the first column! " +
                    "First cell column: $firstCol, " +
                    "Box edge size: $boxEdgeSize " +
                    "Violated cell column: ${it.col}"
            }

            // Row is less than first row check not reachable due to sort

            // Row is too high to be in the same box as first column
            require(it.row <= maxRow) {
                "Cell row is too high to be in the same box as the first row! " +
                    "First cell row: $firstRow, " +
                    "Box edge size: $boxEdgeSize " +
                    "Violated cell row: ${it.row}"
            }
        }

        return sortedCells
    }

    override fun toString(): String {
        val houseTypeString = "HouseType: ${houseType.name}"
        val rowString = if (houseType != HouseType.COLUMN) ", Row: ${topLeftIndex.row}" else ""
        val colString = if (houseType != HouseType.ROW) ", Column: ${topLeftIndex.col}" else ""

        return "{ $houseTypeString$rowString$colString }"
    }
}
