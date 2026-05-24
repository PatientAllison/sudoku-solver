package primitives

import dev.patientallison.sudoku.Coordinates
import dev.patientallison.sudoku.primitives.Cell
import org.junit.jupiter.api.Nested
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

class CellTest {
    val coordinates = Coordinates(0, 1)
    val unitSize = 9
    val givenValue = 5

    @Nested
    inner class VariableAccess {
        @Test
        fun `Variables are accessible when no value is given`() {
            val expectedCandidates = (1..unitSize).toSet()
            val cell = Cell(coordinates, unitSize)

            assertEquals(coordinates, cell.coordinates)
            assertFalse(cell.isGiven)
            assertEquals(expectedCandidates, cell.candidates)
            assertNull(cell.value)
        }

        @Test
        fun `Variables are accessible when a value is given`() {
            val expectedCandidates = setOf(givenValue)
            val cell = Cell(coordinates, unitSize, givenValue)

            assertEquals(coordinates, cell.coordinates)
            assertTrue(cell.isGiven)
            assertEquals(expectedCandidates, cell.candidates)
            assertNotNull(cell.value)
            assertEquals(givenValue, cell.value)
        }
    }

    @Nested
    inner class ConstructorValidations {
        @Test
        fun `Non-square unit size throws an error`() {
            val exception =
                assertFailsWith<IllegalArgumentException> {
                    Cell(coordinates, 10)
                }
            assertTrue(exception.message!!.contains("Unit size must be a square positive integer"))
        }

        @Test
        fun `Column out of bounds throws an error`() {
            val exception =
                assertFailsWith<IllegalArgumentException> {
                    Cell(Coordinates(0, unitSize), unitSize)
                }
            assertTrue(exception.message!!.contains("Column is greater than or equal to unit size!"))
        }

        @Test
        fun `Row out of bounds throws an error`() {
            val exception =
                assertFailsWith<IllegalArgumentException> {
                    Cell(Coordinates(unitSize, 0), unitSize)
                }
            assertTrue(exception.message!!.contains("Row is greater than or equal to unit size!"))
        }

        @Test
        fun `Given non-positive value throws an error`() {
            val exception =
                assertFailsWith<IllegalArgumentException> {
                    Cell(coordinates, unitSize, -1)
                }
            assertTrue(exception.message!!.contains("Cannot set a value that is not positive!"))
        }

        @Test
        fun `Given value too large throws an error`() {
            val exception =
                assertFailsWith<IllegalArgumentException> {
                    Cell(coordinates, unitSize, unitSize + 1)
                }
            assertTrue(exception.message!!.contains("Cannot set a value larger than the unit size!"))
        }
    }

    @Nested
    inner class RemoveCandidate {
        @Test
        fun `Candidate is removed from candidate set`() {
            val valueToRemove = 5
            val cell = Cell(coordinates, unitSize)
            cell.removeCandidate(valueToRemove)

            assertFalse(cell.candidates.contains(valueToRemove))
        }
    }

    @Nested
    inner class SetValue {
        @Test
        fun `Attempting to set value for a cell with a different value throws an error`() {
            val cell = Cell(coordinates, unitSize, givenValue)

            val exception =
                assertFailsWith<IllegalArgumentException> {
                    cell.setValue(givenValue - 1)
                }
            assertTrue(exception.message!!.contains("This cell already has a different value!"))
        }

        @Test
        fun `Attempting to set a non-positive value throws an error`() {
            val cell = Cell(coordinates, unitSize)

            val exception =
                assertFailsWith<IllegalArgumentException> {
                    cell.setValue(-1)
                }
            assertTrue(exception.message!!.contains("Cannot set a value that is not positive!"))
        }

        @Test
        fun `Attempting to set a value larger than the unit size throws an error`() {
            val cell = Cell(coordinates, unitSize)

            val exception =
                assertFailsWith<IllegalArgumentException> {
                    cell.setValue(unitSize + 1)
                }
            assertTrue(exception.message!!.contains("Cannot set a value larger than the unit size!"))
        }

        @Test
        fun `Attempting to set a value not in the candidates set throws an error`() {
            val cell = Cell(coordinates, unitSize)
            val valueToSet = 3
            cell.removeCandidate(valueToSet)

            val exception =
                assertFailsWith<IllegalArgumentException> {
                    cell.setValue(valueToSet)
                }
            assertTrue(exception.message!!.contains("Cannot set a value that is not a valid candidate for the cell!"))
        }

        @Test
        fun `Set value if value is valid and not already set`() {
            val valueToSet = 4
            val expectedCandidates = setOf(valueToSet)
            val cell = Cell(coordinates, unitSize)

            cell.setValue(valueToSet)
            assertEquals(valueToSet, cell.value)
            assertEquals(expectedCandidates, cell.candidates)
        }

        @Test
        fun `setValue is no-op if attempting to set the same valid value`() {
            val expectedCandidates = setOf(givenValue)
            val cell = Cell(coordinates, unitSize, givenValue)

            cell.setValue(givenValue)
            assertEquals(givenValue, cell.value)
            assertEquals(expectedCandidates, cell.candidates)
        }
    }
}
