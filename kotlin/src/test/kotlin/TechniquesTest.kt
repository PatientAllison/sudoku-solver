import dev.patientallison.sudoku.data.Coordinates
import dev.patientallison.sudoku.nakedSingle
import org.junit.jupiter.api.Nested
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull

class TechniquesTest {
    @Nested
    inner class NakedSingle {
        @Test
        fun `Find naked single`() {
            val board = buildBoard(nakedSingleBoard)
            val coordinates = Coordinates(0, 0)
            // Cell is not yet solved
            assertNull(board.getCellFromCoordinates(coordinates).getValue())

            board.initializeCandidates()
            val boardWithProgress = nakedSingle(board)
            assertNotNull(boardWithProgress.board.getCellFromCoordinates(coordinates).getValue())
            assertEquals(true, boardWithProgress.progress)
        }

        @Test
        fun `Find nothing`() {
            val board = buildBoard(hiddenSingleBoard)
            val coordinates = Coordinates(0, 0)
            // Cell is not yet solved
            assertNull(board.getCellFromCoordinates(coordinates).getValue())

            board.initializeCandidates()
            val boardWithProgress = nakedSingle(board)
            // Cell is still not solved, no progress was made
            assertNull(boardWithProgress.board.getCellFromCoordinates(coordinates).getValue())
            assertEquals(false, boardWithProgress.progress)
        }
    }
}
