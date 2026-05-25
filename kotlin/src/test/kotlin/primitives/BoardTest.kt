package primitives

import assertClonedCellEqualsOriginal
import buildBoard
import buildCells
import dev.patientallison.sudoku.HouseType
import dev.patientallison.sudoku.primitives.Board
import org.junit.jupiter.api.Nested
import valid9x9
import kotlin.math.sqrt
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNull
import kotlin.test.assertTrue

class BoardTest {
    @Nested
    inner class BoardConstruction {
        @Test
        fun `Valid Board`() {
            val cells = buildCells(valid9x9)
            val board = Board(cells)
            assertEquals(sqrt(cells.size.toDouble()).toInt(), board.boxEdgeSize)
            assertEquals(cells.size, board.houseSize)
            assertEquals(cells.flatten().size, board.totalBoardSize)
            assertEquals(cells, board.cells)

            // House assertions
            assertEquals(cells.size * 3, board.houses.size)
            val rows = board.houses.filter { it.houseType == HouseType.ROW }
            val cols = board.houses.filter { it.houseType == HouseType.COLUMN }
            val boxes = board.houses.filter { it.houseType == HouseType.BOX }

            listOf(rows, cols, boxes).forEach {
                assertEquals(cells.size, it.size)
            }

            board.houses.forEach {
                assertEquals(cells.size, it.cellCoordinates.size)
            }

            val cellCounts =
                board.houses
                    .flatMap { it.cellCoordinates }
                    .groupingBy { it }
                    .eachCount()

            cellCounts.values.forEach {
                assertEquals(3, it)
            }

            assertEquals(board.totalBoardSize, cellCounts.size)
        }

        @Test
        fun `Wide Board`() {
            val cells = buildCells(valid9x9).dropLast(1)
            val exception =
                assertFailsWith<IllegalArgumentException> {
                    Board(cells)
                }
            assertTrue(exception.message!!.contains("Height is not a square!"))
        }

        @Test
        fun `Tall Board`() {
            val cells = buildCells(valid9x9).map { it.dropLast(1) }
            val exception =
                assertFailsWith<IllegalArgumentException> {
                    Board(cells)
                }
            assertTrue(exception.message!!.contains("Width is not a square!"))
        }

        @Test
        fun `Non-square board`() {
            val cells = buildCells(valid9x9).map { it.slice(0..3) }
            val exception =
                assertFailsWith<IllegalArgumentException> {
                    Board(cells)
                }
            assertTrue(exception.message!!.contains("Width and height are not the same! Board is not a square!"))
        }

        @Test
        fun `Uneven board`() {
            val cells = buildCells(valid9x9).toMutableList().apply { this[1] = this[1].slice(0..3) }
            val exception =
                assertFailsWith<IllegalArgumentException> {
                    Board(cells)
                }
            assertTrue(exception.message!!.contains("All rows must be the same width!"))
        }
    }

    @Nested
    inner class Clone {
        @Test
        fun `Clone should be identical to original after creation`() {
            val original = buildBoard(valid9x9)
            val clone = original.clone()
            assertEquals(original.boxEdgeSize, clone.boxEdgeSize)
            assertEquals(original.houseSize, clone.houseSize)
            assertEquals(original.totalBoardSize, clone.totalBoardSize)

            original.cells.flatten().zip(clone.cells.flatten()).forEach { (orig, cloned) ->
                assertClonedCellEqualsOriginal(orig, cloned)
            }

            original.houses.zip(clone.houses).forEach { (orig, cloned) ->
                assertEquals(orig.houseType, cloned.houseType)
                assertEquals(orig.topLeftIndex, cloned.topLeftIndex)
                assertEquals(orig.cellCoordinates, cloned.cellCoordinates)
            }
        }

        @Test
        fun `Clone operations do not affect original`() {
            val original = buildBoard(valid9x9)
            val clone = original.clone()
            clone.cells[0][0].setValue(3);
            assertNull(original.cells[0][0].getValue())
        }

        @Test
        fun `Original operations do not affect clone`() {
            val original = buildBoard(valid9x9)
            val clone = original.clone()
            original.cells[0][0].setValue(3);
            assertNull(clone.cells[0][0].getValue())
        }
    }
}
