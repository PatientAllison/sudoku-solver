package dev.patientallison.sudoku.primitives

import dev.patientallison.sudoku.HouseType
import dev.patientallison.sudoku.data.Coordinates
import dev.patientallison.sudoku.exceptions.BoardFilledException
import dev.patientallison.sudoku.exceptions.IllegalBoardException
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

    /**
     * Clones the board for use in backtracking
     * @returns A cloned board
     */
    fun clone(): Board {
        val clonedCells = cells.map { row -> row.map { it.clone() } }
        return Board(clonedCells)
    }

    /**
     * Returns cells belonging to a House
     * @returns cells belonging to a House
     */
    fun getCellsForHouse(house: House): List<Cell> {
        return house.cellCoordinates.map { cells[it.row][it.col] }
    }

    /**'
     * Validates that the current board state is valid
     * @throws IllegalBoardException A list of board violations
     */
    fun validate() {
        val violations = mutableMapOf<House, List<Cell>>()

        houses.forEach { house ->
            val cells = getCellsForHouse(house)
            val duplicates =
                cells
                    .filter { it.getValue() != null }
                    .groupBy { it.getValue()!! }
                    .filter { it.value.size > 1 }

            duplicates.values.forEach {
                if (it.size > 1) violations[house] = it
            }
        }

        if (violations.isNotEmpty()) {
            val stringifiedViolations =
                violations.entries.map { entry ->
                    val stringifiedCells = entry.value.joinToString(", ") { it.toString() }
                    "{ Violated House: ${entry.key}, Violated Cells: $stringifiedCells"
                }
            throw IllegalBoardException("Board is invalid! Violations: [ ${stringifiedViolations.joinToString(", ")} ]")
        }
    }

    /**
     * Determines if every cell in the board has a value. Does not check validity
     * @returns if the board is already filled
     */
    fun isFilled() = cells.flatten().all { it.getValue() != null }

    /**
     * Determines if the board is already solved
     * @returns If the board is solved or not
     */
    fun isSolved(): Boolean {
        try {
            validate()
        } catch (_: IllegalBoardException) {
            return false
        }

        return isFilled()
    }

    /**
     * Get the empty cell with the fewest candidates (the best cell for use in backtracking)
     * @returns the empty cell with the fewest candidates
     * @throws BoardFilledException if the board is already filled and there are no empty cells
     */
    fun selectEmptyCell(): Cell {
        val emptyCells = cells.flatten().filter { it.getValue() == null }

        if (emptyCells.isEmpty()) {
            throw BoardFilledException("Board is already filled! There are no empty cells!")
        }

        return emptyCells.minBy { it.getCandidates().size }
    }

    /**
     * Get a cell from Coordinates
     * @return Cell for the requested Coordinates
     * @throws IllegalArgumentException if Coordinates are out of bounds for the board
     */
    fun getCellFromCoordinates(coordinates: Coordinates): Cell {
        require(coordinates.row < houseSize) {
            "Requested row is out of bounds for this board! Requested row: ${coordinates.row}, Max row: $houseSize"
        }

        require(coordinates.col < houseSize) {
            "Requested column is out of bounds for this board! Requested column: ${coordinates.col}, Max column: $houseSize"
        }

        return cells[coordinates.row][coordinates.col]
    }

    fun getHousesFromCoordinates(coordinates: Coordinates): List<House> {
        return houses.filter { house ->
            house.cellCoordinates.any { it.row == coordinates.row && it.col == coordinates.col }
        }
    }

    fun getPeersFromCoordinates(coordinates: Coordinates): List<Cell> {
        val housesForCell = getHousesFromCoordinates(coordinates)
        val houseCoordinates = housesForCell.flatMap { it.cellCoordinates }
        val otherCoordinates = houseCoordinates.filterNot { it == coordinates }.distinct()
        return otherCoordinates.map { getCellFromCoordinates(it) }
    }

    fun removeCandidatesFromPeers(
        coordinates: Coordinates,
        value: Int,
    ) {
        getPeersFromCoordinates(coordinates).forEach { it.removeCandidate(value) }
    }

    fun initializeCandidates() {
        this.cells.flatten().forEach {
            val value = it.getValue()
            if (value != null) removeCandidatesFromPeers(it.coordinates, value)
        }
    }

    fun getCandidateCount() =
        cells.flatten().sumOf {
            if (it.getValue() == null) it.getCandidates().size else 0
        }

    fun prettyPrint(): String {
        val rows = mutableListOf<String>()
        (0 until houseSize).forEach { row ->
            val cellsList = mutableListOf<String>()
            (0 until houseSize).forEach { col ->
                val plusOne = col + 1
                val notAtEnd = plusOne != houseSize
                var cellString = cells[row][col].print()
                if (notAtEnd) cellString += " "
                if (plusOne % boxEdgeSize == 0 && notAtEnd) cellString += "| "
                cellsList.add(cellString)
            }
            rows.add(cellsList.joinToString(""))
            val plusOne = row + 1
            val notAtEnd = plusOne != houseSize
            if (plusOne % boxEdgeSize == 0 && notAtEnd) {
                rows.add(getHorizontalDivider())
            }
        }

        val separator = if (houseSize.toString().length > 2) "\n\n" else "\n"
        return rows.joinToString(separator)
    }

    private fun getHorizontalDivider(): String {
        val cellWidth = houseSize.toString().length
        val divider = mutableListOf<String>()
        (0 until boxEdgeSize).forEach {
            val plusOne = it + 1
            val isMiddle = it != 0 && plusOne != boxEdgeSize
            // Add one box worth of divisions
            var boxDivider = "-".repeat(boxEdgeSize * (cellWidth + 1))
            // Add one extra to account for the extra space between the vertical divider and the first element
            if (isMiddle) boxDivider += "-"
            if (plusOne != boxEdgeSize) boxDivider += "+"
            divider.add(boxDivider)
        }
        return divider.joinToString("")
    }
}
