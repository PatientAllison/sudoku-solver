import dev.patientallison.sudoku.isPositive
import dev.patientallison.sudoku.isPositiveSquare
import org.junit.jupiter.api.Nested
import kotlin.test.Test
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class UtilsTest {
    @Nested
    inner class IsPositive {
        @Test
        fun `returns true for positive integer`() {
            assertTrue(isPositive(5))
        }

        @Test
        fun `returns false for zero`() {
            assertFalse(isPositive(0))
        }

        @Test
        fun `returns false for negative`() {
            assertFalse(isPositive(-1))
        }
    }

    @Nested
    inner class IsPositiveSquare {
        @Test
        fun `returns true for positive square`() {
            assertTrue(isPositiveSquare(9))
        }

        @Test
        fun `returns false for 0`() {
            assertFalse(isPositiveSquare(0))
        }

        @Test
        fun `returns false for negative square`() {
            assertFalse(isPositiveSquare(-9))
        }

        @Test
        fun `returns false for non-square`() {
            assertFalse(isPositiveSquare(3))
        }
    }
}