package primitives

import dev.patientallison.sudoku.Coordinates
import dev.patientallison.sudoku.primitives.Cell
import org.junit.jupiter.api.Nested
import kotlin.test.Test
import kotlin.test.assertContains
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

class CellTest {
    val coordinates = Coordinates(0, 1)
    val houseSize = 9
    val givenValue = 5

    @Nested
    inner class VariableAccess {
        @Test
        fun `Variables are accessible when no value is given`() {
            val expectedCandidates = (1..houseSize).toSet()
            val cell = Cell(coordinates, houseSize)

            assertEquals(coordinates, cell.coordinates)
            assertFalse(cell.isGiven)
            assertEquals(expectedCandidates, cell.getCandidates())
            assertNull(cell.getValue())
        }

        @Test
        fun `Variables are accessible when a value is given`() {
            val expectedCandidates = setOf(givenValue)
            val cell = Cell(coordinates, houseSize, givenValue)

            assertEquals(coordinates, cell.coordinates)
            assertTrue(cell.isGiven)
            assertEquals(expectedCandidates, cell.getCandidates())
            assertNotNull(cell.getValue())
            assertEquals(givenValue, cell.getValue())
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
                    Cell(Coordinates(0, houseSize), houseSize)
                }
            assertTrue(exception.message!!.contains("Column is greater than or equal to unit size!"))
        }

        @Test
        fun `Row out of bounds throws an error`() {
            val exception =
                assertFailsWith<IllegalArgumentException> {
                    Cell(Coordinates(houseSize, 0), houseSize)
                }
            assertTrue(exception.message!!.contains("Row is greater than or equal to unit size!"))
        }

        @Test
        fun `Given non-positive value throws an error`() {
            val exception =
                assertFailsWith<IllegalArgumentException> {
                    Cell(coordinates, houseSize, -1)
                }
            assertTrue(exception.message!!.contains("Cannot set a value that is not positive!"))
        }

        @Test
        fun `Given value too large throws an error`() {
            val exception =
                assertFailsWith<IllegalArgumentException> {
                    Cell(coordinates, houseSize, houseSize + 1)
                }
            assertTrue(exception.message!!.contains("Cannot set a value larger than the unit size!"))
        }
    }

    @Nested
    inner class RemoveCandidate {
        @Test
        fun `Candidate is removed from candidate set`() {
            val valueToRemove = 5
            val cell = Cell(coordinates, houseSize)
            cell.removeCandidate(valueToRemove)

            assertFalse(cell.getCandidates().contains(valueToRemove))
        }
    }

    @Nested
    inner class SetValue {
        @Test
        fun `Attempting to set value for a cell with a different value throws an error`() {
            val cell = Cell(coordinates, houseSize, givenValue)

            val exception =
                assertFailsWith<IllegalArgumentException> {
                    cell.setValue(givenValue - 1)
                }
            assertTrue(exception.message!!.contains("This cell already has a different value!"))
        }

        @Test
        fun `Attempting to set a non-positive value throws an error`() {
            val cell = Cell(coordinates, houseSize)

            val exception =
                assertFailsWith<IllegalArgumentException> {
                    cell.setValue(-1)
                }
            assertTrue(exception.message!!.contains("Cannot set a value that is not positive!"))
        }

        @Test
        fun `Attempting to set a value larger than the unit size throws an error`() {
            val cell = Cell(coordinates, houseSize)

            val exception =
                assertFailsWith<IllegalArgumentException> {
                    cell.setValue(houseSize + 1)
                }
            assertTrue(exception.message!!.contains("Cannot set a value larger than the unit size!"))
        }

        @Test
        fun `Attempting to set a value not in the candidates set throws an error`() {
            val cell = Cell(coordinates, houseSize)
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
            val cell = Cell(coordinates, houseSize)

            cell.setValue(valueToSet)
            assertEquals(valueToSet, cell.getValue())
            assertEquals(expectedCandidates, cell.getCandidates())
        }

        @Test
        fun `setValue is no-op if attempting to set the same valid value`() {
            val expectedCandidates = setOf(givenValue)
            val cell = Cell(coordinates, houseSize, givenValue)

            cell.setValue(givenValue)
            assertEquals(givenValue, cell.getValue())
            assertEquals(expectedCandidates, cell.getCandidates())
        }
    }

    @Nested
    inner class Clone {
        @Test
        fun `Clone creates equivalent cell without a value`() {
            val original = Cell(coordinates, houseSize)
            val clone = original.clone()

            assertCloneEqualsOriginal(original, clone)
            assertFalse(clone.isGiven)
            assertNull(clone.getValue())
        }

        @Test
        fun `Clone creates equivalent cell with a given value`() {
            val original = Cell(coordinates, houseSize, givenValue)
            val clone = original.clone()

            assertCloneEqualsOriginal(original, clone)
            assertTrue(clone.isGiven)
            assertNotNull(clone.getValue())
        }

        @Test
        fun `Clone has same candidates as original`() {
            val candidateToRemove = 1
            val original = Cell(coordinates, houseSize)
            original.removeCandidate(candidateToRemove)
            val clone = original.clone()

            assertCloneEqualsOriginal(original, clone)
            assertFalse(clone.getCandidates().contains(candidateToRemove))
        }

        @Test
        fun `Operations on clone do not affect original`() {
            val candidateToRemove = 1
            val valueToSet = 2

            val original = Cell(coordinates, houseSize)
            val clone = original.clone()

            clone.removeCandidate(candidateToRemove)
            assertContains(original.getCandidates(), candidateToRemove)

            clone.setValue(valueToSet)

            assertNull(original.getValue())
            assertTrue(original.getCandidates().size > 1)
        }

        @Test
        fun `Operations on original do not affect clone`() {
            val candidateToRemove = 1
            val valueToSet = 2

            val original = Cell(coordinates, houseSize)
            val clone = original.clone()

            original.removeCandidate(candidateToRemove)
            assertContains(clone.getCandidates(), candidateToRemove)

            original.setValue(valueToSet)

            assertNull(clone.getValue())
            assertTrue(clone.getCandidates().size > 1)
        }
    }
}

fun assertCloneEqualsOriginal(
    original: Cell,
    clone: Cell,
) {
    assertEquals(original.coordinates, clone.coordinates)
    assertEquals(original.getValue(), clone.getValue())
    assertEquals(original.getCandidates(), clone.getCandidates())
    assertEquals(original.isGiven, clone.isGiven)
}
