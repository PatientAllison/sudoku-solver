import dev.patientallison.sudoku.printWithTime
import org.junit.jupiter.api.Test
import kotlin.test.assertTrue

class PrinterTest {
    @Test
    fun `Prints board with 500ns time`() {
        // Set up board
        val board = buildBoard(easy9x9)
        val printedBoard = board.prettyPrint()

        // Set up time
        val elapsedTime = 500L

        val result = printWithTime(board, elapsedTime)

        assertTrue(result.contains(printedBoard))
        assertTrue(result.contains("Time: ${elapsedTime}ns"))
    }

    @Test
    fun `Prints board with 1point5 ms time`() {
        // Set up board
        val board = buildBoard(easy9x9)
        val printedBoard = board.prettyPrint()

        // Set up time
        val elapsedTime = (1.5 * 1_000_000).toLong()

        val result = printWithTime(board, elapsedTime)

        assertTrue(result.contains(printedBoard))
        assertTrue(result.contains("Time: ${elapsedTime}ns"))
    }

    @Test
    fun `Prints board with 50 ms time`() {
        // Set up board
        val board = buildBoard(easy9x9)
        val printedBoard = board.prettyPrint()

        // Set up time
        val ms = 50L
        val elapsedTime = ms * 1_000_000L

        val result = printWithTime(board, elapsedTime)

        assertTrue(result.contains(printedBoard))
        assertTrue(result.contains("Time: ${ms}ms"))
    }

    @Test
    fun `Prints board with 999 ms time`() {
        // Set up board
        val board = buildBoard(easy9x9)
        val printedBoard = board.prettyPrint()

        // Set up time
        val ms = 999L
        val elapsedTime = ms * 1_000_000L

        val result = printWithTime(board, elapsedTime)

        assertTrue(result.contains(printedBoard))
        assertTrue(result.contains("Time: ${ms}ms"))
    }

    @Test
    fun `Prints board with 30s time`() {
        // Set up board
        val board = buildBoard(easy9x9)
        val printedBoard = board.prettyPrint()

        // Set up time
        val msRemainder = 0L
        val seconds = 30L
        val ms = seconds * 1000L + msRemainder
        val msString = msRemainder.toString()
        val elapsedTime = ms * 1_000_000L

        val result = printWithTime(board, elapsedTime)

        assertTrue(result.contains(printedBoard))
        assertTrue(result.contains("Time: ${seconds.toString().padStart(2, '0')}s ${msString.padStart(3, '0')}ms"))
    }

    @Test
    fun `Prints board with 59s999ms time`() {
        // Set up board
        val board = buildBoard(easy9x9)
        val printedBoard = board.prettyPrint()

        // Set up time
        val msRemainder = 999L
        val seconds = 59L
        val ms = seconds * 1000L + msRemainder
        val msString = msRemainder.toString()
        val elapsedTime = ms * 1_000_000L

        val result = printWithTime(board, elapsedTime)

        assertTrue(result.contains(printedBoard))
        assertTrue(result.contains("Time: ${seconds.toString().padStart(2, '0')}s ${msString.padStart(3, '0')}ms"))
    }

    @Test
    fun `Prints board with 1m time`() {
        // Set up board
        val board = buildBoard(easy9x9)
        val printedBoard = board.prettyPrint()

        // Set up time
        val msRemainder = 0L
        val seconds = 60L
        val ms = seconds * 1000L + msRemainder
        val msString = msRemainder.toString()
        val elapsedTime = ms * 1_000_000L

        val result = printWithTime(board, elapsedTime)

        assertTrue(result.contains(printedBoard))
        assertTrue(result.contains("Time: ${seconds.toString().padStart(2, '0')}s ${msString.padStart(3, '0')}ms"))
    }

    @Test
    fun `Prints board with 1m30s500ms time`() {
        // Set up board
        val board = buildBoard(easy9x9)
        val printedBoard = board.prettyPrint()

        // Set up time
        val msRemainder = 500L
        val seconds = 90L
        val ms = seconds * 1000L + msRemainder
        val msString = msRemainder.toString()
        val elapsedTime = ms * 1_000_000L

        val result = printWithTime(board, elapsedTime)

        assertTrue(result.contains(printedBoard))
        assertTrue(result.contains("Time: ${seconds.toString().padStart(2, '0')}s ${msString.padStart(3, '0')}ms"))
    }
}
