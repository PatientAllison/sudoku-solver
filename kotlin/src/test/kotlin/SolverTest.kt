import dev.patientallison.sudoku.exceptions.IllegalBoardException
import dev.patientallison.sudoku.exceptions.UnsolvableBoardException
import dev.patientallison.sudoku.solveWithBackTracking
import org.junit.jupiter.api.Nested
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNull
import kotlin.test.assertTrue

class SolverTest {
    @Nested
    inner class SolveWithBackTracking {
        @Test
        fun `Various boards are solved`() {
            mapOf(
                valid9x9 to solved9x9,
                hard9x9 to solvedHard9x9,
                evil9x9 to solvedEvil9x9,
                // TODO uncomment this once solveWithLogic is implemented and integrated with solveWithBacktracking, we run OOM without it
                // easy100x100 to solvedEasy100x100,
            ).forEach { (key, value) ->
                val board = buildBoard(key)
                board.initializeCandidates()
                val solvedBoardWithProgress = solveWithBackTracking(board)
                val solvedCells = solvedBoardWithProgress.board.cells
                val solvedValues =
                    solvedCells.map { row ->
                        row.map { it.getValue() }
                    }
                assertEquals(value, solvedValues)
                assertEquals(solvedBoardWithProgress.solved, true)
                assertNull(solvedBoardWithProgress.progress)
            }
        }

        @Test
        fun `Already solved board is a no-op`() {
            val board = buildBoard(solved9x9)
            val solvedBoardWithProgress = solveWithBackTracking(board)
            val solvedCells = solvedBoardWithProgress.board.cells
            val solvedValues =
                solvedCells.map { row ->
                    row.map { it.getValue() }
                }
            assertEquals(solved9x9, solvedValues)
            assertEquals(solvedBoardWithProgress.solved, true)
            assertNull(solvedBoardWithProgress.progress)
        }

        @Test
        fun `Invalid board throws validation error`() {
            val board = buildBoard(rowConflict)
            val exception =
                assertFailsWith<IllegalBoardException> {
                    solveWithBackTracking(board)
                }
            assertTrue(exception.message!!.contains("Board is invalid!"))
        }

        @Test
        fun `Unsolvable but not conflicting board throws unsolvable error`() {
            val board = buildBoard(unsolvableBoard)
            val exception =
                assertFailsWith<UnsolvableBoardException> {
                    solveWithBackTracking(board)
                }
            assertTrue(exception.message!!.contains("All candidates exhausted! Board is unsolvable!"))
        }
    }
}
