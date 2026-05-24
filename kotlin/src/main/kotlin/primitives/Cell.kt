package dev.patientallison.sudoku.primitives

import dev.patientallison.sudoku.Coordinates
import dev.patientallison.sudoku.isPositive
import dev.patientallison.sudoku.isPositiveSquare

class Cell(
    val coordinates: Coordinates,
    val unitSize: Int,
    givenValue: Int? = null,
) {
    val isGiven = givenValue != null
    var value = givenValue
    var candidates: MutableSet<Int>

    init {
        require(isPositiveSquare(unitSize)) { "Unit size must be a square positive integer! Unit size: $unitSize" }
        require(
            coordinates.col < unitSize,
        ) { "Column is greater than or equal to unit size! Column: ${coordinates.col}, Unit size: $unitSize" }
        require(coordinates.row < unitSize) { "Row is greater than or equal to unit size! Row: ${coordinates.row}, Unit size: $unitSize" }

        candidates = (1..unitSize).toMutableSet()

        if (givenValue != null) {
            setValue(givenValue)
        }
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

        require(newValue <= unitSize) {
            "Cannot set a value larger than the unit size! " +
                "Unit Size: $unitSize " +
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
}
