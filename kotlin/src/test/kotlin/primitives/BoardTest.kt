package primitives

import assertClonedCellEqualsOriginal
import boxConflict
import buildBoard
import buildCells
import buildEmptyBoard
import colConflict
import dev.patientallison.sudoku.HouseType
import dev.patientallison.sudoku.data.Coordinates
import dev.patientallison.sudoku.exceptions.BoardFilledException
import dev.patientallison.sudoku.exceptions.IllegalBoardException
import dev.patientallison.sudoku.primitives.Board
import easy16x16
import easy4x4
import easy9x9
import fullButInvalid
import getRandomIndex
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.assertDoesNotThrow
import rowConflict
import solved16x16
import solved4x4
import solved9x9
import kotlin.math.sqrt
import kotlin.test.Test
import kotlin.test.assertContains
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertFalse
import kotlin.test.assertNotEquals
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

class BoardTest {
    @Nested
    inner class BoardConstruction {
        @Test
        fun `Valid Board`() {
            val cells = buildCells(easy9x9)
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
            val cells = buildCells(easy9x9).dropLast(1)
            val exception =
                assertFailsWith<IllegalArgumentException> {
                    Board(cells)
                }
            assertTrue(exception.message!!.contains("Height is not a square!"))
        }

        @Test
        fun `Tall Board`() {
            val cells = buildCells(easy9x9).map { it.dropLast(1) }
            val exception =
                assertFailsWith<IllegalArgumentException> {
                    Board(cells)
                }
            assertTrue(exception.message!!.contains("Width is not a square!"))
        }

        @Test
        fun `Non-square board`() {
            val cells = buildCells(easy9x9).map { it.slice(0..3) }
            val exception =
                assertFailsWith<IllegalArgumentException> {
                    Board(cells)
                }
            assertTrue(exception.message!!.contains("Width and height are not the same! Board is not a square!"))
        }

        @Test
        fun `Uneven board`() {
            val cells = buildCells(easy9x9).toMutableList().apply { this[1] = this[1].slice(0..3) }
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
            val original = buildBoard(easy9x9)
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
            val original = buildBoard(easy9x9)
            val clone = original.clone()
            clone.cells[0][0].setValue(3)
            assertNull(original.cells[0][0].getValue())
        }

        @Test
        fun `Original operations do not affect clone`() {
            val original = buildBoard(easy9x9)
            val clone = original.clone()
            original.cells[0][0].setValue(3)
            assertNull(clone.cells[0][0].getValue())
        }
    }

    @Nested
    inner class GetCellsForHouse {
        @Test
        fun `getCellsForHouse returns accurate cells`() {
            val board = buildBoard(easy9x9)
            val houses = board.houses
            houses.forEach {
                val cellsForHouse = board.getCellsForHouse(it)
                val coordsForHouse = it.cellCoordinates
                coordsForHouse.zip(cellsForHouse).forEach { (coordinates, cell) ->
                    assertEquals(cell.coordinates, coordinates)
                }
            }
        }
    }

    @Nested
    inner class Validate {
        @Test
        fun `Valid board validates successfully`() {
            val board = buildBoard(easy9x9)
            assertDoesNotThrow { board.validate() }
        }

        @Test
        fun `Row conflict throws error`() {
            val board = buildBoard(rowConflict)
            val exception =
                assertFailsWith<IllegalBoardException> {
                    board.validate()
                }
            assertTrue(exception.message!!.contains("Board is invalid! Violations: [ { Violated House: { HouseType: ROW"))
        }

        @Test
        fun `Column conflict throws error`() {
            val board = buildBoard(colConflict)
            val exception =
                assertFailsWith<IllegalBoardException> {
                    board.validate()
                }
            assertTrue(exception.message!!.contains("Board is invalid! Violations: [ { Violated House: { HouseType: COLUMN"))
        }

        @Test
        fun `Box conflict throws error`() {
            val board = buildBoard(boxConflict)
            val exception =
                assertFailsWith<IllegalBoardException> {
                    board.validate()
                }
            assertTrue(exception.message!!.contains("Board is invalid! Violations: [ { Violated House: { HouseType: BOX"))
        }
    }

    @Nested
    inner class IsFilled {
        @Test
        fun `Returns false for in-progress board`() {
            val board = buildBoard(easy9x9)
            assertFalse(board.isFilled())
        }

        @Test
        fun `Returns true for full but invalid board`() {
            val board = buildBoard(fullButInvalid)
            assertTrue(board.isFilled())
        }

        @Test
        fun `Returns true for solved board`() {
            val board = buildBoard(solved9x9)
            assertTrue(board.isFilled())
        }
    }

    @Nested
    inner class IsSolved {
        @Test
        fun `Returns false for in-progress board`() {
            val board = buildBoard(easy9x9)
            assertFalse(board.isSolved())
        }

        @Test
        fun `Returns false for full but invalid board`() {
            val board = buildBoard(fullButInvalid)
            assertFalse(board.isSolved())
        }

        @Test
        fun `Returns true for solved board`() {
            val board = buildBoard(solved9x9)
            assertTrue(board.isSolved())
        }
    }

    @Nested
    inner class SelectEmptyCell {
        @Test
        fun `Selects an empty cell`() {
            val board = buildBoard(easy9x9)
            // This is just for coverage so the first cell is not forever the minimum cell
            board.cells[0][2].removeCandidate(1)
            // Which cell we get is hard to determine because of the candidate count sorting
            // Just assert we get a cell
            assertNotNull(board.selectEmptyCell())
        }

        @Test
        fun `Throws if board is filled`() {
            val board = buildBoard(solved9x9)
            val exception =
                assertFailsWith<BoardFilledException> {
                    board.selectEmptyCell()
                }
            assertTrue(exception.message!!.contains("Board is already filled! There are no empty cells!"))
        }
    }

    @Nested
    inner class GetCellFromCoordinates {
        @Test
        fun `Returns a valid cell`() {
            val board = buildBoard(easy9x9)
            val coordinates =
                Coordinates(
                    getRandomIndex(board.cells.size),
                    getRandomIndex(board.cells[0].size),
                )
            val cell = board.getCellFromCoordinates(coordinates)
            assertEquals(coordinates, cell.coordinates)
        }

        @Test
        fun `Throws with out of bounds row`() {
            val board = buildBoard(easy9x9)
            val coordinates =
                Coordinates(
                    board.houseSize,
                    0,
                )
            val exception =
                assertFailsWith<IllegalArgumentException> {
                    board.getCellFromCoordinates(coordinates)
                }
            assertTrue(exception.message!!.contains("Requested row is out of bounds for this board!"))
        }

        @Test
        fun `Throws with out of bounds col`() {
            val board = buildBoard(easy9x9)
            val coordinates =
                Coordinates(
                    0,
                    board.houseSize,
                )
            val exception =
                assertFailsWith<IllegalArgumentException> {
                    board.getCellFromCoordinates(coordinates)
                }
            assertTrue(exception.message!!.contains("Requested column is out of bounds for this board!"))
        }
    }

    @Nested
    inner class GetHousesFromCoordinates {
        @Test
        fun `3 houses contain coordinates`() {
            val board = buildBoard(easy9x9)
            val coordinates = board.cells.flatten().map { it.coordinates }
            coordinates.forEach { coordinate ->
                val houses = board.getHousesFromCoordinates(coordinate)
                // There are exactly 3 units for each Coordinate
                assertEquals(3, houses.size)
                val houseTypes = houses.map { it.houseType }
                // One of each type
                HouseType.entries.forEach {
                    assertContains(houseTypes, it)
                }
                // And they contain the coordinates
                houses.forEach {
                    assertContains(it.cellCoordinates, coordinate)
                }
            }
        }
    }

    @Nested
    inner class GetPeersFromCoordinates {
        @Test
        fun `Returns peers for coordinates`() {
            val board = buildBoard(easy9x9)
            val cellCoordinates = board.cells.flatten().map { it.coordinates }
            cellCoordinates.forEach { coordinates ->
                val peers = board.getPeersFromCoordinates(coordinates)
                peers.forEach {
                    // Peer is not the same cell
                    assertNotEquals(coordinates, it.coordinates)
                    // Peer shares at least one house with cell
                    val cellHouses = board.getHousesFromCoordinates(coordinates).toSet()
                    val peerHouses = board.getHousesFromCoordinates(it.coordinates).toSet()
                    val intersection = cellHouses.intersect(peerHouses)
                    assertTrue(intersection.isNotEmpty())
                }
            }
        }
    }

    @Nested
    inner class RemoveCandidatesFromPeers {
        @Test
        fun `Removes candidates for one cell`() {
            val board = buildBoard(easy9x9)
            val cells = board.cells.flatten()
            // Initial run to remove all candidates from peers
            board.initializeCandidates()

            val cellToSet = cells[0]
            val valueToSet = 3
            val coordinates = cellToSet.coordinates

            // Remove the candidates
            board.removeCandidatesFromPeers(coordinates, valueToSet)

            // Check that candidates are removed
            board.getHousesFromCoordinates(coordinates).forEach { house ->
                house.cellCoordinates.forEach {
                    val cell = board.getCellFromCoordinates(it)
                    if (cell !== cellToSet) assertFalse(cell.getCandidates().contains(valueToSet))
                }
            }
        }
    }

    @Nested
    inner class InitializeCandidates {
        @Test
        fun `Removes candidates from initial board`() {
            val board = buildBoard(easy9x9)
            val cells = board.cells.flatten()
            // Initial run to remove all candidates from peers
            board.initializeCandidates()
            // Check that candidates are removed
            cells.filter { it.getValue() != null }.forEach { cell ->
                val peers = board.getPeersFromCoordinates(cell.coordinates)
                peers.forEach {
                    assertFalse(it.getCandidates().contains(cell.getValue()))
                }
            }
        }
    }

    @Nested
    inner class GetCandidateCount {
        @Test
        fun `Gets count for empty boards`() {
            val boards =
                listOf(
                    buildEmptyBoard(4),
                    buildEmptyBoard(9),
                    buildEmptyBoard(16),
                ).map { buildBoard(it) }
            boards.forEach {
                val expected = it.houseSize * it.cells.flatten().size
                assertEquals(expected, it.getCandidateCount())
            }
        }

        @Test
        fun `Gets count for partial boards`() {
            val boards = listOf(easy4x4, easy9x9, easy16x16).map { buildBoard(it) }
            boards.forEach {
                // Don't bother coming up with precise numbers for each board, just assert a range
                val max = it.houseSize * it.totalBoardSize
                val candidateCount = it.getCandidateCount()
                assertTrue(candidateCount in 0..max)
            }
        }

        @Test
        fun `Gets count for full board`() {
            val boards =
                listOf(
                    solved4x4,
                    solved9x9,
                    solved16x16,
                ).map { buildBoard(it) }
            boards.forEach {
                assertEquals(0, it.getCandidateCount())
            }
        }
    }
}
