package dev.patientallison.sudoku.primitives

import dev.patientallison.sudoku.data.Coordinates
import dev.patientallison.sudoku.isPositive
import dev.patientallison.sudoku.isPositiveSquare

/**
 * Creates a Cell, performing appropriate validations for  along the way
 * @param coordinates Coordinates of the Cell within the Board
 * @param houseSize Size of a house for the board (used in calculating candidates and cloning)
 * @throws IllegalArgumentException if the house is invalid somehow
 */
class Cell(
    val coordinates: Coordinates,
    private val houseSize: Int,
    givenValue: Int? = null,
) {
    val isGiven = givenValue != null
    private var value = givenValue
    private var candidates: MutableSet<Int>

    init {
        require(isPositiveSquare(houseSize)) { "Unit size must be a square positive integer! Unit size: $houseSize" }
        require(
            coordinates.col < houseSize,
        ) { "Column is greater than or equal to unit size! Column: ${coordinates.col}, Unit size: $houseSize" }
        require(coordinates.row < houseSize) { "Row is greater than or equal to unit size! Row: ${coordinates.row}, Unit size: $houseSize" }

        candidates = (1..houseSize).toMutableSet()

        if (givenValue != null) {
            setValue(givenValue)
        }
    }

    fun getValue(): Int? {
        return value
    }

    fun getCandidates(): Set<Int> {
        return candidates
    }

    fun clone(): Cell {
        val cloned =
            Cell(
                Coordinates(coordinates.row, coordinates.col),
                houseSize,
                if (isGiven) value else null,
            )

        val clonedValue = value
        if (clonedValue != null && !isGiven) cloned.setValue(clonedValue)
        cloned.candidates = candidates.toMutableSet()
        return cloned
    }

    fun removeCandidate(valueToRemove: Int) {
        candidates.remove(valueToRemove)
    }

    fun setValue(newValue: Int) {
        val currentValue = value
        require(currentValue == null || currentValue == newValue) {
            "This cell already has a different value! " +
                "Col: ${this.coordinates.col}, " +
                "Existing Value: $value, " +
                "Your Value: $newValue " +
                "isGiven: $isGiven"
        }

        require(isPositive(newValue)) {
            "Cannot set a value that is not positive! " +
                "Your Value: $newValue"
        }

        require(newValue <= houseSize) {
            "Cannot set a value larger than the unit size! " +
                "Unit Size: $houseSize " +
                "Your Value: $newValue"
        }

        require(candidates.contains(newValue)) {
            "Cannot set a value that is not a valid candidate for the cell! " +
                "Candidates: $candidates " +
                "Your Value: $newValue"
        }

        // All validations passed. Set the value if existing value is undefined
        value = newValue
        candidates = mutableSetOf(newValue)
        // No-op if value is the same
    }

    /**
     * Pretty-prints the cell's value, or periods (for each digit) if empty
     */
    fun print(): String {
        val digitsToPad = houseSize.toString().length
        val valueString = if (value != null) value.toString() else ""
        val digitsOfValue = valueString.length

        return ".".repeat(digitsToPad - digitsOfValue) + valueString
    }

    override fun toString() = "{ Row: ${coordinates.row}, Column: ${coordinates.col}, Value: ${value ?: 0} }"
}
