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
import easy100x100
import easy16x16
import easy4x4
import easy9x9
import fullButInvalid
import getRandomIndex
import kotlinx.serialization.json.Json
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.assertDoesNotThrow
import rowConflict
import solved16x16
import solved4x4
import solved9x9
import solvedEasy100x100
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

    @Nested
    inner class PrettyPrint {
        @Test
        fun `Prints solved 9x9 board`() {
            val board = buildBoard(solved9x9)
            val expected =
                """
                3 5 8 | 2 6 9 | 7 1 4
                7 2 9 | 5 4 1 | 3 8 6
                1 6 4 | 3 7 8 | 5 9 2
                ------+-------+------
                5 4 3 | 7 8 6 | 1 2 9
                6 9 2 | 1 3 5 | 8 4 7
                8 7 1 | 9 2 4 | 6 3 5
                ------+-------+------
                9 3 6 | 4 1 7 | 2 5 8
                4 1 7 | 8 5 2 | 9 6 3
                2 8 5 | 6 9 3 | 4 7 1
                """.trimIndent()
            assertEquals(expected, board.prettyPrint())
        }

        @Test
        fun `Prints unsolved 9x9 board`() {
            val board = buildBoard(easy9x9)
            val expected =
                """
                . 5 . | . 6 9 | . . 4
                7 2 . | 5 . 1 | . . .
                1 . 4 | . 7 . | . 9 .
                ------+-------+------
                . 4 3 | . . . | 1 . .
                6 9 . | . 3 . | . 4 7
                . . 1 | . . . | 6 3 .
                ------+-------+------
                . 3 . | . 1 . | 2 . 8
                . . . | 8 . 2 | . 6 3
                2 . . | 6 9 . | . 7 .
                """.trimIndent()
            assertEquals(expected, board.prettyPrint())
        }

        @Test
        fun `Prints solved 4x4 board`() {
            val board = buildBoard(solved4x4)
            val expected =
                """
                4 3 | 1 2
                2 1 | 4 3
                ----+----
                3 4 | 2 1
                1 2 | 3 4
                """.trimIndent()
            assertEquals(expected, board.prettyPrint())
        }

        @Test
        fun `Prints unsolved 4x4 board`() {
            val board = buildBoard(easy4x4)
            val expected =
                """
                4 . | 1 .
                . . | . .
                ----+----
                . . | . .
                . 2 | . 4
                """.trimIndent()
            assertEquals(expected, board.prettyPrint())
        }

        @Test
        fun `Prints solved 16x16 board`() {
            val board = buildBoard(solved16x16)
            val expected =
                """
                12 .7 15 14 | .1 .3 .8 .4 | .6 11 16 .5 | .2 10 13 .9
                .2 .4 .8 .3 | 10 .6 12 13 | .9 .7 15 14 | .1 16 11 .5
                .5 16 .6 13 | .9 15 11 14 | 12 10 .2 .1 | .3 .4 .7 .8
                11 10 .1 .9 | 16 .7 .5 .2 | .8 .3 .4 13 | .6 12 14 15
                ------------+-------------+-------------+------------
                .6 13 .5 15 | .2 10 .3 .9 | 14 .1 .7 11 | .4 .8 16 12
                .1 14 11 .4 | .5 12 15 16 | 13 .6 .8 .2 | .7 .9 10 .3
                .8 .3 .9 .2 | 13 .4 14 .7 | 16 12 .5 10 | 15 .1 .6 11
                16 12 10 .7 | .8 11 .6 .1 | .3 15 .9 .4 | 14 .2 .5 13
                ------------+-------------+-------------+------------
                .7 .1 13 16 | 14 .2 10 11 | 15 .9 .6 12 | .5 .3 .8 .4
                15 .2 .4 .8 | .7 .9 13 12 | .5 14 .3 16 | 10 11 .1 .6
                .9 .6 12 10 | .3 .5 .4 .8 | .1 13 11 .7 | 16 15 .2 14
                14 11 .3 .5 | 15 16 .1 .6 | .4 .2 10 .8 | 12 13 .9 .7
                ------------+-------------+-------------+------------
                13 .8 16 11 | .4 .1 .7 .3 | 10 .5 12 .6 | .9 14 15 .2
                10 15 .2 .1 | 11 .8 .9 .5 | .7 .4 14 .3 | 13 .6 12 16
                .3 .9 .7 12 | .6 14 16 10 | .2 .8 13 15 | 11 .5 .4 .1
                .4 .5 14 .6 | 12 13 .2 15 | 11 16 .1 .9 | .8 .7 .3 10
                """.trimIndent()
            assertEquals(expected, board.prettyPrint())
        }

        @Test
        fun `Prints unsolved 16x16 board`() {
            val board = buildBoard(easy16x16)
            val expected =
                """
                .. .. 15 .. | .. .. .8 .. | .6 .. .. .. | .2 10 .. ..
                .. .4 .8 .3 | .. .6 12 .. | .9 .7 .. 14 | .. .. .. ..
                .5 .. .. .. | .. 15 .. 14 | 12 .. .. .1 | .. .. .7 ..
                11 .. .1 .9 | .. .7 .. .. | .. .3 .4 .. | .. .. .. ..
                ------------+-------------+-------------+------------
                .. .. .. .. | .. .. .. .. | .. .1 .. 11 | .4 .8 .. ..
                .. 14 .. .. | .. .. 15 .. | .. .. .8 .. | .. .9 10 .3
                .. .. .. .2 | .. .. .. .7 | 16 .. .5 .. | .. .1 .6 ..
                16 12 .. .. | .. 11 .6 .. | .. .. .. .4 | .. .. .5 ..
                ------------+-------------+-------------+------------
                .. .1 .. .. | 14 .2 .. .. | .. .. .6 .. | .. .. .. .4
                .. .. .4 .. | .. .9 .. 12 | .5 .. .. 16 | .. .. .. ..
                .9 .6 12 10 | .3 .5 .. .. | .1 .. 11 .. | 16 15 .. 14
                14 .. .3 .. | 15 .. .. .. | .. .. 10 .8 | 12 13 .9 ..
                ------------+-------------+-------------+------------
                .. .. 16 .. | .. .. .. .3 | 10 .. .. .. | .. 14 .. ..
                .. 15 .. .. | .. .. .9 .5 | .. .4 14 .. | 13 .. .. 16
                .. .. .7 12 | .. 14 .. .. | .. .. 13 .. | 11 .. .4 .1
                .4 .5 .. .. | .. 13 .. .. | .. .. .. .. | .. .7 .. ..
                """.trimIndent()
            assertEquals(expected, board.prettyPrint())
        }

        @Test
        fun `Prints solved 100x100 board`() {
            val board = buildBoard(solvedEasy100x100)
            val expected =
                """
                .67 .98 ..7 .65 .94 .74 .24 100 .73 .42 | .35 .85 .49 .88 .52 .76 .90 .46 .70 .31 | .95 .37 .71 .50 .89 .61 .81 .75 .80 .38 | ..2 .19 .96 .59 .12 .77 ..1 .16 .17 .15 | .23 .69 .78 .28 .34 .57 ..6 .66 .87 .30 | .48 .54 .41 .43 .27 ..8 .58 .47 .83 .60 | .44 .62 .63 .64 ..5 .39 .10 .68 .51 .72 | .18 .26 .14 ..3 .82 .32 .93 .92 .22 .86 | .97 .36 .53 .84 .20 ..4 .91 .99 .13 .25 | .79 .29 .33 .40 .21 .55 .56 ..9 .11 .45

                ..2 .19 .96 .59 .12 .77 ..1 .16 .17 .15 | .23 .69 .78 .28 .34 .57 ..6 .66 .87 .30 | .48 .54 .41 .43 .27 ..8 .58 .47 .83 .60 | .44 .62 .63 .64 ..5 .39 .10 .68 .51 .72 | .18 .26 .14 ..3 .82 .32 .93 .92 .22 .86 | .97 .36 .53 .84 .20 ..4 .91 .99 .13 .25 | .79 .29 .33 .40 .21 .55 .56 ..9 .11 .45 | .67 .98 ..7 .65 .94 .74 .24 100 .73 .42 | .35 .85 .49 .88 .52 .76 .90 .46 .70 .31 | .95 .37 .71 .50 .89 .61 .81 .75 .80 .38

                .44 .62 .63 .64 ..5 .39 .10 .68 .51 .72 | .18 .26 .14 ..3 .82 .32 .93 .92 .22 .86 | .97 .36 .53 .84 .20 ..4 .91 .99 .13 .25 | .79 .29 .33 .40 .21 .55 .56 ..9 .11 .45 | .67 .98 ..7 .65 .94 .74 .24 100 .73 .42 | .35 .85 .49 .88 .52 .76 .90 .46 .70 .31 | .95 .37 .71 .50 .89 .61 .81 .75 .80 .38 | ..2 .19 .96 .59 .12 .77 ..1 .16 .17 .15 | .23 .69 .78 .28 .34 .57 ..6 .66 .87 .30 | .48 .54 .41 .43 .27 ..8 .58 .47 .83 .60

                .79 .29 .33 .40 .21 .55 .56 ..9 .11 .45 | .67 .98 ..7 .65 .94 .74 .24 100 .73 .42 | .35 .85 .49 .88 .52 .76 .90 .46 .70 .31 | .95 .37 .71 .50 .89 .61 .81 .75 .80 .38 | ..2 .19 .96 .59 .12 .77 ..1 .16 .17 .15 | .23 .69 .78 .28 .34 .57 ..6 .66 .87 .30 | .48 .54 .41 .43 .27 ..8 .58 .47 .83 .60 | .44 .62 .63 .64 ..5 .39 .10 .68 .51 .72 | .18 .26 .14 ..3 .82 .32 .93 .92 .22 .86 | .97 .36 .53 .84 .20 ..4 .91 .99 .13 .25

                .95 .37 .71 .50 .89 .61 .81 .75 .80 .38 | ..2 .19 .96 .59 .12 .77 ..1 .16 .17 .15 | .23 .69 .78 .28 .34 .57 ..6 .66 .87 .30 | .48 .54 .41 .43 .27 ..8 .58 .47 .83 .60 | .44 .62 .63 .64 ..5 .39 .10 .68 .51 .72 | .18 .26 .14 ..3 .82 .32 .93 .92 .22 .86 | .97 .36 .53 .84 .20 ..4 .91 .99 .13 .25 | .79 .29 .33 .40 .21 .55 .56 ..9 .11 .45 | .67 .98 ..7 .65 .94 .74 .24 100 .73 .42 | .35 .85 .49 .88 .52 .76 .90 .46 .70 .31

                .48 .54 .41 .43 .27 ..8 .58 .47 .83 .60 | .44 .62 .63 .64 ..5 .39 .10 .68 .51 .72 | .18 .26 .14 ..3 .82 .32 .93 .92 .22 .86 | .97 .36 .53 .84 .20 ..4 .91 .99 .13 .25 | .79 .29 .33 .40 .21 .55 .56 ..9 .11 .45 | .67 .98 ..7 .65 .94 .74 .24 100 .73 .42 | .35 .85 .49 .88 .52 .76 .90 .46 .70 .31 | .95 .37 .71 .50 .89 .61 .81 .75 .80 .38 | ..2 .19 .96 .59 .12 .77 ..1 .16 .17 .15 | .23 .69 .78 .28 .34 .57 ..6 .66 .87 .30

                .97 .36 .53 .84 .20 ..4 .91 .99 .13 .25 | .79 .29 .33 .40 .21 .55 .56 ..9 .11 .45 | .67 .98 ..7 .65 .94 .74 .24 100 .73 .42 | .35 .85 .49 .88 .52 .76 .90 .46 .70 .31 | .95 .37 .71 .50 .89 .61 .81 .75 .80 .38 | ..2 .19 .96 .59 .12 .77 ..1 .16 .17 .15 | .23 .69 .78 .28 .34 .57 ..6 .66 .87 .30 | .48 .54 .41 .43 .27 ..8 .58 .47 .83 .60 | .44 .62 .63 .64 ..5 .39 .10 .68 .51 .72 | .18 .26 .14 ..3 .82 .32 .93 .92 .22 .86

                .35 .85 .49 .88 .52 .76 .90 .46 .70 .31 | .95 .37 .71 .50 .89 .61 .81 .75 .80 .38 | ..2 .19 .96 .59 .12 .77 ..1 .16 .17 .15 | .23 .69 .78 .28 .34 .57 ..6 .66 .87 .30 | .48 .54 .41 .43 .27 ..8 .58 .47 .83 .60 | .44 .62 .63 .64 ..5 .39 .10 .68 .51 .72 | .18 .26 .14 ..3 .82 .32 .93 .92 .22 .86 | .97 .36 .53 .84 .20 ..4 .91 .99 .13 .25 | .79 .29 .33 .40 .21 .55 .56 ..9 .11 .45 | .67 .98 ..7 .65 .94 .74 .24 100 .73 .42

                .23 .69 .78 .28 .34 .57 ..6 .66 .87 .30 | .48 .54 .41 .43 .27 ..8 .58 .47 .83 .60 | .44 .62 .63 .64 ..5 .39 .10 .68 .51 .72 | .18 .26 .14 ..3 .82 .32 .93 .92 .22 .86 | .97 .36 .53 .84 .20 ..4 .91 .99 .13 .25 | .79 .29 .33 .40 .21 .55 .56 ..9 .11 .45 | .67 .98 ..7 .65 .94 .74 .24 100 .73 .42 | .35 .85 .49 .88 .52 .76 .90 .46 .70 .31 | .95 .37 .71 .50 .89 .61 .81 .75 .80 .38 | ..2 .19 .96 .59 .12 .77 ..1 .16 .17 .15

                .18 .26 .14 ..3 .82 .32 .93 .92 .22 .86 | .97 .36 .53 .84 .20 ..4 .91 .99 .13 .25 | .79 .29 .33 .40 .21 .55 .56 ..9 .11 .45 | .67 .98 ..7 .65 .94 .74 .24 100 .73 .42 | .35 .85 .49 .88 .52 .76 .90 .46 .70 .31 | .95 .37 .71 .50 .89 .61 .81 .75 .80 .38 | ..2 .19 .96 .59 .12 .77 ..1 .16 .17 .15 | .23 .69 .78 .28 .34 .57 ..6 .66 .87 .30 | .48 .54 .41 .43 .27 ..8 .58 .47 .83 .60 | .44 .62 .63 .64 ..5 .39 .10 .68 .51 .72

                ----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+----------------------------------------

                100 .73 .42 .67 .98 ..7 .65 .94 .74 .24 | .46 .70 .31 .35 .85 .49 .88 .52 .76 .90 | .75 .80 .38 .95 .37 .71 .50 .89 .61 .81 | .16 .17 .15 ..2 .19 .96 .59 .12 .77 ..1 | .66 .87 .30 .23 .69 .78 .28 .34 .57 ..6 | .47 .83 .60 .48 .54 .41 .43 .27 ..8 .58 | .68 .51 .72 .44 .62 .63 .64 ..5 .39 .10 | .92 .22 .86 .18 .26 .14 ..3 .82 .32 .93 | .99 .13 .25 .97 .36 .53 .84 .20 ..4 .91 | ..9 .11 .45 .79 .29 .33 .40 .21 .55 .56

                .16 .17 .15 ..2 .19 .96 .59 .12 .77 ..1 | .66 .87 .30 .23 .69 .78 .28 .34 .57 ..6 | .47 .83 .60 .48 .54 .41 .43 .27 ..8 .58 | .68 .51 .72 .44 .62 .63 .64 ..5 .39 .10 | .92 .22 .86 .18 .26 .14 ..3 .82 .32 .93 | .99 .13 .25 .97 .36 .53 .84 .20 ..4 .91 | ..9 .11 .45 .79 .29 .33 .40 .21 .55 .56 | 100 .73 .42 .67 .98 ..7 .65 .94 .74 .24 | .46 .70 .31 .35 .85 .49 .88 .52 .76 .90 | .75 .80 .38 .95 .37 .71 .50 .89 .61 .81

                .68 .51 .72 .44 .62 .63 .64 ..5 .39 .10 | .92 .22 .86 .18 .26 .14 ..3 .82 .32 .93 | .99 .13 .25 .97 .36 .53 .84 .20 ..4 .91 | ..9 .11 .45 .79 .29 .33 .40 .21 .55 .56 | 100 .73 .42 .67 .98 ..7 .65 .94 .74 .24 | .46 .70 .31 .35 .85 .49 .88 .52 .76 .90 | .75 .80 .38 .95 .37 .71 .50 .89 .61 .81 | .16 .17 .15 ..2 .19 .96 .59 .12 .77 ..1 | .66 .87 .30 .23 .69 .78 .28 .34 .57 ..6 | .47 .83 .60 .48 .54 .41 .43 .27 ..8 .58

                ..9 .11 .45 .79 .29 .33 .40 .21 .55 .56 | 100 .73 .42 .67 .98 ..7 .65 .94 .74 .24 | .46 .70 .31 .35 .85 .49 .88 .52 .76 .90 | .75 .80 .38 .95 .37 .71 .50 .89 .61 .81 | .16 .17 .15 ..2 .19 .96 .59 .12 .77 ..1 | .66 .87 .30 .23 .69 .78 .28 .34 .57 ..6 | .47 .83 .60 .48 .54 .41 .43 .27 ..8 .58 | .68 .51 .72 .44 .62 .63 .64 ..5 .39 .10 | .92 .22 .86 .18 .26 .14 ..3 .82 .32 .93 | .99 .13 .25 .97 .36 .53 .84 .20 ..4 .91

                .75 .80 .38 .95 .37 .71 .50 .89 .61 .81 | .16 .17 .15 ..2 .19 .96 .59 .12 .77 ..1 | .66 .87 .30 .23 .69 .78 .28 .34 .57 ..6 | .47 .83 .60 .48 .54 .41 .43 .27 ..8 .58 | .68 .51 .72 .44 .62 .63 .64 ..5 .39 .10 | .92 .22 .86 .18 .26 .14 ..3 .82 .32 .93 | .99 .13 .25 .97 .36 .53 .84 .20 ..4 .91 | ..9 .11 .45 .79 .29 .33 .40 .21 .55 .56 | 100 .73 .42 .67 .98 ..7 .65 .94 .74 .24 | .46 .70 .31 .35 .85 .49 .88 .52 .76 .90

                .47 .83 .60 .48 .54 .41 .43 .27 ..8 .58 | .68 .51 .72 .44 .62 .63 .64 ..5 .39 .10 | .92 .22 .86 .18 .26 .14 ..3 .82 .32 .93 | .99 .13 .25 .97 .36 .53 .84 .20 ..4 .91 | ..9 .11 .45 .79 .29 .33 .40 .21 .55 .56 | 100 .73 .42 .67 .98 ..7 .65 .94 .74 .24 | .46 .70 .31 .35 .85 .49 .88 .52 .76 .90 | .75 .80 .38 .95 .37 .71 .50 .89 .61 .81 | .16 .17 .15 ..2 .19 .96 .59 .12 .77 ..1 | .66 .87 .30 .23 .69 .78 .28 .34 .57 ..6

                .99 .13 .25 .97 .36 .53 .84 .20 ..4 .91 | ..9 .11 .45 .79 .29 .33 .40 .21 .55 .56 | 100 .73 .42 .67 .98 ..7 .65 .94 .74 .24 | .46 .70 .31 .35 .85 .49 .88 .52 .76 .90 | .75 .80 .38 .95 .37 .71 .50 .89 .61 .81 | .16 .17 .15 ..2 .19 .96 .59 .12 .77 ..1 | .66 .87 .30 .23 .69 .78 .28 .34 .57 ..6 | .47 .83 .60 .48 .54 .41 .43 .27 ..8 .58 | .68 .51 .72 .44 .62 .63 .64 ..5 .39 .10 | .92 .22 .86 .18 .26 .14 ..3 .82 .32 .93

                .46 .70 .31 .35 .85 .49 .88 .52 .76 .90 | .75 .80 .38 .95 .37 .71 .50 .89 .61 .81 | .16 .17 .15 ..2 .19 .96 .59 .12 .77 ..1 | .66 .87 .30 .23 .69 .78 .28 .34 .57 ..6 | .47 .83 .60 .48 .54 .41 .43 .27 ..8 .58 | .68 .51 .72 .44 .62 .63 .64 ..5 .39 .10 | .92 .22 .86 .18 .26 .14 ..3 .82 .32 .93 | .99 .13 .25 .97 .36 .53 .84 .20 ..4 .91 | ..9 .11 .45 .79 .29 .33 .40 .21 .55 .56 | 100 .73 .42 .67 .98 ..7 .65 .94 .74 .24

                .66 .87 .30 .23 .69 .78 .28 .34 .57 ..6 | .47 .83 .60 .48 .54 .41 .43 .27 ..8 .58 | .68 .51 .72 .44 .62 .63 .64 ..5 .39 .10 | .92 .22 .86 .18 .26 .14 ..3 .82 .32 .93 | .99 .13 .25 .97 .36 .53 .84 .20 ..4 .91 | ..9 .11 .45 .79 .29 .33 .40 .21 .55 .56 | 100 .73 .42 .67 .98 ..7 .65 .94 .74 .24 | .46 .70 .31 .35 .85 .49 .88 .52 .76 .90 | .75 .80 .38 .95 .37 .71 .50 .89 .61 .81 | .16 .17 .15 ..2 .19 .96 .59 .12 .77 ..1

                .92 .22 .86 .18 .26 .14 ..3 .82 .32 .93 | .99 .13 .25 .97 .36 .53 .84 .20 ..4 .91 | ..9 .11 .45 .79 .29 .33 .40 .21 .55 .56 | 100 .73 .42 .67 .98 ..7 .65 .94 .74 .24 | .46 .70 .31 .35 .85 .49 .88 .52 .76 .90 | .75 .80 .38 .95 .37 .71 .50 .89 .61 .81 | .16 .17 .15 ..2 .19 .96 .59 .12 .77 ..1 | .66 .87 .30 .23 .69 .78 .28 .34 .57 ..6 | .47 .83 .60 .48 .54 .41 .43 .27 ..8 .58 | .68 .51 .72 .44 .62 .63 .64 ..5 .39 .10

                ----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+----------------------------------------

                .94 .74 .24 100 .73 .42 .67 .98 ..7 .65 | .52 .76 .90 .46 .70 .31 .35 .85 .49 .88 | .89 .61 .81 .75 .80 .38 .95 .37 .71 .50 | .12 .77 ..1 .16 .17 .15 ..2 .19 .96 .59 | .34 .57 ..6 .66 .87 .30 .23 .69 .78 .28 | .27 ..8 .58 .47 .83 .60 .48 .54 .41 .43 | ..5 .39 .10 .68 .51 .72 .44 .62 .63 .64 | .82 .32 .93 .92 .22 .86 .18 .26 .14 ..3 | .20 ..4 .91 .99 .13 .25 .97 .36 .53 .84 | .21 .55 .56 ..9 .11 .45 .79 .29 .33 .40

                .12 .77 ..1 .16 .17 .15 ..2 .19 .96 .59 | .34 .57 ..6 .66 .87 .30 .23 .69 .78 .28 | .27 ..8 .58 .47 .83 .60 .48 .54 .41 .43 | ..5 .39 .10 .68 .51 .72 .44 .62 .63 .64 | .82 .32 .93 .92 .22 .86 .18 .26 .14 ..3 | .20 ..4 .91 .99 .13 .25 .97 .36 .53 .84 | .21 .55 .56 ..9 .11 .45 .79 .29 .33 .40 | .94 .74 .24 100 .73 .42 .67 .98 ..7 .65 | .52 .76 .90 .46 .70 .31 .35 .85 .49 .88 | .89 .61 .81 .75 .80 .38 .95 .37 .71 .50

                ..5 .39 .10 .68 .51 .72 .44 .62 .63 .64 | .82 .32 .93 .92 .22 .86 .18 .26 .14 ..3 | .20 ..4 .91 .99 .13 .25 .97 .36 .53 .84 | .21 .55 .56 ..9 .11 .45 .79 .29 .33 .40 | .94 .74 .24 100 .73 .42 .67 .98 ..7 .65 | .52 .76 .90 .46 .70 .31 .35 .85 .49 .88 | .89 .61 .81 .75 .80 .38 .95 .37 .71 .50 | .12 .77 ..1 .16 .17 .15 ..2 .19 .96 .59 | .34 .57 ..6 .66 .87 .30 .23 .69 .78 .28 | .27 ..8 .58 .47 .83 .60 .48 .54 .41 .43

                .21 .55 .56 ..9 .11 .45 .79 .29 .33 .40 | .94 .74 .24 100 .73 .42 .67 .98 ..7 .65 | .52 .76 .90 .46 .70 .31 .35 .85 .49 .88 | .89 .61 .81 .75 .80 .38 .95 .37 .71 .50 | .12 .77 ..1 .16 .17 .15 ..2 .19 .96 .59 | .34 .57 ..6 .66 .87 .30 .23 .69 .78 .28 | .27 ..8 .58 .47 .83 .60 .48 .54 .41 .43 | ..5 .39 .10 .68 .51 .72 .44 .62 .63 .64 | .82 .32 .93 .92 .22 .86 .18 .26 .14 ..3 | .20 ..4 .91 .99 .13 .25 .97 .36 .53 .84

                .89 .61 .81 .75 .80 .38 .95 .37 .71 .50 | .12 .77 ..1 .16 .17 .15 ..2 .19 .96 .59 | .34 .57 ..6 .66 .87 .30 .23 .69 .78 .28 | .27 ..8 .58 .47 .83 .60 .48 .54 .41 .43 | ..5 .39 .10 .68 .51 .72 .44 .62 .63 .64 | .82 .32 .93 .92 .22 .86 .18 .26 .14 ..3 | .20 ..4 .91 .99 .13 .25 .97 .36 .53 .84 | .21 .55 .56 ..9 .11 .45 .79 .29 .33 .40 | .94 .74 .24 100 .73 .42 .67 .98 ..7 .65 | .52 .76 .90 .46 .70 .31 .35 .85 .49 .88

                .27 ..8 .58 .47 .83 .60 .48 .54 .41 .43 | ..5 .39 .10 .68 .51 .72 .44 .62 .63 .64 | .82 .32 .93 .92 .22 .86 .18 .26 .14 ..3 | .20 ..4 .91 .99 .13 .25 .97 .36 .53 .84 | .21 .55 .56 ..9 .11 .45 .79 .29 .33 .40 | .94 .74 .24 100 .73 .42 .67 .98 ..7 .65 | .52 .76 .90 .46 .70 .31 .35 .85 .49 .88 | .89 .61 .81 .75 .80 .38 .95 .37 .71 .50 | .12 .77 ..1 .16 .17 .15 ..2 .19 .96 .59 | .34 .57 ..6 .66 .87 .30 .23 .69 .78 .28

                .20 ..4 .91 .99 .13 .25 .97 .36 .53 .84 | .21 .55 .56 ..9 .11 .45 .79 .29 .33 .40 | .94 .74 .24 100 .73 .42 .67 .98 ..7 .65 | .52 .76 .90 .46 .70 .31 .35 .85 .49 .88 | .89 .61 .81 .75 .80 .38 .95 .37 .71 .50 | .12 .77 ..1 .16 .17 .15 ..2 .19 .96 .59 | .34 .57 ..6 .66 .87 .30 .23 .69 .78 .28 | .27 ..8 .58 .47 .83 .60 .48 .54 .41 .43 | ..5 .39 .10 .68 .51 .72 .44 .62 .63 .64 | .82 .32 .93 .92 .22 .86 .18 .26 .14 ..3

                .52 .76 .90 .46 .70 .31 .35 .85 .49 .88 | .89 .61 .81 .75 .80 .38 .95 .37 .71 .50 | .12 .77 ..1 .16 .17 .15 ..2 .19 .96 .59 | .34 .57 ..6 .66 .87 .30 .23 .69 .78 .28 | .27 ..8 .58 .47 .83 .60 .48 .54 .41 .43 | ..5 .39 .10 .68 .51 .72 .44 .62 .63 .64 | .82 .32 .93 .92 .22 .86 .18 .26 .14 ..3 | .20 ..4 .91 .99 .13 .25 .97 .36 .53 .84 | .21 .55 .56 ..9 .11 .45 .79 .29 .33 .40 | .94 .74 .24 100 .73 .42 .67 .98 ..7 .65

                .34 .57 ..6 .66 .87 .30 .23 .69 .78 .28 | .27 ..8 .58 .47 .83 .60 .48 .54 .41 .43 | ..5 .39 .10 .68 .51 .72 .44 .62 .63 .64 | .82 .32 .93 .92 .22 .86 .18 .26 .14 ..3 | .20 ..4 .91 .99 .13 .25 .97 .36 .53 .84 | .21 .55 .56 ..9 .11 .45 .79 .29 .33 .40 | .94 .74 .24 100 .73 .42 .67 .98 ..7 .65 | .52 .76 .90 .46 .70 .31 .35 .85 .49 .88 | .89 .61 .81 .75 .80 .38 .95 .37 .71 .50 | .12 .77 ..1 .16 .17 .15 ..2 .19 .96 .59

                .82 .32 .93 .92 .22 .86 .18 .26 .14 ..3 | .20 ..4 .91 .99 .13 .25 .97 .36 .53 .84 | .21 .55 .56 ..9 .11 .45 .79 .29 .33 .40 | .94 .74 .24 100 .73 .42 .67 .98 ..7 .65 | .52 .76 .90 .46 .70 .31 .35 .85 .49 .88 | .89 .61 .81 .75 .80 .38 .95 .37 .71 .50 | .12 .77 ..1 .16 .17 .15 ..2 .19 .96 .59 | .34 .57 ..6 .66 .87 .30 .23 .69 .78 .28 | .27 ..8 .58 .47 .83 .60 .48 .54 .41 .43 | ..5 .39 .10 .68 .51 .72 .44 .62 .63 .64

                ----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+----------------------------------------

                .98 ..7 .65 .94 .74 .24 100 .73 .42 .67 | .85 .49 .88 .52 .76 .90 .46 .70 .31 .35 | .37 .71 .50 .89 .61 .81 .75 .80 .38 .95 | .19 .96 .59 .12 .77 ..1 .16 .17 .15 ..2 | .69 .78 .28 .34 .57 ..6 .66 .87 .30 .23 | .54 .41 .43 .27 ..8 .58 .47 .83 .60 .48 | .62 .63 .64 ..5 .39 .10 .68 .51 .72 .44 | .26 .14 ..3 .82 .32 .93 .92 .22 .86 .18 | .36 .53 .84 .20 ..4 .91 .99 .13 .25 .97 | .29 .33 .40 .21 .55 .56 ..9 .11 .45 .79

                .19 .96 .59 .12 .77 ..1 .16 .17 .15 ..2 | .69 .78 .28 .34 .57 ..6 .66 .87 .30 .23 | .54 .41 .43 .27 ..8 .58 .47 .83 .60 .48 | .62 .63 .64 ..5 .39 .10 .68 .51 .72 .44 | .26 .14 ..3 .82 .32 .93 .92 .22 .86 .18 | .36 .53 .84 .20 ..4 .91 .99 .13 .25 .97 | .29 .33 .40 .21 .55 .56 ..9 .11 .45 .79 | .98 ..7 .65 .94 .74 .24 100 .73 .42 .67 | .85 .49 .88 .52 .76 .90 .46 .70 .31 .35 | .37 .71 .50 .89 .61 .81 .75 .80 .38 .95

                .62 .63 .64 ..5 .39 .10 .68 .51 .72 .44 | .26 .14 ..3 .82 .32 .93 .92 .22 .86 .18 | .36 .53 .84 .20 ..4 .91 .99 .13 .25 .97 | .29 .33 .40 .21 .55 .56 ..9 .11 .45 .79 | .98 ..7 .65 .94 .74 .24 100 .73 .42 .67 | .85 .49 .88 .52 .76 .90 .46 .70 .31 .35 | .37 .71 .50 .89 .61 .81 .75 .80 .38 .95 | .19 .96 .59 .12 .77 ..1 .16 .17 .15 ..2 | .69 .78 .28 .34 .57 ..6 .66 .87 .30 .23 | .54 .41 .43 .27 ..8 .58 .47 .83 .60 .48

                .29 .33 .40 .21 .55 .56 ..9 .11 .45 .79 | .98 ..7 .65 .94 .74 .24 100 .73 .42 .67 | .85 .49 .88 .52 .76 .90 .46 .70 .31 .35 | .37 .71 .50 .89 .61 .81 .75 .80 .38 .95 | .19 .96 .59 .12 .77 ..1 .16 .17 .15 ..2 | .69 .78 .28 .34 .57 ..6 .66 .87 .30 .23 | .54 .41 .43 .27 ..8 .58 .47 .83 .60 .48 | .62 .63 .64 ..5 .39 .10 .68 .51 .72 .44 | .26 .14 ..3 .82 .32 .93 .92 .22 .86 .18 | .36 .53 .84 .20 ..4 .91 .99 .13 .25 .97

                .37 .71 .50 .89 .61 .81 .75 .80 .38 .95 | .19 .96 .59 .12 .77 ..1 .16 .17 .15 ..2 | .69 .78 .28 .34 .57 ..6 .66 .87 .30 .23 | .54 .41 .43 .27 ..8 .58 .47 .83 .60 .48 | .62 .63 .64 ..5 .39 .10 .68 .51 .72 .44 | .26 .14 ..3 .82 .32 .93 .92 .22 .86 .18 | .36 .53 .84 .20 ..4 .91 .99 .13 .25 .97 | .29 .33 .40 .21 .55 .56 ..9 .11 .45 .79 | .98 ..7 .65 .94 .74 .24 100 .73 .42 .67 | .85 .49 .88 .52 .76 .90 .46 .70 .31 .35

                .54 .41 .43 .27 ..8 .58 .47 .83 .60 .48 | .62 .63 .64 ..5 .39 .10 .68 .51 .72 .44 | .26 .14 ..3 .82 .32 .93 .92 .22 .86 .18 | .36 .53 .84 .20 ..4 .91 .99 .13 .25 .97 | .29 .33 .40 .21 .55 .56 ..9 .11 .45 .79 | .98 ..7 .65 .94 .74 .24 100 .73 .42 .67 | .85 .49 .88 .52 .76 .90 .46 .70 .31 .35 | .37 .71 .50 .89 .61 .81 .75 .80 .38 .95 | .19 .96 .59 .12 .77 ..1 .16 .17 .15 ..2 | .69 .78 .28 .34 .57 ..6 .66 .87 .30 .23

                .36 .53 .84 .20 ..4 .91 .99 .13 .25 .97 | .29 .33 .40 .21 .55 .56 ..9 .11 .45 .79 | .98 ..7 .65 .94 .74 .24 100 .73 .42 .67 | .85 .49 .88 .52 .76 .90 .46 .70 .31 .35 | .37 .71 .50 .89 .61 .81 .75 .80 .38 .95 | .19 .96 .59 .12 .77 ..1 .16 .17 .15 ..2 | .69 .78 .28 .34 .57 ..6 .66 .87 .30 .23 | .54 .41 .43 .27 ..8 .58 .47 .83 .60 .48 | .62 .63 .64 ..5 .39 .10 .68 .51 .72 .44 | .26 .14 ..3 .82 .32 .93 .92 .22 .86 .18

                .85 .49 .88 .52 .76 .90 .46 .70 .31 .35 | .37 .71 .50 .89 .61 .81 .75 .80 .38 .95 | .19 .96 .59 .12 .77 ..1 .16 .17 .15 ..2 | .69 .78 .28 .34 .57 ..6 .66 .87 .30 .23 | .54 .41 .43 .27 ..8 .58 .47 .83 .60 .48 | .62 .63 .64 ..5 .39 .10 .68 .51 .72 .44 | .26 .14 ..3 .82 .32 .93 .92 .22 .86 .18 | .36 .53 .84 .20 ..4 .91 .99 .13 .25 .97 | .29 .33 .40 .21 .55 .56 ..9 .11 .45 .79 | .98 ..7 .65 .94 .74 .24 100 .73 .42 .67

                .69 .78 .28 .34 .57 ..6 .66 .87 .30 .23 | .54 .41 .43 .27 ..8 .58 .47 .83 .60 .48 | .62 .63 .64 ..5 .39 .10 .68 .51 .72 .44 | .26 .14 ..3 .82 .32 .93 .92 .22 .86 .18 | .36 .53 .84 .20 ..4 .91 .99 .13 .25 .97 | .29 .33 .40 .21 .55 .56 ..9 .11 .45 .79 | .98 ..7 .65 .94 .74 .24 100 .73 .42 .67 | .85 .49 .88 .52 .76 .90 .46 .70 .31 .35 | .37 .71 .50 .89 .61 .81 .75 .80 .38 .95 | .19 .96 .59 .12 .77 ..1 .16 .17 .15 ..2

                .26 .14 ..3 .82 .32 .93 .92 .22 .86 .18 | .36 .53 .84 .20 ..4 .91 .99 .13 .25 .97 | .29 .33 .40 .21 .55 .56 ..9 .11 .45 .79 | .98 ..7 .65 .94 .74 .24 100 .73 .42 .67 | .85 .49 .88 .52 .76 .90 .46 .70 .31 .35 | .37 .71 .50 .89 .61 .81 .75 .80 .38 .95 | .19 .96 .59 .12 .77 ..1 .16 .17 .15 ..2 | .69 .78 .28 .34 .57 ..6 .66 .87 .30 .23 | .54 .41 .43 .27 ..8 .58 .47 .83 .60 .48 | .62 .63 .64 ..5 .39 .10 .68 .51 .72 .44

                ----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+----------------------------------------

                .73 .42 .67 .98 ..7 .65 .94 .74 .24 100 | .70 .31 .35 .85 .49 .88 .52 .76 .90 .46 | .80 .38 .95 .37 .71 .50 .89 .61 .81 .75 | .17 .15 ..2 .19 .96 .59 .12 .77 ..1 .16 | .87 .30 .23 .69 .78 .28 .34 .57 ..6 .66 | .83 .60 .48 .54 .41 .43 .27 ..8 .58 .47 | .51 .72 .44 .62 .63 .64 ..5 .39 .10 .68 | .22 .86 .18 .26 .14 ..3 .82 .32 .93 .92 | .13 .25 .97 .36 .53 .84 .20 ..4 .91 .99 | .11 .45 .79 .29 .33 .40 .21 .55 .56 ..9

                .17 .15 ..2 .19 .96 .59 .12 .77 ..1 .16 | .87 .30 .23 .69 .78 .28 .34 .57 ..6 .66 | .83 .60 .48 .54 .41 .43 .27 ..8 .58 .47 | .51 .72 .44 .62 .63 .64 ..5 .39 .10 .68 | .22 .86 .18 .26 .14 ..3 .82 .32 .93 .92 | .13 .25 .97 .36 .53 .84 .20 ..4 .91 .99 | .11 .45 .79 .29 .33 .40 .21 .55 .56 ..9 | .73 .42 .67 .98 ..7 .65 .94 .74 .24 100 | .70 .31 .35 .85 .49 .88 .52 .76 .90 .46 | .80 .38 .95 .37 .71 .50 .89 .61 .81 .75

                .51 .72 .44 .62 .63 .64 ..5 .39 .10 .68 | .22 .86 .18 .26 .14 ..3 .82 .32 .93 .92 | .13 .25 .97 .36 .53 .84 .20 ..4 .91 .99 | .11 .45 .79 .29 .33 .40 .21 .55 .56 ..9 | .73 .42 .67 .98 ..7 .65 .94 .74 .24 100 | .70 .31 .35 .85 .49 .88 .52 .76 .90 .46 | .80 .38 .95 .37 .71 .50 .89 .61 .81 .75 | .17 .15 ..2 .19 .96 .59 .12 .77 ..1 .16 | .87 .30 .23 .69 .78 .28 .34 .57 ..6 .66 | .83 .60 .48 .54 .41 .43 .27 ..8 .58 .47

                .11 .45 .79 .29 .33 .40 .21 .55 .56 ..9 | .73 .42 .67 .98 ..7 .65 .94 .74 .24 100 | .70 .31 .35 .85 .49 .88 .52 .76 .90 .46 | .80 .38 .95 .37 .71 .50 .89 .61 .81 .75 | .17 .15 ..2 .19 .96 .59 .12 .77 ..1 .16 | .87 .30 .23 .69 .78 .28 .34 .57 ..6 .66 | .83 .60 .48 .54 .41 .43 .27 ..8 .58 .47 | .51 .72 .44 .62 .63 .64 ..5 .39 .10 .68 | .22 .86 .18 .26 .14 ..3 .82 .32 .93 .92 | .13 .25 .97 .36 .53 .84 .20 ..4 .91 .99

                .80 .38 .95 .37 .71 .50 .89 .61 .81 .75 | .17 .15 ..2 .19 .96 .59 .12 .77 ..1 .16 | .87 .30 .23 .69 .78 .28 .34 .57 ..6 .66 | .83 .60 .48 .54 .41 .43 .27 ..8 .58 .47 | .51 .72 .44 .62 .63 .64 ..5 .39 .10 .68 | .22 .86 .18 .26 .14 ..3 .82 .32 .93 .92 | .13 .25 .97 .36 .53 .84 .20 ..4 .91 .99 | .11 .45 .79 .29 .33 .40 .21 .55 .56 ..9 | .73 .42 .67 .98 ..7 .65 .94 .74 .24 100 | .70 .31 .35 .85 .49 .88 .52 .76 .90 .46

                .83 .60 .48 .54 .41 .43 .27 ..8 .58 .47 | .51 .72 .44 .62 .63 .64 ..5 .39 .10 .68 | .22 .86 .18 .26 .14 ..3 .82 .32 .93 .92 | .13 .25 .97 .36 .53 .84 .20 ..4 .91 .99 | .11 .45 .79 .29 .33 .40 .21 .55 .56 ..9 | .73 .42 .67 .98 ..7 .65 .94 .74 .24 100 | .70 .31 .35 .85 .49 .88 .52 .76 .90 .46 | .80 .38 .95 .37 .71 .50 .89 .61 .81 .75 | .17 .15 ..2 .19 .96 .59 .12 .77 ..1 .16 | .87 .30 .23 .69 .78 .28 .34 .57 ..6 .66

                .13 .25 .97 .36 .53 .84 .20 ..4 .91 .99 | .11 .45 .79 .29 .33 .40 .21 .55 .56 ..9 | .73 .42 .67 .98 ..7 .65 .94 .74 .24 100 | .70 .31 .35 .85 .49 .88 .52 .76 .90 .46 | .80 .38 .95 .37 .71 .50 .89 .61 .81 .75 | .17 .15 ..2 .19 .96 .59 .12 .77 ..1 .16 | .87 .30 .23 .69 .78 .28 .34 .57 ..6 .66 | .83 .60 .48 .54 .41 .43 .27 ..8 .58 .47 | .51 .72 .44 .62 .63 .64 ..5 .39 .10 .68 | .22 .86 .18 .26 .14 ..3 .82 .32 .93 .92

                .70 .31 .35 .85 .49 .88 .52 .76 .90 .46 | .80 .38 .95 .37 .71 .50 .89 .61 .81 .75 | .17 .15 ..2 .19 .96 .59 .12 .77 ..1 .16 | .87 .30 .23 .69 .78 .28 .34 .57 ..6 .66 | .83 .60 .48 .54 .41 .43 .27 ..8 .58 .47 | .51 .72 .44 .62 .63 .64 ..5 .39 .10 .68 | .22 .86 .18 .26 .14 ..3 .82 .32 .93 .92 | .13 .25 .97 .36 .53 .84 .20 ..4 .91 .99 | .11 .45 .79 .29 .33 .40 .21 .55 .56 ..9 | .73 .42 .67 .98 ..7 .65 .94 .74 .24 100

                .87 .30 .23 .69 .78 .28 .34 .57 ..6 .66 | .83 .60 .48 .54 .41 .43 .27 ..8 .58 .47 | .51 .72 .44 .62 .63 .64 ..5 .39 .10 .68 | .22 .86 .18 .26 .14 ..3 .82 .32 .93 .92 | .13 .25 .97 .36 .53 .84 .20 ..4 .91 .99 | .11 .45 .79 .29 .33 .40 .21 .55 .56 ..9 | .73 .42 .67 .98 ..7 .65 .94 .74 .24 100 | .70 .31 .35 .85 .49 .88 .52 .76 .90 .46 | .80 .38 .95 .37 .71 .50 .89 .61 .81 .75 | .17 .15 ..2 .19 .96 .59 .12 .77 ..1 .16

                .22 .86 .18 .26 .14 ..3 .82 .32 .93 .92 | .13 .25 .97 .36 .53 .84 .20 ..4 .91 .99 | .11 .45 .79 .29 .33 .40 .21 .55 .56 ..9 | .73 .42 .67 .98 ..7 .65 .94 .74 .24 100 | .70 .31 .35 .85 .49 .88 .52 .76 .90 .46 | .80 .38 .95 .37 .71 .50 .89 .61 .81 .75 | .17 .15 ..2 .19 .96 .59 .12 .77 ..1 .16 | .87 .30 .23 .69 .78 .28 .34 .57 ..6 .66 | .83 .60 .48 .54 .41 .43 .27 ..8 .58 .47 | .51 .72 .44 .62 .63 .64 ..5 .39 .10 .68

                ----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+----------------------------------------

                .74 .24 100 .73 .42 .67 .98 ..7 .65 .94 | .76 .90 .46 .70 .31 .35 .85 .49 .88 .52 | .61 .81 .75 .80 .38 .95 .37 .71 .50 .89 | .77 ..1 .16 .17 .15 ..2 .19 .96 .59 .12 | .57 ..6 .66 .87 .30 .23 .69 .78 .28 .34 | ..8 .58 .47 .83 .60 .48 .54 .41 .43 .27 | .39 .10 .68 .51 .72 .44 .62 .63 .64 ..5 | .32 .93 .92 .22 .86 .18 .26 .14 ..3 .82 | ..4 .91 .99 .13 .25 .97 .36 .53 .84 .20 | .55 .56 ..9 .11 .45 .79 .29 .33 .40 .21

                .77 ..1 .16 .17 .15 ..2 .19 .96 .59 .12 | .57 ..6 .66 .87 .30 .23 .69 .78 .28 .34 | ..8 .58 .47 .83 .60 .48 .54 .41 .43 .27 | .39 .10 .68 .51 .72 .44 .62 .63 .64 ..5 | .32 .93 .92 .22 .86 .18 .26 .14 ..3 .82 | ..4 .91 .99 .13 .25 .97 .36 .53 .84 .20 | .55 .56 ..9 .11 .45 .79 .29 .33 .40 .21 | .74 .24 100 .73 .42 .67 .98 ..7 .65 .94 | .76 .90 .46 .70 .31 .35 .85 .49 .88 .52 | .61 .81 .75 .80 .38 .95 .37 .71 .50 .89

                .39 .10 .68 .51 .72 .44 .62 .63 .64 ..5 | .32 .93 .92 .22 .86 .18 .26 .14 ..3 .82 | ..4 .91 .99 .13 .25 .97 .36 .53 .84 .20 | .55 .56 ..9 .11 .45 .79 .29 .33 .40 .21 | .74 .24 100 .73 .42 .67 .98 ..7 .65 .94 | .76 .90 .46 .70 .31 .35 .85 .49 .88 .52 | .61 .81 .75 .80 .38 .95 .37 .71 .50 .89 | .77 ..1 .16 .17 .15 ..2 .19 .96 .59 .12 | .57 ..6 .66 .87 .30 .23 .69 .78 .28 .34 | ..8 .58 .47 .83 .60 .48 .54 .41 .43 .27

                .55 .56 ..9 .11 .45 .79 .29 .33 .40 .21 | .74 .24 100 .73 .42 .67 .98 ..7 .65 .94 | .76 .90 .46 .70 .31 .35 .85 .49 .88 .52 | .61 .81 .75 .80 .38 .95 .37 .71 .50 .89 | .77 ..1 .16 .17 .15 ..2 .19 .96 .59 .12 | .57 ..6 .66 .87 .30 .23 .69 .78 .28 .34 | ..8 .58 .47 .83 .60 .48 .54 .41 .43 .27 | .39 .10 .68 .51 .72 .44 .62 .63 .64 ..5 | .32 .93 .92 .22 .86 .18 .26 .14 ..3 .82 | ..4 .91 .99 .13 .25 .97 .36 .53 .84 .20

                .61 .81 .75 .80 .38 .95 .37 .71 .50 .89 | .77 ..1 .16 .17 .15 ..2 .19 .96 .59 .12 | .57 ..6 .66 .87 .30 .23 .69 .78 .28 .34 | ..8 .58 .47 .83 .60 .48 .54 .41 .43 .27 | .39 .10 .68 .51 .72 .44 .62 .63 .64 ..5 | .32 .93 .92 .22 .86 .18 .26 .14 ..3 .82 | ..4 .91 .99 .13 .25 .97 .36 .53 .84 .20 | .55 .56 ..9 .11 .45 .79 .29 .33 .40 .21 | .74 .24 100 .73 .42 .67 .98 ..7 .65 .94 | .76 .90 .46 .70 .31 .35 .85 .49 .88 .52

                ..8 .58 .47 .83 .60 .48 .54 .41 .43 .27 | .39 .10 .68 .51 .72 .44 .62 .63 .64 ..5 | .32 .93 .92 .22 .86 .18 .26 .14 ..3 .82 | ..4 .91 .99 .13 .25 .97 .36 .53 .84 .20 | .55 .56 ..9 .11 .45 .79 .29 .33 .40 .21 | .74 .24 100 .73 .42 .67 .98 ..7 .65 .94 | .76 .90 .46 .70 .31 .35 .85 .49 .88 .52 | .61 .81 .75 .80 .38 .95 .37 .71 .50 .89 | .77 ..1 .16 .17 .15 ..2 .19 .96 .59 .12 | .57 ..6 .66 .87 .30 .23 .69 .78 .28 .34

                ..4 .91 .99 .13 .25 .97 .36 .53 .84 .20 | .55 .56 ..9 .11 .45 .79 .29 .33 .40 .21 | .74 .24 100 .73 .42 .67 .98 ..7 .65 .94 | .76 .90 .46 .70 .31 .35 .85 .49 .88 .52 | .61 .81 .75 .80 .38 .95 .37 .71 .50 .89 | .77 ..1 .16 .17 .15 ..2 .19 .96 .59 .12 | .57 ..6 .66 .87 .30 .23 .69 .78 .28 .34 | ..8 .58 .47 .83 .60 .48 .54 .41 .43 .27 | .39 .10 .68 .51 .72 .44 .62 .63 .64 ..5 | .32 .93 .92 .22 .86 .18 .26 .14 ..3 .82

                .76 .90 .46 .70 .31 .35 .85 .49 .88 .52 | .61 .81 .75 .80 .38 .95 .37 .71 .50 .89 | .77 ..1 .16 .17 .15 ..2 .19 .96 .59 .12 | .57 ..6 .66 .87 .30 .23 .69 .78 .28 .34 | ..8 .58 .47 .83 .60 .48 .54 .41 .43 .27 | .39 .10 .68 .51 .72 .44 .62 .63 .64 ..5 | .32 .93 .92 .22 .86 .18 .26 .14 ..3 .82 | ..4 .91 .99 .13 .25 .97 .36 .53 .84 .20 | .55 .56 ..9 .11 .45 .79 .29 .33 .40 .21 | .74 .24 100 .73 .42 .67 .98 ..7 .65 .94

                .57 ..6 .66 .87 .30 .23 .69 .78 .28 .34 | ..8 .58 .47 .83 .60 .48 .54 .41 .43 .27 | .39 .10 .68 .51 .72 .44 .62 .63 .64 ..5 | .32 .93 .92 .22 .86 .18 .26 .14 ..3 .82 | ..4 .91 .99 .13 .25 .97 .36 .53 .84 .20 | .55 .56 ..9 .11 .45 .79 .29 .33 .40 .21 | .74 .24 100 .73 .42 .67 .98 ..7 .65 .94 | .76 .90 .46 .70 .31 .35 .85 .49 .88 .52 | .61 .81 .75 .80 .38 .95 .37 .71 .50 .89 | .77 ..1 .16 .17 .15 ..2 .19 .96 .59 .12

                .32 .93 .92 .22 .86 .18 .26 .14 ..3 .82 | ..4 .91 .99 .13 .25 .97 .36 .53 .84 .20 | .55 .56 ..9 .11 .45 .79 .29 .33 .40 .21 | .74 .24 100 .73 .42 .67 .98 ..7 .65 .94 | .76 .90 .46 .70 .31 .35 .85 .49 .88 .52 | .61 .81 .75 .80 .38 .95 .37 .71 .50 .89 | .77 ..1 .16 .17 .15 ..2 .19 .96 .59 .12 | .57 ..6 .66 .87 .30 .23 .69 .78 .28 .34 | ..8 .58 .47 .83 .60 .48 .54 .41 .43 .27 | .39 .10 .68 .51 .72 .44 .62 .63 .64 ..5

                ----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+----------------------------------------

                ..7 .65 .94 .74 .24 100 .73 .42 .67 .98 | .49 .88 .52 .76 .90 .46 .70 .31 .35 .85 | .71 .50 .89 .61 .81 .75 .80 .38 .95 .37 | .96 .59 .12 .77 ..1 .16 .17 .15 ..2 .19 | .78 .28 .34 .57 ..6 .66 .87 .30 .23 .69 | .41 .43 .27 ..8 .58 .47 .83 .60 .48 .54 | .63 .64 ..5 .39 .10 .68 .51 .72 .44 .62 | .14 ..3 .82 .32 .93 .92 .22 .86 .18 .26 | .53 .84 .20 ..4 .91 .99 .13 .25 .97 .36 | .33 .40 .21 .55 .56 ..9 .11 .45 .79 .29

                .96 .59 .12 .77 ..1 .16 .17 .15 ..2 .19 | .78 .28 .34 .57 ..6 .66 .87 .30 .23 .69 | .41 .43 .27 ..8 .58 .47 .83 .60 .48 .54 | .63 .64 ..5 .39 .10 .68 .51 .72 .44 .62 | .14 ..3 .82 .32 .93 .92 .22 .86 .18 .26 | .53 .84 .20 ..4 .91 .99 .13 .25 .97 .36 | .33 .40 .21 .55 .56 ..9 .11 .45 .79 .29 | ..7 .65 .94 .74 .24 100 .73 .42 .67 .98 | .49 .88 .52 .76 .90 .46 .70 .31 .35 .85 | .71 .50 .89 .61 .81 .75 .80 .38 .95 .37

                .63 .64 ..5 .39 .10 .68 .51 .72 .44 .62 | .14 ..3 .82 .32 .93 .92 .22 .86 .18 .26 | .53 .84 .20 ..4 .91 .99 .13 .25 .97 .36 | .33 .40 .21 .55 .56 ..9 .11 .45 .79 .29 | ..7 .65 .94 .74 .24 100 .73 .42 .67 .98 | .49 .88 .52 .76 .90 .46 .70 .31 .35 .85 | .71 .50 .89 .61 .81 .75 .80 .38 .95 .37 | .96 .59 .12 .77 ..1 .16 .17 .15 ..2 .19 | .78 .28 .34 .57 ..6 .66 .87 .30 .23 .69 | .41 .43 .27 ..8 .58 .47 .83 .60 .48 .54

                .33 .40 .21 .55 .56 ..9 .11 .45 .79 .29 | ..7 .65 .94 .74 .24 100 .73 .42 .67 .98 | .49 .88 .52 .76 .90 .46 .70 .31 .35 .85 | .71 .50 .89 .61 .81 .75 .80 .38 .95 .37 | .96 .59 .12 .77 ..1 .16 .17 .15 ..2 .19 | .78 .28 .34 .57 ..6 .66 .87 .30 .23 .69 | .41 .43 .27 ..8 .58 .47 .83 .60 .48 .54 | .63 .64 ..5 .39 .10 .68 .51 .72 .44 .62 | .14 ..3 .82 .32 .93 .92 .22 .86 .18 .26 | .53 .84 .20 ..4 .91 .99 .13 .25 .97 .36

                .71 .50 .89 .61 .81 .75 .80 .38 .95 .37 | .96 .59 .12 .77 ..1 .16 .17 .15 ..2 .19 | .78 .28 .34 .57 ..6 .66 .87 .30 .23 .69 | .41 .43 .27 ..8 .58 .47 .83 .60 .48 .54 | .63 .64 ..5 .39 .10 .68 .51 .72 .44 .62 | .14 ..3 .82 .32 .93 .92 .22 .86 .18 .26 | .53 .84 .20 ..4 .91 .99 .13 .25 .97 .36 | .33 .40 .21 .55 .56 ..9 .11 .45 .79 .29 | ..7 .65 .94 .74 .24 100 .73 .42 .67 .98 | .49 .88 .52 .76 .90 .46 .70 .31 .35 .85

                .41 .43 .27 ..8 .58 .47 .83 .60 .48 .54 | .63 .64 ..5 .39 .10 .68 .51 .72 .44 .62 | .14 ..3 .82 .32 .93 .92 .22 .86 .18 .26 | .53 .84 .20 ..4 .91 .99 .13 .25 .97 .36 | .33 .40 .21 .55 .56 ..9 .11 .45 .79 .29 | ..7 .65 .94 .74 .24 100 .73 .42 .67 .98 | .49 .88 .52 .76 .90 .46 .70 .31 .35 .85 | .71 .50 .89 .61 .81 .75 .80 .38 .95 .37 | .96 .59 .12 .77 ..1 .16 .17 .15 ..2 .19 | .78 .28 .34 .57 ..6 .66 .87 .30 .23 .69

                .53 .84 .20 ..4 .91 .99 .13 .25 .97 .36 | .33 .40 .21 .55 .56 ..9 .11 .45 .79 .29 | ..7 .65 .94 .74 .24 100 .73 .42 .67 .98 | .49 .88 .52 .76 .90 .46 .70 .31 .35 .85 | .71 .50 .89 .61 .81 .75 .80 .38 .95 .37 | .96 .59 .12 .77 ..1 .16 .17 .15 ..2 .19 | .78 .28 .34 .57 ..6 .66 .87 .30 .23 .69 | .41 .43 .27 ..8 .58 .47 .83 .60 .48 .54 | .63 .64 ..5 .39 .10 .68 .51 .72 .44 .62 | .14 ..3 .82 .32 .93 .92 .22 .86 .18 .26

                .49 .88 .52 .76 .90 .46 .70 .31 .35 .85 | .71 .50 .89 .61 .81 .75 .80 .38 .95 .37 | .96 .59 .12 .77 ..1 .16 .17 .15 ..2 .19 | .78 .28 .34 .57 ..6 .66 .87 .30 .23 .69 | .41 .43 .27 ..8 .58 .47 .83 .60 .48 .54 | .63 .64 ..5 .39 .10 .68 .51 .72 .44 .62 | .14 ..3 .82 .32 .93 .92 .22 .86 .18 .26 | .53 .84 .20 ..4 .91 .99 .13 .25 .97 .36 | .33 .40 .21 .55 .56 ..9 .11 .45 .79 .29 | ..7 .65 .94 .74 .24 100 .73 .42 .67 .98

                .78 .28 .34 .57 ..6 .66 .87 .30 .23 .69 | .41 .43 .27 ..8 .58 .47 .83 .60 .48 .54 | .63 .64 ..5 .39 .10 .68 .51 .72 .44 .62 | .14 ..3 .82 .32 .93 .92 .22 .86 .18 .26 | .53 .84 .20 ..4 .91 .99 .13 .25 .97 .36 | .33 .40 .21 .55 .56 ..9 .11 .45 .79 .29 | ..7 .65 .94 .74 .24 100 .73 .42 .67 .98 | .49 .88 .52 .76 .90 .46 .70 .31 .35 .85 | .71 .50 .89 .61 .81 .75 .80 .38 .95 .37 | .96 .59 .12 .77 ..1 .16 .17 .15 ..2 .19

                .14 ..3 .82 .32 .93 .92 .22 .86 .18 .26 | .53 .84 .20 ..4 .91 .99 .13 .25 .97 .36 | .33 .40 .21 .55 .56 ..9 .11 .45 .79 .29 | ..7 .65 .94 .74 .24 100 .73 .42 .67 .98 | .49 .88 .52 .76 .90 .46 .70 .31 .35 .85 | .71 .50 .89 .61 .81 .75 .80 .38 .95 .37 | .96 .59 .12 .77 ..1 .16 .17 .15 ..2 .19 | .78 .28 .34 .57 ..6 .66 .87 .30 .23 .69 | .41 .43 .27 ..8 .58 .47 .83 .60 .48 .54 | .63 .64 ..5 .39 .10 .68 .51 .72 .44 .62

                ----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+----------------------------------------

                .42 .67 .98 ..7 .65 .94 .74 .24 100 .73 | .31 .35 .85 .49 .88 .52 .76 .90 .46 .70 | .38 .95 .37 .71 .50 .89 .61 .81 .75 .80 | .15 ..2 .19 .96 .59 .12 .77 ..1 .16 .17 | .30 .23 .69 .78 .28 .34 .57 ..6 .66 .87 | .60 .48 .54 .41 .43 .27 ..8 .58 .47 .83 | .72 .44 .62 .63 .64 ..5 .39 .10 .68 .51 | .86 .18 .26 .14 ..3 .82 .32 .93 .92 .22 | .25 .97 .36 .53 .84 .20 ..4 .91 .99 .13 | .45 .79 .29 .33 .40 .21 .55 .56 ..9 .11

                .15 ..2 .19 .96 .59 .12 .77 ..1 .16 .17 | .30 .23 .69 .78 .28 .34 .57 ..6 .66 .87 | .60 .48 .54 .41 .43 .27 ..8 .58 .47 .83 | .72 .44 .62 .63 .64 ..5 .39 .10 .68 .51 | .86 .18 .26 .14 ..3 .82 .32 .93 .92 .22 | .25 .97 .36 .53 .84 .20 ..4 .91 .99 .13 | .45 .79 .29 .33 .40 .21 .55 .56 ..9 .11 | .42 .67 .98 ..7 .65 .94 .74 .24 100 .73 | .31 .35 .85 .49 .88 .52 .76 .90 .46 .70 | .38 .95 .37 .71 .50 .89 .61 .81 .75 .80

                .72 .44 .62 .63 .64 ..5 .39 .10 .68 .51 | .86 .18 .26 .14 ..3 .82 .32 .93 .92 .22 | .25 .97 .36 .53 .84 .20 ..4 .91 .99 .13 | .45 .79 .29 .33 .40 .21 .55 .56 ..9 .11 | .42 .67 .98 ..7 .65 .94 .74 .24 100 .73 | .31 .35 .85 .49 .88 .52 .76 .90 .46 .70 | .38 .95 .37 .71 .50 .89 .61 .81 .75 .80 | .15 ..2 .19 .96 .59 .12 .77 ..1 .16 .17 | .30 .23 .69 .78 .28 .34 .57 ..6 .66 .87 | .60 .48 .54 .41 .43 .27 ..8 .58 .47 .83

                .45 .79 .29 .33 .40 .21 .55 .56 ..9 .11 | .42 .67 .98 ..7 .65 .94 .74 .24 100 .73 | .31 .35 .85 .49 .88 .52 .76 .90 .46 .70 | .38 .95 .37 .71 .50 .89 .61 .81 .75 .80 | .15 ..2 .19 .96 .59 .12 .77 ..1 .16 .17 | .30 .23 .69 .78 .28 .34 .57 ..6 .66 .87 | .60 .48 .54 .41 .43 .27 ..8 .58 .47 .83 | .72 .44 .62 .63 .64 ..5 .39 .10 .68 .51 | .86 .18 .26 .14 ..3 .82 .32 .93 .92 .22 | .25 .97 .36 .53 .84 .20 ..4 .91 .99 .13

                .38 .95 .37 .71 .50 .89 .61 .81 .75 .80 | .15 ..2 .19 .96 .59 .12 .77 ..1 .16 .17 | .30 .23 .69 .78 .28 .34 .57 ..6 .66 .87 | .60 .48 .54 .41 .43 .27 ..8 .58 .47 .83 | .72 .44 .62 .63 .64 ..5 .39 .10 .68 .51 | .86 .18 .26 .14 ..3 .82 .32 .93 .92 .22 | .25 .97 .36 .53 .84 .20 ..4 .91 .99 .13 | .45 .79 .29 .33 .40 .21 .55 .56 ..9 .11 | .42 .67 .98 ..7 .65 .94 .74 .24 100 .73 | .31 .35 .85 .49 .88 .52 .76 .90 .46 .70

                .60 .48 .54 .41 .43 .27 ..8 .58 .47 .83 | .72 .44 .62 .63 .64 ..5 .39 .10 .68 .51 | .86 .18 .26 .14 ..3 .82 .32 .93 .92 .22 | .25 .97 .36 .53 .84 .20 ..4 .91 .99 .13 | .45 .79 .29 .33 .40 .21 .55 .56 ..9 .11 | .42 .67 .98 ..7 .65 .94 .74 .24 100 .73 | .31 .35 .85 .49 .88 .52 .76 .90 .46 .70 | .38 .95 .37 .71 .50 .89 .61 .81 .75 .80 | .15 ..2 .19 .96 .59 .12 .77 ..1 .16 .17 | .30 .23 .69 .78 .28 .34 .57 ..6 .66 .87

                .25 .97 .36 .53 .84 .20 ..4 .91 .99 .13 | .45 .79 .29 .33 .40 .21 .55 .56 ..9 .11 | .42 .67 .98 ..7 .65 .94 .74 .24 100 .73 | .31 .35 .85 .49 .88 .52 .76 .90 .46 .70 | .38 .95 .37 .71 .50 .89 .61 .81 .75 .80 | .15 ..2 .19 .96 .59 .12 .77 ..1 .16 .17 | .30 .23 .69 .78 .28 .34 .57 ..6 .66 .87 | .60 .48 .54 .41 .43 .27 ..8 .58 .47 .83 | .72 .44 .62 .63 .64 ..5 .39 .10 .68 .51 | .86 .18 .26 .14 ..3 .82 .32 .93 .92 .22

                .31 .35 .85 .49 .88 .52 .76 .90 .46 .70 | .38 .95 .37 .71 .50 .89 .61 .81 .75 .80 | .15 ..2 .19 .96 .59 .12 .77 ..1 .16 .17 | .30 .23 .69 .78 .28 .34 .57 ..6 .66 .87 | .60 .48 .54 .41 .43 .27 ..8 .58 .47 .83 | .72 .44 .62 .63 .64 ..5 .39 .10 .68 .51 | .86 .18 .26 .14 ..3 .82 .32 .93 .92 .22 | .25 .97 .36 .53 .84 .20 ..4 .91 .99 .13 | .45 .79 .29 .33 .40 .21 .55 .56 ..9 .11 | .42 .67 .98 ..7 .65 .94 .74 .24 100 .73

                .30 .23 .69 .78 .28 .34 .57 ..6 .66 .87 | .60 .48 .54 .41 .43 .27 ..8 .58 .47 .83 | .72 .44 .62 .63 .64 ..5 .39 .10 .68 .51 | .86 .18 .26 .14 ..3 .82 .32 .93 .92 .22 | .25 .97 .36 .53 .84 .20 ..4 .91 .99 .13 | .45 .79 .29 .33 .40 .21 .55 .56 ..9 .11 | .42 .67 .98 ..7 .65 .94 .74 .24 100 .73 | .31 .35 .85 .49 .88 .52 .76 .90 .46 .70 | .38 .95 .37 .71 .50 .89 .61 .81 .75 .80 | .15 ..2 .19 .96 .59 .12 .77 ..1 .16 .17

                .86 .18 .26 .14 ..3 .82 .32 .93 .92 .22 | .25 .97 .36 .53 .84 .20 ..4 .91 .99 .13 | .45 .79 .29 .33 .40 .21 .55 .56 ..9 .11 | .42 .67 .98 ..7 .65 .94 .74 .24 100 .73 | .31 .35 .85 .49 .88 .52 .76 .90 .46 .70 | .38 .95 .37 .71 .50 .89 .61 .81 .75 .80 | .15 ..2 .19 .96 .59 .12 .77 ..1 .16 .17 | .30 .23 .69 .78 .28 .34 .57 ..6 .66 .87 | .60 .48 .54 .41 .43 .27 ..8 .58 .47 .83 | .72 .44 .62 .63 .64 ..5 .39 .10 .68 .51

                ----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+----------------------------------------

                .24 100 .73 .42 .67 .98 ..7 .65 .94 .74 | .90 .46 .70 .31 .35 .85 .49 .88 .52 .76 | .81 .75 .80 .38 .95 .37 .71 .50 .89 .61 | ..1 .16 .17 .15 ..2 .19 .96 .59 .12 .77 | ..6 .66 .87 .30 .23 .69 .78 .28 .34 .57 | .58 .47 .83 .60 .48 .54 .41 .43 .27 ..8 | .10 .68 .51 .72 .44 .62 .63 .64 ..5 .39 | .93 .92 .22 .86 .18 .26 .14 ..3 .82 .32 | .91 .99 .13 .25 .97 .36 .53 .84 .20 ..4 | .56 ..9 .11 .45 .79 .29 .33 .40 .21 .55

                ..1 .16 .17 .15 ..2 .19 .96 .59 .12 .77 | ..6 .66 .87 .30 .23 .69 .78 .28 .34 .57 | .58 .47 .83 .60 .48 .54 .41 .43 .27 ..8 | .10 .68 .51 .72 .44 .62 .63 .64 ..5 .39 | .93 .92 .22 .86 .18 .26 .14 ..3 .82 .32 | .91 .99 .13 .25 .97 .36 .53 .84 .20 ..4 | .56 ..9 .11 .45 .79 .29 .33 .40 .21 .55 | .24 100 .73 .42 .67 .98 ..7 .65 .94 .74 | .90 .46 .70 .31 .35 .85 .49 .88 .52 .76 | .81 .75 .80 .38 .95 .37 .71 .50 .89 .61

                .10 .68 .51 .72 .44 .62 .63 .64 ..5 .39 | .93 .92 .22 .86 .18 .26 .14 ..3 .82 .32 | .91 .99 .13 .25 .97 .36 .53 .84 .20 ..4 | .56 ..9 .11 .45 .79 .29 .33 .40 .21 .55 | .24 100 .73 .42 .67 .98 ..7 .65 .94 .74 | .90 .46 .70 .31 .35 .85 .49 .88 .52 .76 | .81 .75 .80 .38 .95 .37 .71 .50 .89 .61 | ..1 .16 .17 .15 ..2 .19 .96 .59 .12 .77 | ..6 .66 .87 .30 .23 .69 .78 .28 .34 .57 | .58 .47 .83 .60 .48 .54 .41 .43 .27 ..8

                .56 ..9 .11 .45 .79 .29 .33 .40 .21 .55 | .24 100 .73 .42 .67 .98 ..7 .65 .94 .74 | .90 .46 .70 .31 .35 .85 .49 .88 .52 .76 | .81 .75 .80 .38 .95 .37 .71 .50 .89 .61 | ..1 .16 .17 .15 ..2 .19 .96 .59 .12 .77 | ..6 .66 .87 .30 .23 .69 .78 .28 .34 .57 | .58 .47 .83 .60 .48 .54 .41 .43 .27 ..8 | .10 .68 .51 .72 .44 .62 .63 .64 ..5 .39 | .93 .92 .22 .86 .18 .26 .14 ..3 .82 .32 | .91 .99 .13 .25 .97 .36 .53 .84 .20 ..4

                .81 .75 .80 .38 .95 .37 .71 .50 .89 .61 | ..1 .16 .17 .15 ..2 .19 .96 .59 .12 .77 | ..6 .66 .87 .30 .23 .69 .78 .28 .34 .57 | .58 .47 .83 .60 .48 .54 .41 .43 .27 ..8 | .10 .68 .51 .72 .44 .62 .63 .64 ..5 .39 | .93 .92 .22 .86 .18 .26 .14 ..3 .82 .32 | .91 .99 .13 .25 .97 .36 .53 .84 .20 ..4 | .56 ..9 .11 .45 .79 .29 .33 .40 .21 .55 | .24 100 .73 .42 .67 .98 ..7 .65 .94 .74 | .90 .46 .70 .31 .35 .85 .49 .88 .52 .76

                .58 .47 .83 .60 .48 .54 .41 .43 .27 ..8 | .10 .68 .51 .72 .44 .62 .63 .64 ..5 .39 | .93 .92 .22 .86 .18 .26 .14 ..3 .82 .32 | .91 .99 .13 .25 .97 .36 .53 .84 .20 ..4 | .56 ..9 .11 .45 .79 .29 .33 .40 .21 .55 | .24 100 .73 .42 .67 .98 ..7 .65 .94 .74 | .90 .46 .70 .31 .35 .85 .49 .88 .52 .76 | .81 .75 .80 .38 .95 .37 .71 .50 .89 .61 | ..1 .16 .17 .15 ..2 .19 .96 .59 .12 .77 | ..6 .66 .87 .30 .23 .69 .78 .28 .34 .57

                .91 .99 .13 .25 .97 .36 .53 .84 .20 ..4 | .56 ..9 .11 .45 .79 .29 .33 .40 .21 .55 | .24 100 .73 .42 .67 .98 ..7 .65 .94 .74 | .90 .46 .70 .31 .35 .85 .49 .88 .52 .76 | .81 .75 .80 .38 .95 .37 .71 .50 .89 .61 | ..1 .16 .17 .15 ..2 .19 .96 .59 .12 .77 | ..6 .66 .87 .30 .23 .69 .78 .28 .34 .57 | .58 .47 .83 .60 .48 .54 .41 .43 .27 ..8 | .10 .68 .51 .72 .44 .62 .63 .64 ..5 .39 | .93 .92 .22 .86 .18 .26 .14 ..3 .82 .32

                .90 .46 .70 .31 .35 .85 .49 .88 .52 .76 | .81 .75 .80 .38 .95 .37 .71 .50 .89 .61 | ..1 .16 .17 .15 ..2 .19 .96 .59 .12 .77 | ..6 .66 .87 .30 .23 .69 .78 .28 .34 .57 | .58 .47 .83 .60 .48 .54 .41 .43 .27 ..8 | .10 .68 .51 .72 .44 .62 .63 .64 ..5 .39 | .93 .92 .22 .86 .18 .26 .14 ..3 .82 .32 | .91 .99 .13 .25 .97 .36 .53 .84 .20 ..4 | .56 ..9 .11 .45 .79 .29 .33 .40 .21 .55 | .24 100 .73 .42 .67 .98 ..7 .65 .94 .74

                ..6 .66 .87 .30 .23 .69 .78 .28 .34 .57 | .58 .47 .83 .60 .48 .54 .41 .43 .27 ..8 | .10 .68 .51 .72 .44 .62 .63 .64 ..5 .39 | .93 .92 .22 .86 .18 .26 .14 ..3 .82 .32 | .91 .99 .13 .25 .97 .36 .53 .84 .20 ..4 | .56 ..9 .11 .45 .79 .29 .33 .40 .21 .55 | .24 100 .73 .42 .67 .98 ..7 .65 .94 .74 | .90 .46 .70 .31 .35 .85 .49 .88 .52 .76 | .81 .75 .80 .38 .95 .37 .71 .50 .89 .61 | ..1 .16 .17 .15 ..2 .19 .96 .59 .12 .77

                .93 .92 .22 .86 .18 .26 .14 ..3 .82 .32 | .91 .99 .13 .25 .97 .36 .53 .84 .20 ..4 | .56 ..9 .11 .45 .79 .29 .33 .40 .21 .55 | .24 100 .73 .42 .67 .98 ..7 .65 .94 .74 | .90 .46 .70 .31 .35 .85 .49 .88 .52 .76 | .81 .75 .80 .38 .95 .37 .71 .50 .89 .61 | ..1 .16 .17 .15 ..2 .19 .96 .59 .12 .77 | ..6 .66 .87 .30 .23 .69 .78 .28 .34 .57 | .58 .47 .83 .60 .48 .54 .41 .43 .27 ..8 | .10 .68 .51 .72 .44 .62 .63 .64 ..5 .39

                ----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+----------------------------------------

                .65 .94 .74 .24 100 .73 .42 .67 .98 ..7 | .88 .52 .76 .90 .46 .70 .31 .35 .85 .49 | .50 .89 .61 .81 .75 .80 .38 .95 .37 .71 | .59 .12 .77 ..1 .16 .17 .15 ..2 .19 .96 | .28 .34 .57 ..6 .66 .87 .30 .23 .69 .78 | .43 .27 ..8 .58 .47 .83 .60 .48 .54 .41 | .64 ..5 .39 .10 .68 .51 .72 .44 .62 .63 | ..3 .82 .32 .93 .92 .22 .86 .18 .26 .14 | .84 .20 ..4 .91 .99 .13 .25 .97 .36 .53 | .40 .21 .55 .56 ..9 .11 .45 .79 .29 .33

                .59 .12 .77 ..1 .16 .17 .15 ..2 .19 .96 | .28 .34 .57 ..6 .66 .87 .30 .23 .69 .78 | .43 .27 ..8 .58 .47 .83 .60 .48 .54 .41 | .64 ..5 .39 .10 .68 .51 .72 .44 .62 .63 | ..3 .82 .32 .93 .92 .22 .86 .18 .26 .14 | .84 .20 ..4 .91 .99 .13 .25 .97 .36 .53 | .40 .21 .55 .56 ..9 .11 .45 .79 .29 .33 | .65 .94 .74 .24 100 .73 .42 .67 .98 ..7 | .88 .52 .76 .90 .46 .70 .31 .35 .85 .49 | .50 .89 .61 .81 .75 .80 .38 .95 .37 .71

                .64 ..5 .39 .10 .68 .51 .72 .44 .62 .63 | ..3 .82 .32 .93 .92 .22 .86 .18 .26 .14 | .84 .20 ..4 .91 .99 .13 .25 .97 .36 .53 | .40 .21 .55 .56 ..9 .11 .45 .79 .29 .33 | .65 .94 .74 .24 100 .73 .42 .67 .98 ..7 | .88 .52 .76 .90 .46 .70 .31 .35 .85 .49 | .50 .89 .61 .81 .75 .80 .38 .95 .37 .71 | .59 .12 .77 ..1 .16 .17 .15 ..2 .19 .96 | .28 .34 .57 ..6 .66 .87 .30 .23 .69 .78 | .43 .27 ..8 .58 .47 .83 .60 .48 .54 .41

                .40 .21 .55 .56 ..9 .11 .45 .79 .29 .33 | .65 .94 .74 .24 100 .73 .42 .67 .98 ..7 | .88 .52 .76 .90 .46 .70 .31 .35 .85 .49 | .50 .89 .61 .81 .75 .80 .38 .95 .37 .71 | .59 .12 .77 ..1 .16 .17 .15 ..2 .19 .96 | .28 .34 .57 ..6 .66 .87 .30 .23 .69 .78 | .43 .27 ..8 .58 .47 .83 .60 .48 .54 .41 | .64 ..5 .39 .10 .68 .51 .72 .44 .62 .63 | ..3 .82 .32 .93 .92 .22 .86 .18 .26 .14 | .84 .20 ..4 .91 .99 .13 .25 .97 .36 .53

                .50 .89 .61 .81 .75 .80 .38 .95 .37 .71 | .59 .12 .77 ..1 .16 .17 .15 ..2 .19 .96 | .28 .34 .57 ..6 .66 .87 .30 .23 .69 .78 | .43 .27 ..8 .58 .47 .83 .60 .48 .54 .41 | .64 ..5 .39 .10 .68 .51 .72 .44 .62 .63 | ..3 .82 .32 .93 .92 .22 .86 .18 .26 .14 | .84 .20 ..4 .91 .99 .13 .25 .97 .36 .53 | .40 .21 .55 .56 ..9 .11 .45 .79 .29 .33 | .65 .94 .74 .24 100 .73 .42 .67 .98 ..7 | .88 .52 .76 .90 .46 .70 .31 .35 .85 .49

                .43 .27 ..8 .58 .47 .83 .60 .48 .54 .41 | .64 ..5 .39 .10 .68 .51 .72 .44 .62 .63 | ..3 .82 .32 .93 .92 .22 .86 .18 .26 .14 | .84 .20 ..4 .91 .99 .13 .25 .97 .36 .53 | .40 .21 .55 .56 ..9 .11 .45 .79 .29 .33 | .65 .94 .74 .24 100 .73 .42 .67 .98 ..7 | .88 .52 .76 .90 .46 .70 .31 .35 .85 .49 | .50 .89 .61 .81 .75 .80 .38 .95 .37 .71 | .59 .12 .77 ..1 .16 .17 .15 ..2 .19 .96 | .28 .34 .57 ..6 .66 .87 .30 .23 .69 .78

                .84 .20 ..4 .91 .99 .13 .25 .97 .36 .53 | .40 .21 .55 .56 ..9 .11 .45 .79 .29 .33 | .65 .94 .74 .24 100 .73 .42 .67 .98 ..7 | .88 .52 .76 .90 .46 .70 .31 .35 .85 .49 | .50 .89 .61 .81 .75 .80 .38 .95 .37 .71 | .59 .12 .77 ..1 .16 .17 .15 ..2 .19 .96 | .28 .34 .57 ..6 .66 .87 .30 .23 .69 .78 | .43 .27 ..8 .58 .47 .83 .60 .48 .54 .41 | .64 ..5 .39 .10 .68 .51 .72 .44 .62 .63 | ..3 .82 .32 .93 .92 .22 .86 .18 .26 .14

                .88 .52 .76 .90 .46 .70 .31 .35 .85 .49 | .50 .89 .61 .81 .75 .80 .38 .95 .37 .71 | .59 .12 .77 ..1 .16 .17 .15 ..2 .19 .96 | .28 .34 .57 ..6 .66 .87 .30 .23 .69 .78 | .43 .27 ..8 .58 .47 .83 .60 .48 .54 .41 | .64 ..5 .39 .10 .68 .51 .72 .44 .62 .63 | ..3 .82 .32 .93 .92 .22 .86 .18 .26 .14 | .84 .20 ..4 .91 .99 .13 .25 .97 .36 .53 | .40 .21 .55 .56 ..9 .11 .45 .79 .29 .33 | .65 .94 .74 .24 100 .73 .42 .67 .98 ..7

                .28 .34 .57 ..6 .66 .87 .30 .23 .69 .78 | .43 .27 ..8 .58 .47 .83 .60 .48 .54 .41 | .64 ..5 .39 .10 .68 .51 .72 .44 .62 .63 | ..3 .82 .32 .93 .92 .22 .86 .18 .26 .14 | .84 .20 ..4 .91 .99 .13 .25 .97 .36 .53 | .40 .21 .55 .56 ..9 .11 .45 .79 .29 .33 | .65 .94 .74 .24 100 .73 .42 .67 .98 ..7 | .88 .52 .76 .90 .46 .70 .31 .35 .85 .49 | .50 .89 .61 .81 .75 .80 .38 .95 .37 .71 | .59 .12 .77 ..1 .16 .17 .15 ..2 .19 .96

                ..3 .82 .32 .93 .92 .22 .86 .18 .26 .14 | .84 .20 ..4 .91 .99 .13 .25 .97 .36 .53 | .40 .21 .55 .56 ..9 .11 .45 .79 .29 .33 | .65 .94 .74 .24 100 .73 .42 .67 .98 ..7 | .88 .52 .76 .90 .46 .70 .31 .35 .85 .49 | .50 .89 .61 .81 .75 .80 .38 .95 .37 .71 | .59 .12 .77 ..1 .16 .17 .15 ..2 .19 .96 | .28 .34 .57 ..6 .66 .87 .30 .23 .69 .78 | .43 .27 ..8 .58 .47 .83 .60 .48 .54 .41 | .64 ..5 .39 .10 .68 .51 .72 .44 .62 .63
                """.trimIndent()
            assertEquals(expected, board.prettyPrint())
        }

        @Test
        fun `Prints unsolved 100x100 board`() {
            val board = buildBoard(easy100x100)
            val expected =
                """
                .67 .98 ..7 .65 .94 .74 .24 100 .73 .42 | ... .85 .49 .88 .52 .76 .90 ... .70 ... | .95 .37 .71 .50 ... .61 ... .75 .80 .38 | ... .19 .96 .59 .12 .77 ... .16 .17 .15 | .23 .69 ... ... ... .57 ..6 .66 ... .30 | .48 .54 ... .43 .27 ... .58 .47 ... .60 | ... .62 ... .64 ..5 .39 .10 ... ... .72 | .18 ... .14 ... ... .32 ... .92 ... .86 | .97 ... .53 ... ... ... .91 ... ... ... | .79 .29 .33 .40 ... ... ... ..9 .11 ...

                ..2 ... ... .59 .12 ... ..1 ... .17 ... | .23 .69 .78 .28 .34 .57 ..6 .66 .87 ... | .48 .54 ... .43 .27 ..8 .58 .47 .83 .60 | .44 .62 .63 .64 ... .39 ... .68 .51 ... | ... .26 .14 ..3 ... .32 .93 .92 .22 .86 | .97 .36 ... ... .20 ..4 ... .99 .13 ... | .79 ... .33 ... .21 .55 .56 ..9 ... .45 | .67 ... ..7 ... .94 .74 ... 100 .73 .42 | ... .85 .49 .88 .52 .76 .90 .46 .70 ... | .95 ... .71 .50 .89 .61 .81 .75 ... ...

                ... .62 .63 ... ..5 .39 .10 .68 .51 .72 | .18 .26 .14 ..3 .82 ... .93 .92 .22 .86 | .97 .36 .53 .84 ... ..4 .91 .99 .13 ... | .79 ... ... .40 ... .55 ... ..9 ... .45 | .67 .98 ... .65 ... .74 .24 100 ... ... | ... .85 .49 .88 ... .76 .90 ... .70 .31 | ... .37 .71 .50 .89 ... ... .75 ... .38 | ... .19 ... .59 .12 .77 ..1 .16 .17 .15 | .23 .69 ... .28 .34 ... ..6 ... ... .30 | .48 .54 ... ... .27 ..8 ... .47 ... .60

                .79 .29 .33 .40 ... .55 .56 ..9 ... .45 | .67 .98 ..7 ... .94 .74 .24 100 .73 ... | ... .85 ... .88 .52 .76 .90 .46 .70 .31 | ... ... .71 .50 .89 .61 .81 ... ... .38 | ..2 .19 .96 .59 ... .77 ... .16 .17 ... | .23 .69 .78 .28 .34 ... ..6 .66 .87 .30 | ... .54 .41 .43 .27 ..8 .58 .47 ... ... | .44 .62 .63 .64 ..5 .39 .10 ... .51 .72 | .18 .26 .14 ..3 ... .32 .93 .92 ... .86 | .97 .36 .53 .84 ... ... .91 .99 .13 .25

                ... .37 ... .50 ... ... .81 .75 .80 .38 | ... .19 .96 ... .12 ... ... .16 .17 .15 | .23 .69 .78 .28 .34 .57 ..6 .66 ... .30 | .48 ... ... .43 .27 ..8 ... ... ... .60 | .44 .62 ... .64 ..5 .39 ... .68 .51 .72 | ... .26 .14 ..3 .82 .32 .93 .92 .22 ... | .97 .36 .53 .84 .20 ..4 .91 ... .13 .25 | .79 .29 .33 .40 .21 .55 .56 ..9 .11 .45 | .67 .98 ..7 .65 ... .74 ... ... .73 .42 | ... .85 .49 .88 ... .76 ... .46 .70 .31

                .48 .54 .41 ... .27 ..8 .58 .47 .83 .60 | .44 .62 ... .64 ... .39 ... .68 ... .72 | .18 .26 .14 ... ... ... .93 ... .22 .86 | .97 .36 .53 .84 ... ..4 ... ... .13 ... | .79 .29 .33 ... .21 .55 .56 ..9 .11 .45 | .67 .98 ..7 .65 .94 ... .24 100 .73 .42 | .35 .85 ... ... .52 .76 .90 .46 .70 .31 | .95 .37 ... ... .89 .61 ... ... .80 .38 | ..2 ... ... ... .12 ... ..1 ... .17 .15 | ... .69 .78 ... .34 ... ..6 .66 .87 .30

                .97 .36 .53 .84 .20 ..4 .91 .99 .13 .25 | .79 .29 .33 ... .21 .55 .56 ..9 ... .45 | .67 .98 ..7 .65 .94 .74 .24 100 .73 .42 | .35 ... .49 ... .52 .76 ... .46 ... .31 | .95 .37 .71 .50 .89 ... ... .75 .80 ... | ..2 .19 ... ... ... .77 ... .16 .17 .15 | ... .69 ... .28 ... .57 ..6 ... .87 .30 | .48 .54 .41 .43 .27 ..8 .58 .47 .83 .60 | .44 .62 ... ... ... ... .10 ... ... .72 | .18 ... .14 ..3 .82 .32 ... .92 .22 .86

                .35 ... .49 ... .52 .76 .90 .46 .70 ... | .95 .37 .71 .50 .89 .61 .81 .75 .80 .38 | ..2 .19 .96 .59 .12 ... ..1 .16 .17 .15 | .23 .69 ... .28 .34 ... ..6 .66 .87 ... | ... .54 .41 .43 ... ... .58 .47 .83 .60 | ... ... ... .64 ..5 .39 ... .68 ... ... | .18 .26 .14 ..3 ... ... .93 .92 .22 .86 | .97 .36 ... .84 .20 ..4 .91 .99 .13 .25 | .79 .29 .33 .40 .21 ... .56 ..9 .11 ... | .67 .98 ..7 ... ... ... ... 100 ... ...

                .23 .69 .78 ... .34 .57 ..6 .66 ... .30 | .48 ... .41 .43 ... ..8 ... ... .83 .60 | .44 .62 .63 .64 ..5 .39 ... .68 .51 .72 | .18 .26 .14 ..3 .82 ... ... ... .22 .86 | .97 ... .53 .84 .20 ..4 .91 ... ... .25 | ... .29 .33 ... .21 .55 .56 ..9 ... ... | .67 .98 ..7 .65 .94 .74 .24 100 .73 .42 | .35 .85 ... .88 ... .76 ... .46 .70 .31 | .95 ... .71 .50 .89 .61 .81 ... .80 .38 | ..2 .19 .96 ... .12 .77 ..1 ... .17 .15

                .18 .26 .14 ... ... .32 .93 .92 .22 ... | .97 .36 .53 .84 ... ..4 .91 ... .13 .25 | .79 .29 .33 ... .21 .55 .56 ..9 .11 .45 | .67 ... ..7 ... .94 .74 ... 100 .73 .42 | ... .85 .49 ... .52 .76 .90 .46 ... .31 | .95 ... .71 .50 .89 .61 .81 .75 .80 .38 | ..2 ... .96 .59 .12 .77 ..1 .16 .17 .15 | .23 .69 ... .28 .34 .57 ..6 .66 .87 .30 | .48 .54 .41 .43 ... ..8 .58 .47 .83 .60 | .44 ... .63 .64 ..5 ... ... .68 .51 .72

                ----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+----------------------------------------

                100 .73 .42 .67 ... ..7 .65 .94 .74 .24 | .46 .70 ... ... .85 .49 .88 .52 .76 .90 | .75 .80 .38 .95 ... ... ... .89 .61 .81 | .16 .17 .15 ..2 .19 .96 .59 ... .77 ..1 | ... .87 .30 ... .69 .78 .28 .34 .57 ..6 | ... ... .60 ... .54 .41 .43 ... ..8 .58 | .68 ... .72 .44 .62 .63 .64 ..5 .39 ... | ... .22 .86 .18 ... .14 ... .82 .32 .93 | ... .13 ... .97 ... .53 .84 ... ..4 .91 | ..9 .11 ... .79 .29 ... .40 .21 .55 .56

                .16 .17 .15 ..2 ... .96 .59 .12 .77 ..1 | .66 .87 .30 ... .69 .78 .28 .34 ... ... | .47 .83 .60 .48 .54 .41 ... .27 ..8 ... | .68 .51 .72 ... .62 .63 ... ..5 ... .10 | .92 .22 .86 ... .26 .14 ..3 .82 .32 .93 | .99 .13 .25 .97 .36 .53 ... .20 ..4 ... | ... .11 .45 .79 .29 ... .40 ... ... .56 | 100 .73 ... .67 .98 ..7 .65 .94 ... .24 | ... .70 .31 .35 .85 .49 .88 .52 .76 .90 | .75 .80 .38 .95 .37 .71 .50 .89 .61 .81

                .68 .51 .72 .44 .62 ... .64 ..5 .39 .10 | ... .22 .86 .18 ... .14 ... .82 .32 .93 | .99 .13 .25 .97 ... .53 ... .20 ... ... | ... .11 .45 .79 .29 .33 .40 .21 ... .56 | 100 .73 ... ... .98 ... .65 ... .74 .24 | .46 .70 .31 .35 .85 .49 .88 .52 .76 ... | .75 .80 ... ... ... ... .50 .89 .61 .81 | .16 ... .15 ..2 .19 .96 .59 .12 .77 ..1 | ... ... .30 .23 ... .78 .28 ... .57 ..6 | .47 .83 ... ... .54 .41 ... .27 ..8 .58

                ..9 ... .45 .79 .29 .33 ... .21 .55 .56 | 100 ... .42 .67 ... ..7 ... ... ... ... | .46 ... .31 .35 .85 .49 .88 ... .76 .90 | ... .80 .38 .95 .37 .71 .50 ... .61 .81 | .16 .17 .15 ... .19 .96 .59 .12 .77 ..1 | .66 .87 .30 .23 .69 .78 .28 .34 .57 ..6 | ... .83 ... .48 ... ... ... .27 ..8 .58 | ... .51 .72 ... ... .63 .64 ..5 ... .10 | .92 .22 .86 .18 .26 .14 ..3 .82 ... .93 | .99 ... .25 .97 ... .53 ... .20 ..4 .91

                .75 .80 .38 .95 .37 .71 ... .89 .61 ... | .16 .17 .15 ..2 ... ... .59 .12 .77 ... | .66 .87 .30 ... .69 .78 ... ... ... ..6 | .47 .83 .60 .48 .54 .41 ... .27 ... .58 | .68 .51 .72 .44 .62 .63 ... ..5 .39 ... | .92 ... .86 .18 ... .14 ... .82 ... .93 | .99 .13 .25 .97 .36 .53 .84 .20 ..4 .91 | ..9 .11 .45 .79 .29 ... .40 .21 .55 .56 | 100 .73 ... .67 .98 ..7 .65 .94 .74 .24 | .46 .70 ... .35 .85 .49 .88 .52 .76 .90

                ... .83 .60 .48 ... .41 .43 .27 ..8 .58 | .68 ... ... ... .62 .63 .64 ... ... .10 | ... .22 .86 .18 .26 .14 ... .82 .32 ... | .99 .13 .25 .97 .36 ... .84 .20 ..4 ... | ... .11 .45 .79 .29 .33 .40 .21 .55 .56 | 100 .73 .42 .67 ... ..7 .65 .94 .74 .24 | .46 .70 .31 ... ... .49 .88 ... .76 .90 | .75 .80 ... .95 .37 .71 .50 .89 .61 .81 | ... .17 .15 ..2 .19 .96 .59 .12 .77 ..1 | .66 .87 .30 .23 ... .78 .28 .34 .57 ...

                .99 .13 .25 ... .36 .53 .84 .20 ..4 .91 | ..9 ... ... .79 .29 .33 ... ... ... .56 | 100 .73 .42 ... ... ..7 .65 .94 .74 ... | ... .70 ... .35 .85 ... ... .52 .76 ... | .75 ... .38 .95 .37 .71 .50 ... .61 .81 | .16 .17 ... ..2 .19 .96 ... .12 .77 ... | .66 ... .30 .23 .69 .78 .28 ... .57 ... | ... .83 .60 .48 .54 .41 .43 .27 ..8 .58 | ... .51 .72 .44 ... .63 .64 ..5 .39 ... | ... .22 .86 .18 .26 .14 ... ... .32 .93

                .46 .70 .31 .35 .85 .49 .88 .52 .76 .90 | .75 .80 .38 .95 .37 .71 .50 .89 .61 .81 | ... ... .15 ..2 .19 .96 .59 .12 ... ..1 | .66 ... .30 .23 ... .78 .28 .34 ... ... | .47 .83 .60 ... .54 .41 ... ... ..8 .58 | ... .51 .72 .44 .62 ... .64 ..5 ... ... | .92 .22 .86 .18 .26 .14 ..3 .82 .32 .93 | ... ... ... ... .36 .53 ... .20 ... .91 | ... .11 .45 .79 ... .33 .40 .21 ... .56 | 100 .73 .42 .67 .98 ..7 ... .94 .74 .24

                .66 .87 .30 ... .69 .78 .28 .34 .57 ..6 | ... .83 .60 .48 .54 .41 ... ... ..8 ... | .68 .51 .72 .44 .62 .63 .64 ..5 .39 ... | ... .22 .86 .18 ... ... ..3 .82 .32 ... | .99 .13 .25 .97 .36 .53 .84 ... ..4 ... | ..9 ... .45 .79 ... .33 .40 ... .55 ... | 100 .73 .42 .67 .98 ..7 .65 .94 .74 .24 | .46 ... .31 .35 .85 ... .88 .52 .76 .90 | .75 .80 ... .95 .37 .71 .50 .89 .61 .81 | .16 .17 .15 ... .19 .96 .59 .12 .77 ..1

                .92 .22 .86 .18 .26 .14 ..3 .82 .32 .93 | ... .13 .25 .97 .36 ... .84 ... ... .91 | ..9 ... .45 .79 .29 .33 ... .21 ... ... | 100 .73 .42 ... .98 ... .65 ... .74 ... | .46 .70 ... ... .85 .49 .88 .52 ... .90 | .75 ... .38 ... ... .71 .50 .89 .61 .81 | .16 .17 ... ..2 .19 .96 ... .12 .77 ..1 | ... .87 .30 .23 .69 .78 .28 .34 .57 ..6 | ... .83 ... .48 .54 ... .43 ... ... .58 | .68 .51 .72 ... .62 ... .64 ..5 .39 ...

                ----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+----------------------------------------

                ... .74 .24 100 .73 ... ... ... ..7 ... | .52 .76 ... ... .70 .31 .35 .85 ... .88 | .89 .61 ... ... .80 .38 ... .37 .71 .50 | .12 .77 ..1 .16 .17 ... ..2 .19 .96 .59 | .34 ... ..6 .66 .87 .30 .23 .69 .78 .28 | .27 ... .58 .47 .83 .60 ... .54 .41 .43 | ..5 .39 ... .68 .51 .72 .44 ... ... .64 | .82 ... .93 .92 .22 .86 .18 .26 .14 ..3 | .20 ..4 .91 .99 ... .25 .97 .36 .53 .84 | ... ... .56 ..9 .11 .45 ... .29 .33 .40

                .12 ... ..1 .16 .17 .15 ..2 .19 .96 .59 | ... .57 ..6 .66 .87 .30 .23 .69 ... .28 | ... ... ... .47 .83 .60 ... .54 .41 .43 | ..5 .39 .10 .68 .51 ... .44 .62 .63 ... | .82 ... .93 ... .22 ... .18 .26 .14 ..3 | .20 ..4 .91 ... .13 .25 .97 .36 .53 .84 | .21 ... .56 ..9 ... ... .79 ... .33 .40 | .94 .74 .24 100 .73 .42 .67 ... ..7 .65 | .52 .76 ... .46 .70 ... .35 .85 ... .88 | .89 .61 .81 .75 .80 .38 .95 .37 .71 ...

                ... .39 ... ... ... .72 ... .62 .63 .64 | .82 .32 .93 .92 ... .86 ... .26 ... ..3 | ... ..4 .91 .99 ... ... .97 ... ... .84 | .21 ... ... ..9 .11 .45 .79 ... .33 .40 | .94 .74 .24 ... ... .42 ... .98 ... ... | .52 .76 ... .46 .70 ... .35 .85 .49 .88 | .89 .61 ... ... .80 .38 .95 .37 .71 .50 | .12 .77 ..1 .16 ... .15 ..2 ... .96 .59 | .34 .57 ..6 .66 .87 .30 .23 ... ... .28 | .27 ... .58 .47 .83 .60 ... .54 ... .43

                .21 .55 ... ..9 .11 ... ... ... .33 .40 | .94 .74 .24 100 .73 ... ... .98 ... ... | .52 ... .90 .46 .70 .31 ... ... .49 .88 | .89 .61 .81 .75 .80 .38 .95 .37 .71 .50 | .12 .77 ..1 .16 ... .15 ... .19 .96 .59 | ... .57 ... .66 ... .30 ... .69 .78 ... | .27 ..8 ... .47 .83 .60 .48 .54 .41 .43 | ..5 .39 .10 .68 .51 .72 .44 .62 ... .64 | .82 .32 .93 .92 .22 .86 ... .26 .14 ..3 | .20 ..4 .91 .99 ... ... ... .36 ... .84

                .89 .61 ... .75 .80 .38 ... .37 .71 .50 | .12 ... ... .16 .17 .15 ..2 .19 .96 .59 | .34 .57 ..6 ... .87 .30 .23 .69 .78 .28 | .27 ..8 .58 .47 ... .60 ... .54 .41 .43 | ..5 .39 .10 .68 .51 ... .44 .62 ... ... | .82 .32 .93 ... .22 .86 ... ... .14 ..3 | .20 ..4 .91 .99 .13 .25 .97 ... .53 .84 | .21 ... .56 ..9 .11 .45 ... .29 .33 ... | .94 ... .24 100 .73 .42 .67 .98 ... .65 | .52 .76 ... .46 .70 .31 .35 .85 .49 .88

                .27 ..8 .58 .47 ... ... .48 .54 .41 .43 | ..5 .39 ... ... .51 .72 .44 .62 .63 ... | ... .32 .93 .92 .22 .86 .18 ... .14 ..3 | .20 ..4 .91 .99 .13 ... .97 .36 .53 .84 | .21 .55 .56 ... .11 ... .79 ... .33 .40 | .94 .74 .24 100 .73 ... .67 .98 ..7 .65 | ... .76 .90 .46 .70 .31 .35 .85 .49 ... | .89 .61 .81 .75 .80 .38 .95 .37 .71 .50 | .12 .77 ..1 .16 .17 .15 ..2 .19 .96 .59 | .34 .57 ... .66 ... .30 .23 .69 ... .28

                .20 ..4 .91 .99 .13 ... .97 .36 .53 .84 | .21 .55 .56 ..9 ... .45 .79 ... ... .40 | .94 ... .24 ... .73 .42 ... .98 ... .65 | ... .76 .90 ... .70 .31 .35 .85 .49 .88 | ... .61 .81 .75 .80 .38 .95 .37 ... .50 | ... .77 ..1 .16 .17 ... ..2 .19 ... .59 | .34 ... ..6 .66 .87 .30 .23 .69 .78 ... | .27 ..8 ... .47 .83 ... .48 .54 .41 .43 | ..5 .39 .10 .68 ... .72 .44 ... .63 .64 | .82 .32 .93 .92 ... ... .18 .26 .14 ..3

                .52 .76 .90 .46 .70 .31 ... .85 ... .88 | .89 .61 .81 .75 .80 .38 ... .37 .71 .50 | .12 .77 ..1 .16 ... ... ..2 .19 ... .59 | .34 .57 ... .66 ... .30 ... .69 .78 ... | ... ... ... .47 .83 .60 .48 .54 ... ... | ..5 .39 .10 .68 ... .72 .44 ... .63 .64 | .82 .32 .93 ... ... .86 .18 .26 .14 ... | .20 ..4 .91 .99 .13 .25 .97 .36 .53 .84 | .21 .55 .56 ... .11 .45 .79 .29 .33 .40 | .94 .74 .24 100 .73 ... .67 ... ..7 ...

                .34 .57 ..6 .66 .87 .30 ... .69 .78 ... | .27 ... .58 ... .83 .60 .48 ... .41 .43 | ... .39 .10 .68 .51 .72 .44 .62 ... .64 | .82 ... .93 ... ... ... ... .26 .14 ... | .20 ..4 .91 .99 .13 .25 .97 .36 .53 .84 | .21 .55 .56 ..9 ... .45 .79 .29 ... .40 | ... ... .24 100 ... .42 .67 ... ..7 ... | ... .76 .90 .46 ... .31 ... .85 ... .88 | ... ... .81 ... .80 .38 .95 .37 .71 .50 | .12 .77 ..1 .16 .17 .15 ..2 .19 .96 .59

                .82 .32 ... .92 ... .86 .18 ... ... ..3 | .20 ... .91 .99 ... .25 .97 .36 .53 .84 | .21 ... .56 ..9 .11 .45 ... .29 ... .40 | .94 .74 .24 100 .73 .42 .67 .98 ... .65 | ... .76 .90 ... .70 ... .35 .85 .49 .88 | .89 .61 .81 .75 ... .38 .95 ... ... .50 | .12 .77 ..1 .16 .17 .15 ... .19 .96 .59 | .34 .57 ..6 .66 .87 .30 ... .69 ... .28 | .27 ..8 .58 .47 ... .60 ... ... .41 ... | ..5 .39 .10 ... .51 .72 .44 .62 .63 .64

                ----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+----------------------------------------

                .98 ..7 .65 .94 ... .24 100 .73 .42 .67 | ... .49 ... .52 .76 .90 ... .70 .31 ... | .37 .71 ... .89 .61 .81 ... .80 .38 .95 | ... .96 .59 ... .77 ..1 .16 .17 .15 ..2 | .69 .78 .28 .34 .57 ..6 .66 .87 .30 .23 | .54 .41 ... .27 ..8 ... .47 .83 .60 .48 | .62 ... ... ..5 .39 .10 .68 .51 ... .44 | .26 .14 ..3 .82 .32 ... .92 .22 .86 ... | .36 .53 ... .20 ..4 .91 .99 .13 .25 .97 | .29 .33 ... ... .55 .56 ... .11 .45 .79

                .19 .96 .59 .12 .77 ..1 .16 ... .15 ..2 | .69 ... ... .34 .57 ..6 .66 ... ... .23 | .54 ... ... .27 ... .58 ... ... .60 .48 | .62 .63 .64 ... .39 .10 .68 ... .72 .44 | ... .14 ... .82 .32 .93 .92 .22 .86 .18 | .36 .53 ... .20 ..4 ... .99 .13 .25 .97 | .29 .33 .40 .21 .55 ... ..9 .11 .45 .79 | .98 ..7 ... .94 .74 .24 100 ... .42 .67 | ... ... .88 .52 .76 .90 ... ... .31 .35 | .37 .71 .50 .89 ... .81 ... .80 .38 .95

                .62 ... .64 ..5 .39 ... ... .51 .72 ... | ... ... ..3 .82 .32 .93 .92 .22 ... ... | ... .53 .84 .20 ..4 .91 .99 ... .25 ... | .29 .33 .40 .21 ... ... ... .11 .45 .79 | .98 ..7 .65 .94 .74 ... 100 ... .42 ... | .85 .49 .88 .52 .76 .90 .46 .70 .31 ... | ... ... ... ... ... .81 .75 ... .38 .95 | ... .96 .59 .12 ... ..1 ... .17 .15 ..2 | ... .78 .28 ... .57 ..6 ... ... .30 ... | .54 .41 .43 ... ..8 .58 ... ... .60 .48

                .29 ... .40 .21 .55 .56 ..9 .11 .45 .79 | ... ... .65 .94 .74 .24 100 .73 .42 .67 | .85 .49 .88 ... ... .90 .46 .70 .31 ... | .37 .71 ... .89 .61 .81 .75 ... .38 .95 | .19 ... .59 ... ... ..1 .16 .17 .15 ..2 | .69 .78 .28 .34 .57 ..6 ... .87 ... .23 | .54 ... .43 ... ..8 .58 ... .83 .60 .48 | .62 .63 .64 ..5 .39 .10 .68 ... .72 .44 | .26 .14 ..3 .82 ... .93 .92 .22 .86 .18 | .36 ... ... .20 ..4 .91 .99 ... ... .97

                ... .71 .50 .89 ... .81 .75 ... .38 .95 | .19 .96 ... .12 .77 ... .16 .17 .15 ..2 | .69 .78 .28 .34 .57 ... .66 .87 .30 .23 | .54 .41 .43 .27 ..8 ... .47 .83 .60 ... | .62 ... .64 ..5 .39 ... .68 .51 .72 .44 | .26 ... ..3 ... .32 ... .92 .22 ... .18 | .36 ... .84 ... ..4 .91 ... ... .25 .97 | .29 .33 ... .21 .55 .56 ..9 .11 .45 .79 | .98 ..7 .65 .94 .74 .24 100 ... .42 .67 | .85 .49 .88 ... ... .90 ... .70 .31 .35

                ... .41 ... ... ... .58 .47 .83 .60 ... | .62 .63 .64 ..5 ... ... .68 ... ... .44 | .26 .14 ..3 .82 .32 .93 .92 .22 ... .18 | .36 .53 .84 .20 ..4 ... ... .13 .25 .97 | .29 .33 ... .21 .55 .56 ..9 .11 ... ... | .98 ..7 .65 .94 .74 .24 ... ... ... ... | .85 .49 .88 .52 ... ... ... .70 .31 .35 | .37 .71 ... .89 .61 .81 ... .80 ... .95 | .19 .96 .59 .12 ... ... .16 .17 .15 ..2 | .69 ... .28 .34 .57 ..6 .66 ... .30 ...

                .36 .53 .84 .20 ... .91 .99 .13 .25 .97 | .29 .33 ... .21 .55 ... ... .11 .45 .79 | .98 ..7 .65 ... .74 ... 100 ... .42 .67 | .85 ... .88 .52 ... .90 .46 .70 .31 .35 | ... .71 ... ... .61 .81 .75 ... .38 .95 | .19 ... .59 .12 ... ... .16 .17 .15 ..2 | .69 ... ... .34 .57 ..6 ... ... ... .23 | .54 ... ... ... ..8 .58 .47 .83 .60 .48 | ... .63 .64 ..5 .39 .10 .68 .51 .72 .44 | .26 .14 ... .82 .32 .93 .92 ... .86 .18

                .85 .49 .88 .52 .76 .90 .46 ... .31 .35 | .37 .71 .50 .89 .61 .81 .75 .80 .38 ... | .19 .96 .59 .12 .77 ..1 ... ... .15 ... | .69 ... ... .34 .57 ..6 ... .87 ... ... | .54 .41 .43 ... ..8 .58 .47 .83 .60 ... | .62 .63 ... ..5 .39 .10 .68 .51 .72 .44 | .26 .14 ..3 .82 .32 .93 .92 .22 .86 .18 | .36 .53 .84 .20 ..4 .91 .99 .13 .25 .97 | ... .33 .40 .21 .55 .56 ..9 .11 .45 .79 | .98 ... ... .94 .74 ... ... .73 ... .67

                ... .78 .28 .34 ... ..6 .66 ... .30 .23 | .54 .41 .43 .27 ... .58 ... .83 .60 .48 | .62 .63 .64 ..5 ... .10 .68 .51 .72 .44 | .26 .14 ..3 .82 .32 ... .92 .22 .86 .18 | .36 .53 .84 ... ..4 ... ... ... .25 ... | ... .33 .40 .21 .55 .56 ..9 .11 .45 .79 | ... ... .65 ... .74 ... 100 .73 .42 .67 | .85 .49 .88 ... .76 .90 .46 .70 ... .35 | .37 .71 .50 .89 .61 .81 ... .80 .38 .95 | ... .96 ... .12 ... ..1 ... .17 .15 ...

                ... .14 ... .82 .32 ... .92 .22 .86 .18 | ... .53 .84 ... ..4 .91 .99 .13 .25 ... | ... ... .40 .21 .55 .56 ..9 .11 .45 ... | .98 ..7 ... .94 .74 .24 100 ... .42 .67 | .85 ... ... .52 .76 .90 .46 .70 ... .35 | ... .71 .50 .89 .61 .81 .75 .80 .38 .95 | .19 .96 .59 .12 .77 ..1 .16 .17 .15 ..2 | .69 ... .28 .34 .57 ..6 .66 .87 ... .23 | ... .41 ... .27 ..8 .58 .47 ... ... .48 | .62 .63 ... ..5 .39 .10 .68 ... .72 .44

                ----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+----------------------------------------

                .73 ... .67 ... ..7 ... .94 ... .24 100 | ... .31 .35 ... .49 .88 .52 ... .90 .46 | .80 .38 .95 ... ... .50 .89 .61 .81 .75 | ... .15 ... .19 ... .59 .12 .77 ..1 .16 | .87 .30 ... .69 ... .28 .34 ... ... ... | .83 .60 .48 .54 .41 .43 .27 ..8 ... .47 | ... .72 .44 .62 ... ... ..5 .39 ... ... | .22 .86 ... ... .14 ... ... .32 ... .92 | .13 .25 .97 .36 .53 .84 .20 ..4 .91 ... | .11 .45 .79 .29 .33 .40 .21 .55 .56 ...

                ... ... ... .19 .96 ... .12 ... ..1 .16 | .87 ... .23 .69 .78 .28 ... ... ..6 .66 | ... .60 .48 ... ... ... .27 ..8 .58 .47 | .51 .72 .44 .62 ... ... ... ... .10 ... | .22 .86 .18 ... .14 ... .82 ... .93 .92 | .13 .25 .97 ... ... ... .20 ..4 .91 .99 | .11 ... .79 .29 .33 .40 ... ... .56 ... | ... .42 .67 .98 ..7 .65 .94 .74 .24 100 | ... ... .35 .85 .49 .88 .52 .76 ... .46 | .80 .38 .95 ... .71 .50 .89 .61 .81 .75

                .51 .72 .44 .62 ... .64 ..5 .39 .10 .68 | .22 .86 .18 .26 .14 ..3 .82 .32 .93 .92 | .13 .25 .97 ... ... .84 ... ..4 .91 .99 | ... .45 .79 .29 ... .40 ... .55 .56 ..9 | .73 .42 .67 .98 ..7 .65 .94 ... ... 100 | .70 .31 .35 .85 .49 .88 .52 .76 .90 .46 | .80 ... ... .37 ... .50 .89 .61 .81 .75 | ... .15 ... .19 .96 .59 .12 .77 ..1 .16 | .87 ... .23 .69 .78 ... ... .57 ... .66 | .83 ... .48 ... .41 .43 .27 ..8 .58 .47

                ... ... .79 .29 .33 .40 ... .55 .56 ..9 | .73 .42 ... ... ..7 .65 .94 .74 ... 100 | ... .31 .35 .85 .49 .88 .52 .76 .90 ... | .80 .38 ... ... ... .50 .89 .61 .81 .75 | ... .15 ..2 .19 .96 .59 .12 .77 ..1 .16 | ... ... .23 .69 ... ... ... ... ..6 .66 | .83 ... ... .54 .41 .43 ... ..8 ... .47 | .51 ... .44 .62 .63 .64 ..5 ... ... .68 | ... ... .18 ... ... ..3 .82 ... ... .92 | .13 .25 ... .36 .53 ... .20 ... .91 .99

                ... .38 .95 .37 .71 ... .89 .61 .81 .75 | .17 .15 ..2 .19 .96 ... .12 ... ... .16 | .87 .30 ... .69 .78 ... .34 .57 ... .66 | ... .60 .48 .54 .41 .43 .27 ..8 .58 .47 | ... ... .44 ... .63 .64 ..5 .39 .10 ... | ... ... ... ... .14 ..3 .82 .32 ... .92 | .13 .25 ... .36 .53 ... .20 ..4 ... .99 | .11 .45 .79 .29 ... .40 ... .55 .56 ..9 | .73 .42 .67 .98 ..7 ... ... .74 ... ... | ... ... .35 ... .49 .88 .52 .76 .90 .46

                .83 .60 .48 ... .41 ... .27 ..8 .58 .47 | ... .72 .44 .62 ... .64 ..5 .39 ... .68 | ... ... .18 .26 .14 ..3 .82 .32 ... .92 | .13 .25 .97 .36 .53 .84 ... ..4 .91 .99 | .11 .45 .79 .29 .33 ... .21 .55 ... ..9 | ... .42 .67 .98 ..7 .65 .94 ... .24 ... | .70 .31 ... ... ... .88 .52 .76 .90 .46 | .80 .38 .95 .37 ... ... .89 ... .81 .75 | .17 .15 ..2 .19 ... ... .12 ... ..1 ... | .87 .30 .23 .69 .78 .28 .34 .57 ... .66

                ... ... .97 ... .53 .84 .20 ..4 .91 ... | .11 .45 .79 ... .33 .40 .21 .55 .56 ..9 | ... .42 ... .98 ... ... ... .74 .24 100 | ... .31 .35 ... .49 .88 .52 .76 .90 .46 | ... .38 .95 .37 .71 ... .89 .61 .81 .75 | .17 .15 ..2 .19 .96 .59 ... .77 ..1 ... | .87 .30 .23 .69 .78 .28 ... .57 ... .66 | .83 ... .48 .54 .41 .43 .27 ... .58 ... | .51 .72 .44 .62 .63 .64 ..5 .39 .10 .68 | ... .86 ... ... .14 ... .82 .32 .93 ...

                .70 .31 .35 .85 ... .88 ... .76 ... .46 | ... .38 .95 .37 .71 .50 ... ... .81 .75 | .17 ... ..2 ... .96 .59 .12 ... ..1 .16 | .87 .30 .23 .69 .78 .28 .34 ... ..6 .66 | .83 .60 .48 ... .41 .43 .27 ..8 .58 .47 | ... .72 .44 .62 .63 ... ..5 ... .10 .68 | .22 .86 .18 .26 .14 ... .82 ... .93 .92 | ... .25 .97 .36 .53 ... ... ..4 ... .99 | .11 ... ... .29 .33 ... .21 .55 ... ..9 | .73 ... ... ... ..7 ... .94 ... .24 100

                .87 .30 ... .69 .78 .28 .34 .57 ..6 ... | .83 .60 .48 ... .41 .43 ... ..8 .58 .47 | ... .72 .44 .62 ... .64 ..5 .39 .10 .68 | ... .86 ... .26 .14 ..3 .82 ... .93 ... | ... ... .97 ... .53 .84 .20 ..4 ... .99 | .11 .45 ... .29 .33 .40 .21 .55 .56 ..9 | .73 .42 .67 .98 ... .65 .94 .74 .24 100 | .70 ... ... .85 .49 .88 ... .76 .90 .46 | ... .38 .95 ... .71 .50 ... .61 .81 .75 | .17 .15 ..2 .19 ... .59 .12 ... ..1 .16

                .22 ... ... .26 .14 ..3 .82 .32 .93 ... | ... .25 .97 .36 .53 ... .20 ..4 .91 ... | .11 ... .79 ... ... .40 .21 .55 .56 ..9 | .73 ... .67 ... ... .65 .94 .74 .24 100 | .70 .31 .35 .85 .49 .88 .52 .76 ... .46 | .80 .38 .95 ... .71 ... .89 .61 .81 .75 | .17 .15 ... .19 .96 .59 .12 .77 ..1 .16 | .87 .30 .23 .69 .78 ... .34 .57 ..6 .66 | .83 .60 ... ... ... .43 ... ... .58 .47 | .51 .72 .44 .62 ... ... ..5 ... .10 ...

                ----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+----------------------------------------

                .74 ... ... .73 .42 .67 ... ..7 .65 .94 | .76 ... .46 ... ... ... .85 .49 .88 .52 | .61 .81 .75 ... .38 .95 ... ... .50 ... | ... ..1 .16 .17 .15 ..2 .19 .96 .59 ... | ... ..6 .66 .87 .30 .23 .69 .78 .28 .34 | ..8 .58 .47 .83 .60 .48 .54 .41 ... .27 | .39 .10 .68 ... ... .44 ... .63 ... ... | ... ... .92 .22 .86 .18 .26 .14 ..3 .82 | ..4 .91 ... .13 .25 .97 .36 .53 .84 .20 | .55 .56 ..9 .11 .45 .79 .29 .33 .40 .21

                .77 ..1 .16 .17 ... ..2 .19 .96 .59 ... | .57 ..6 .66 .87 ... .23 .69 .78 ... .34 | ... .58 .47 .83 ... ... .54 .41 .43 ... | .39 .10 ... .51 ... ... .62 .63 .64 ..5 | .32 .93 .92 .22 .86 .18 .26 ... ... .82 | ..4 .91 ... .13 .25 .97 .36 .53 ... ... | .55 ... ..9 .11 ... .79 .29 ... .40 .21 | .74 .24 ... .73 ... .67 .98 ... .65 .94 | .76 ... ... ... .31 ... .85 ... ... .52 | ... .81 .75 .80 ... ... .37 .71 ... .89

                ... .10 .68 .51 .72 .44 .62 .63 .64 ..5 | .32 .93 .92 .22 .86 .18 ... ... ..3 .82 | ..4 .91 ... .13 .25 .97 .36 .53 .84 .20 | .55 ... ... ... .45 .79 .29 .33 .40 .21 | .74 ... ... .73 .42 ... ... ..7 ... .94 | ... .90 .46 .70 .31 ... .85 .49 ... .52 | .61 ... .75 .80 .38 .95 .37 ... ... ... | .77 ..1 .16 .17 .15 ..2 .19 .96 .59 .12 | ... ..6 ... ... .30 .23 ... .78 ... .34 | ..8 .58 .47 .83 ... .48 .54 .41 ... .27

                .55 .56 ..9 .11 .45 .79 .29 .33 .40 .21 | ... ... 100 .73 .42 .67 .98 ..7 .65 .94 | .76 .90 ... .70 .31 ... .85 .49 .88 .52 | .61 .81 ... .80 .38 .95 .37 .71 ... .89 | .77 ..1 ... .17 .15 ..2 .19 ... .59 ... | .57 ..6 .66 .87 ... .23 .69 ... .28 .34 | ..8 ... .47 .83 .60 .48 ... ... .43 .27 | ... .10 .68 ... .72 .44 .62 .63 .64 ..5 | .32 .93 .92 .22 .86 .18 .26 .14 ..3 .82 | ... .91 .99 .13 .25 .97 .36 .53 ... ...

                .61 ... .75 .80 .38 ... .37 .71 ... .89 | .77 ..1 .16 .17 .15 ... ... .96 .59 .12 | .57 ..6 .66 .87 .30 .23 .69 .78 .28 .34 | ... .58 .47 ... .60 .48 .54 .41 .43 .27 | ... ... .68 ... .72 .44 ... ... .64 ... | ... .93 .92 .22 .86 .18 .26 .14 ..3 ... | ..4 .91 .99 .13 .25 .97 .36 ... .84 ... | .55 .56 ..9 .11 .45 .79 ... .33 .40 .21 | .74 .24 100 .73 .42 .67 .98 ..7 ... .94 | .76 .90 .46 ... ... .35 .85 .49 .88 .52

                ..8 ... .47 ... .60 .48 ... .41 .43 .27 | .39 .10 .68 .51 .72 ... ... .63 .64 ..5 | .32 .93 .92 ... .86 .18 .26 .14 ..3 .82 | ..4 .91 .99 ... ... .97 .36 .53 .84 .20 | .55 .56 ... .11 .45 .79 ... .33 .40 .21 | .74 .24 ... .73 .42 .67 .98 ..7 .65 ... | ... ... .46 .70 .31 .35 .85 .49 .88 .52 | ... .81 .75 ... .38 .95 ... ... .50 ... | .77 ..1 .16 ... .15 ... .19 .96 .59 .12 | ... ..6 .66 .87 .30 .23 ... ... .28 .34

                ..4 ... .99 .13 ... .97 .36 .53 .84 ... | .55 ... ... .11 .45 .79 .29 .33 ... .21 | .74 .24 100 ... .42 ... ... ..7 .65 .94 | .76 ... .46 .70 ... .35 .85 .49 .88 .52 | .61 .81 .75 ... .38 ... .37 .71 .50 .89 | .77 ... .16 ... ... ..2 ... .96 .59 .12 | ... ... ... ... ... .23 ... .78 .28 .34 | ..8 ... .47 .83 ... .48 ... .41 ... .27 | .39 .10 .68 .51 ... ... .62 .63 .64 ..5 | .32 ... .92 .22 ... .18 .26 .14 ..3 .82

                .76 .90 .46 ... .31 ... .85 .49 ... .52 | ... .81 ... ... .38 ... ... ... ... .89 | .77 ... ... .17 .15 ..2 .19 ... .59 .12 | .57 ... ... .87 .30 ... .69 .78 ... .34 | ..8 ... .47 .83 .60 .48 .54 .41 .43 ... | .39 .10 .68 ... .72 .44 .62 .63 .64 ..5 | ... .93 ... .22 .86 ... .26 .14 ... .82 | ..4 .91 .99 ... .25 .97 .36 .53 .84 .20 | .55 ... ..9 ... .45 .79 .29 .33 ... .21 | .74 .24 100 .73 .42 .67 .98 ..7 .65 ...

                .57 ..6 .66 .87 ... .23 ... ... .28 .34 | ..8 ... .47 ... .60 .48 .54 .41 .43 .27 | .39 .10 .68 ... .72 .44 .62 .63 .64 ... | .32 .93 .92 .22 .86 ... ... .14 ..3 .82 | ... .91 .99 .13 .25 ... ... ... .84 .20 | .55 .56 ... .11 .45 .79 .29 .33 .40 .21 | .74 .24 ... ... .42 .67 .98 ... .65 .94 | .76 ... .46 ... .31 .35 .85 ... ... .52 | .61 .81 .75 .80 .38 .95 .37 .71 .50 .89 | ... ... .16 .17 .15 ... .19 .96 .59 ...

                .32 .93 ... ... .86 ... .26 .14 ... .82 | ..4 .91 .99 .13 .25 ... ... .53 .84 .20 | .55 .56 ... .11 ... ... .29 ... .40 .21 | .74 .24 100 .73 .42 .67 .98 ..7 .65 .94 | .76 .90 .46 ... .31 .35 .85 .49 .88 .52 | .61 .81 .75 .80 ... .95 ... .71 ... .89 | ... ..1 .16 .17 .15 ..2 ... .96 .59 .12 | .57 ... ... .87 ... .23 .69 .78 .28 ... | ... .58 .47 .83 .60 .48 .54 .41 ... .27 | .39 .10 .68 .51 ... ... .62 .63 .64 ..5

                ----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+----------------------------------------

                ..7 .65 .94 .74 .24 100 ... .42 .67 .98 | ... .88 .52 .76 .90 .46 .70 .31 .35 .85 | .71 ... .89 ... ... ... .80 .38 ... .37 | .96 .59 .12 ... ... .16 .17 .15 ..2 .19 | .78 .28 ... ... ..6 .66 .87 .30 .23 .69 | .41 .43 .27 ..8 ... ... ... .60 .48 ... | .63 .64 ..5 ... .10 .68 ... ... ... .62 | .14 ... .82 .32 ... .92 ... .86 .18 .26 | ... .84 .20 ... ... .99 .13 .25 .97 .36 | .33 .40 .21 .55 ... ... .11 .45 ... .29

                .96 .59 .12 .77 ..1 .16 ... .15 ..2 .19 | .78 ... .34 .57 ... .66 ... .30 ... .69 | .41 ... .27 ..8 .58 ... .83 .60 .48 .54 | .63 ... ..5 ... .10 .68 ... .72 .44 .62 | ... ..3 ... .32 ... .92 .22 .86 .18 .26 | ... .84 .20 ..4 .91 .99 ... .25 ... ... | .33 .40 .21 ... .56 ..9 .11 ... ... .29 | ..7 .65 .94 .74 .24 ... .73 ... ... .98 | ... .88 ... ... .90 .46 .70 .31 .35 .85 | .71 .50 ... .61 .81 .75 ... .38 ... ...

                .63 ... ..5 ... .10 ... .51 .72 .44 .62 | .14 ... .82 .32 ... .92 .22 ... .18 .26 | ... ... .20 ..4 .91 .99 ... .25 .97 .36 | .33 .40 .21 .55 .56 ..9 .11 .45 .79 ... | ... .65 .94 .74 .24 100 ... .42 .67 .98 | ... .88 .52 .76 .90 .46 .70 .31 .35 .85 | .71 ... .89 .61 .81 ... .80 .38 .95 .37 | ... .59 .12 .77 ..1 ... .17 ... ..2 .19 | ... .28 .34 .57 ..6 .66 .87 .30 .23 .69 | .41 .43 .27 ..8 .58 ... .83 ... .48 ...

                .33 .40 .21 .55 .56 ..9 .11 .45 ... .29 | ..7 ... ... ... .24 100 .73 .42 .67 .98 | .49 .88 .52 .76 .90 .46 .70 .31 ... .85 | .71 .50 .89 .61 ... .75 .80 .38 .95 .37 | .96 .59 .12 .77 ..1 .16 .17 .15 ... .19 | .78 .28 .34 .57 ..6 ... ... .30 .23 ... | .41 .43 .27 ... .58 .47 ... ... .48 .54 | .63 ... ..5 .39 ... ... .51 .72 .44 ... | .14 ..3 .82 ... ... .92 .22 .86 .18 .26 | ... .84 .20 ..4 .91 .99 .13 .25 .97 .36

                .71 .50 .89 .61 .81 .75 ... .38 ... .37 | .96 .59 .12 .77 ..1 .16 .17 .15 ..2 ... | ... .28 .34 .57 ... .66 .87 .30 .23 ... | .41 .43 .27 ..8 .58 .47 .83 .60 .48 ... | .63 ... ..5 ... .10 .68 ... .72 ... .62 | .14 ..3 .82 .32 .93 ... .22 ... ... .26 | .53 .84 .20 ..4 .91 .99 .13 .25 ... ... | .33 .40 .21 ... ... ... .11 .45 .79 .29 | ... ... .94 .74 .24 ... .73 .42 .67 .98 | .49 .88 .52 ... ... ... ... .31 ... .85

                .41 .43 .27 ..8 .58 .47 .83 ... .48 .54 | .63 ... ..5 .39 ... .68 ... .72 .44 .62 | ... ... ... .32 .93 .92 .22 .86 .18 .26 | ... .84 .20 ..4 .91 .99 .13 ... .97 ... | .33 .40 .21 .55 ... ..9 ... ... ... .29 | ..7 .65 ... .74 .24 ... .73 .42 .67 ... | ... ... .52 ... .90 .46 .70 .31 .35 .85 | .71 .50 .89 .61 .81 .75 ... .38 .95 .37 | .96 ... ... .77 ..1 .16 .17 .15 ... ... | .78 .28 .34 .57 ..6 ... .87 .30 .23 ...

                .53 .84 .20 ..4 .91 .99 .13 .25 .97 .36 | .33 .40 .21 ... ... ... .11 .45 ... .29 | ... .65 ... .74 .24 100 ... ... ... ... | .49 .88 .52 ... ... .46 ... .31 .35 ... | .71 .50 .89 ... .81 .75 .80 .38 ... .37 | .96 .59 .12 ... ... ... .17 .15 ..2 .19 | .78 ... .34 .57 ..6 .66 .87 .30 .23 .69 | .41 .43 ... ..8 .58 .47 .83 .60 .48 ... | .63 ... ..5 .39 ... .68 .51 .72 .44 .62 | .14 ..3 .82 ... .93 ... .22 ... .18 .26

                ... .88 .52 .76 .90 .46 ... .31 .35 .85 | .71 .50 .89 .61 .81 .75 .80 ... ... ... | .96 ... .12 .77 ..1 .16 .17 ... ..2 .19 | ... .28 .34 ... ... .66 .87 ... .23 .69 | ... ... .27 ..8 ... .47 .83 ... .48 ... | .63 .64 ..5 .39 .10 .68 .51 ... .44 .62 | .14 ..3 ... .32 .93 .92 .22 .86 .18 .26 | ... ... .20 ..4 .91 .99 .13 .25 .97 ... | .33 .40 ... .55 .56 ..9 .11 ... ... .29 | ..7 .65 ... .74 .24 100 .73 .42 ... ...

                .78 .28 ... .57 ..6 ... .87 .30 .23 .69 | .41 .43 .27 ..8 .58 .47 .83 .60 ... .54 | .63 .64 ..5 ... .10 ... .51 .72 .44 .62 | .14 ... .82 ... .93 .92 .22 .86 .18 ... | .53 .84 ... ..4 .91 .99 .13 ... ... ... | .33 ... .21 ... .56 ..9 .11 ... .79 .29 | ..7 .65 .94 ... .24 100 ... .42 ... .98 | .49 .88 .52 ... .90 .46 .70 .31 .35 ... | .71 .50 .89 .61 .81 .75 .80 ... .95 .37 | .96 .59 .12 ... ..1 .16 ... .15 ..2 ...

                .14 ..3 .82 .32 ... .92 .22 .86 .18 .26 | ... .84 ... ..4 .91 .99 .13 .25 .97 ... | .33 .40 ... .55 .56 ..9 .11 .45 .79 .29 | ..7 .65 .94 .74 ... 100 .73 .42 .67 ... | .49 .88 ... ... .90 .46 .70 .31 .35 .85 | .71 .50 .89 ... .81 .75 ... .38 .95 .37 | .96 .59 .12 .77 ..1 .16 .17 .15 ..2 .19 | .78 ... .34 .57 ... .66 .87 .30 .23 .69 | .41 .43 .27 ..8 .58 ... .83 .60 .48 .54 | .63 .64 ..5 .39 ... ... .51 .72 .44 .62

                ----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+----------------------------------------

                .42 .67 .98 ... .65 .94 .74 .24 100 .73 | .31 .35 .85 .49 .88 ... ... .90 .46 .70 | .38 ... .37 .71 .50 .89 .61 .81 ... .80 | ... ... .19 .96 .59 .12 .77 ..1 ... ... | ... .23 .69 .78 .28 ... .57 ..6 .66 .87 | ... .48 .54 .41 ... .27 ..8 ... ... ... | .72 .44 .62 .63 .64 ..5 .39 .10 ... .51 | ... .18 ... .14 ..3 ... .32 .93 .92 .22 | .25 .97 ... .53 ... .20 ..4 .91 .99 ... | ... .79 .29 .33 .40 ... .55 .56 ..9 .11

                .15 ... .19 .96 .59 .12 ... ... .16 .17 | .30 .23 .69 ... .28 ... .57 ..6 ... .87 | .60 .48 ... .41 .43 .27 ..8 .58 .47 .83 | .72 .44 .62 .63 .64 ... .39 .10 .68 ... | .86 .18 .26 .14 ... .82 .32 .93 .92 ... | .25 .97 .36 .53 .84 .20 ... ... .99 .13 | .45 .79 .29 .33 .40 ... .55 .56 ..9 .11 | .42 .67 .98 ..7 .65 ... .74 ... 100 .73 | .31 .35 ... ... ... .52 .76 ... ... .70 | ... .95 .37 ... ... .89 .61 .81 .75 ...

                ... .44 .62 .63 .64 ... .39 .10 ... .51 | .86 ... .26 .14 ..3 .82 .32 .93 .92 .22 | .25 .97 .36 .53 .84 .20 ... .91 .99 .13 | ... .79 .29 .33 ... .21 .55 .56 ..9 ... | .42 .67 .98 ..7 .65 .94 .74 ... ... .73 | .31 .35 ... .49 ... .52 .76 ... .46 .70 | ... ... ... .71 .50 .89 .61 .81 .75 .80 | .15 ... .19 .96 .59 .12 .77 ..1 .16 ... | ... ... .69 ... .28 .34 .57 ..6 ... .87 | ... .48 .54 .41 .43 .27 ..8 .58 .47 ...

                .45 .79 .29 .33 .40 ... .55 ... ..9 .11 | .42 ... .98 ..7 .65 ... ... .24 ... .73 | .31 .35 .85 .49 ... .52 .76 .90 .46 .70 | .38 .95 .37 .71 .50 .89 .61 ... ... .80 | ... ..2 ... .96 .59 ... ... ..1 .16 .17 | ... .23 ... .78 .28 ... ... ... .66 ... | .60 .48 .54 .41 ... .27 ... .58 ... .83 | .72 .44 ... .63 .64 ..5 .39 .10 .68 .51 | .86 .18 .26 .14 ..3 .82 .32 ... .92 .22 | .25 .97 .36 ... .84 .20 ... .91 .99 .13

                .38 ... ... .71 .50 .89 ... .81 ... .80 | .15 ..2 .19 .96 .59 .12 .77 ..1 .16 ... | .30 ... .69 .78 .28 .34 .57 ..6 .66 .87 | .60 .48 .54 ... .43 .27 ..8 ... .47 .83 | .72 ... .62 .63 .64 ..5 .39 .10 ... .51 | .86 .18 .26 .14 ..3 .82 .32 .93 .92 .22 | .25 ... .36 .53 .84 .20 ..4 ... .99 ... | .45 .79 .29 .33 .40 .21 ... .56 ..9 ... | ... .67 .98 ..7 .65 .94 .74 ... 100 ... | .31 .35 .85 .49 .88 .52 .76 .90 .46 ...

                .60 .48 ... .41 .43 .27 ..8 .58 .47 ... | ... .44 .62 ... .64 ... ... .10 .68 ... | .86 .18 .26 .14 ..3 .82 ... .93 .92 .22 | .25 .97 .36 .53 .84 .20 ..4 ... .99 .13 | .45 .79 .29 .33 .40 .21 .55 ... ..9 .11 | ... .67 .98 ... .65 .94 ... .24 100 .73 | .31 .35 .85 .49 .88 .52 .76 .90 ... .70 | ... .95 .37 .71 .50 .89 .61 ... ... .80 | .15 ..2 .19 .96 .59 ... .77 ..1 ... .17 | .30 .23 .69 .78 .28 .34 ... ..6 ... ...

                .25 .97 ... ... ... .20 ... .91 .99 ... | .45 .79 .29 .33 .40 .21 .55 .56 ... .11 | ... .67 .98 ..7 .65 .94 .74 .24 100 .73 | .31 .35 .85 .49 .88 .52 .76 ... .46 ... | ... ... .37 .71 .50 ... ... .81 .75 .80 | .15 ..2 .19 ... .59 .12 .77 ..1 .16 .17 | .30 ... .69 .78 .28 .34 .57 ..6 .66 .87 | ... .48 .54 .41 .43 ... ..8 ... .47 .83 | .72 ... .62 .63 .64 ..5 .39 .10 .68 .51 | ... .18 .26 .14 ..3 .82 ... .93 ... ...

                ... .35 .85 .49 ... ... .76 ... .46 .70 | .38 ... .37 .71 .50 ... .61 .81 ... .80 | ... ... .19 ... .59 .12 .77 ..1 .16 .17 | .30 .23 .69 .78 .28 .34 ... ..6 ... .87 | .60 ... .54 .41 .43 .27 ..8 .58 ... .83 | .72 .44 .62 .63 .64 ..5 .39 .10 ... .51 | .86 .18 .26 .14 ..3 .82 .32 ... .92 .22 | .25 ... .36 .53 ... .20 ..4 .91 .99 ... | .45 ... ... .33 .40 .21 ... .56 ..9 .11 | .42 .67 .98 ... .65 ... .74 .24 100 .73

                .30 .23 .69 .78 ... .34 .57 ..6 .66 ... | .60 .48 .54 .41 .43 .27 ..8 .58 ... .83 | .72 .44 ... .63 .64 ... ... .10 .68 .51 | .86 .18 ... .14 ..3 .82 .32 .93 .92 .22 | .25 ... .36 .53 .84 .20 ..4 .91 .99 .13 | ... .79 .29 .33 .40 .21 ... ... ... .11 | .42 .67 .98 ... .65 .94 ... ... 100 .73 | .31 ... .85 .49 .88 .52 .76 .90 ... ... | .38 .95 .37 .71 ... .89 ... .81 .75 .80 | .15 ..2 .19 ... .59 ... .77 ..1 .16 ...

                .86 .18 .26 .14 ..3 .82 .32 .93 .92 ... | .25 .97 .36 ... .84 .20 ..4 ... ... .13 | .45 .79 .29 .33 .40 .21 .55 .56 ..9 .11 | .42 .67 .98 ... .65 .94 ... .24 100 .73 | .31 ... .85 .49 .88 ... ... ... .46 ... | .38 ... .37 .71 .50 .89 .61 .81 ... ... | .15 ... .19 .96 .59 .12 .77 ..1 .16 ... | .30 .23 .69 .78 .28 .34 .57 ..6 .66 ... | ... .48 .54 .41 .43 .27 ..8 .58 .47 .83 | .72 .44 .62 .63 .64 ..5 .39 .10 .68 ...

                ----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+----------------------------------------

                .24 ... .73 ... .67 .98 ..7 .65 .94 .74 | .90 .46 .70 .31 .35 .85 ... .88 .52 .76 | ... ... .80 ... .95 ... ... .50 .89 .61 | ..1 .16 .17 ... ..2 .19 .96 .59 .12 .77 | ..6 .66 .87 .30 .23 ... .78 .28 .34 ... | .58 .47 .83 .60 .48 .54 .41 .43 .27 ..8 | .10 .68 .51 ... .44 .62 .63 ... ... .39 | ... .92 ... .86 .18 .26 .14 ... .82 .32 | .91 ... .13 ... .97 .36 .53 .84 .20 ..4 | .56 ..9 .11 .45 .79 .29 .33 .40 .21 .55

                ... .16 .17 .15 ..2 .19 .96 .59 .12 .77 | ..6 .66 .87 .30 .23 .69 .78 ... .34 .57 | .58 .47 .83 .60 .48 .54 .41 .43 ... ... | .10 ... .51 .72 ... .62 ... .64 ... .39 | .93 .92 ... ... ... .26 .14 ..3 ... .32 | .91 .99 .13 .25 .97 .36 .53 .84 .20 ..4 | .56 ..9 .11 ... .79 .29 ... .40 ... ... | .24 100 .73 .42 .67 .98 ... .65 .94 .74 | ... .46 .70 .31 .35 .85 .49 .88 .52 ... | .81 ... ... .38 ... .37 .71 .50 .89 .61

                .10 ... .51 ... .44 .62 .63 .64 ..5 .39 | ... .92 .22 ... ... .26 .14 ..3 .82 .32 | .91 .99 .13 ... .97 .36 ... .84 ... ..4 | .56 ..9 .11 ... .79 .29 .33 .40 ... .55 | .24 ... .73 .42 .67 .98 ..7 .65 .94 .74 | .90 .46 .70 ... .35 ... .49 .88 .52 .76 | ... .75 .80 .38 .95 .37 .71 .50 ... .61 | ..1 .16 .17 ... ..2 .19 ... ... .12 .77 | ..6 .66 .87 .30 .23 .69 .78 .28 .34 .57 | ... .47 .83 ... ... .54 .41 .43 .27 ..8

                ... ..9 .11 ... ... .29 .33 .40 ... .55 | .24 100 .73 .42 .67 .98 ..7 .65 .94 .74 | .90 .46 .70 .31 ... .85 .49 .88 ... .76 | .81 .75 .80 .38 .95 .37 ... .50 ... .61 | ... .16 .17 .15 ... .19 .96 .59 .12 .77 | ... ... .87 .30 .23 .69 ... ... .34 .57 | .58 .47 .83 .60 ... ... .41 .43 .27 ..8 | .10 ... ... .72 .44 .62 .63 ... ..5 .39 | ... .92 ... .86 .18 ... .14 ... .82 .32 | .91 .99 .13 ... .97 .36 .53 .84 .20 ...

                .81 ... ... .38 .95 .37 .71 .50 .89 ... | ... .16 .17 ... ..2 .19 .96 ... ... .77 | ..6 .66 ... .30 ... ... ... .28 ... .57 | ... .47 .83 .60 ... .54 .41 .43 .27 ..8 | .10 ... .51 ... .44 .62 .63 .64 ..5 .39 | .93 .92 .22 ... ... .26 ... ... .82 .32 | .91 .99 ... ... ... ... .53 ... ... ..4 | .56 ..9 .11 .45 .79 .29 .33 ... .21 .55 | .24 100 ... .42 .67 ... ..7 .65 ... .74 | .90 .46 .70 .31 .35 .85 ... ... .52 ...

                ... .47 ... ... .48 ... .41 .43 .27 ... | .10 .68 .51 .72 .44 .62 .63 .64 ..5 .39 | .93 .92 .22 .86 .18 ... .14 ..3 .82 .32 | ... .99 .13 .25 .97 .36 ... .84 ... ... | .56 ..9 ... .45 .79 ... ... .40 .21 ... | .24 100 .73 .42 .67 ... ..7 .65 ... .74 | .90 .46 ... .31 .35 .85 .49 .88 .52 ... | .81 ... .80 .38 .95 ... .71 .50 .89 .61 | ..1 .16 ... .15 ..2 .19 ... .59 .12 .77 | ..6 ... .87 .30 .23 .69 ... .28 .34 ...

                .91 .99 ... ... .97 .36 .53 ... .20 ..4 | ... ..9 .11 .45 ... .29 .33 ... .21 .55 | .24 100 .73 ... .67 ... ..7 ... .94 .74 | ... .46 .70 ... .35 .85 .49 .88 .52 .76 | .81 .75 .80 .38 ... .37 .71 .50 ... .61 | ..1 .16 .17 ... ..2 .19 .96 .59 .12 ... | ..6 .66 .87 .30 .23 .69 .78 ... ... .57 | .58 .47 ... .60 .48 .54 .41 .43 ... ..8 | .10 ... .51 .72 ... .62 ... ... ..5 .39 | .93 .92 ... ... .18 .26 .14 ..3 .82 .32

                .90 .46 .70 .31 ... ... .49 .88 ... .76 | .81 .75 ... .38 .95 .37 ... .50 .89 .61 | ... .16 .17 .15 ... .19 .96 .59 .12 .77 | ..6 ... .87 .30 .23 .69 .78 .28 .34 .57 | .58 .47 .83 .60 .48 .54 .41 .43 .27 ... | .10 .68 ... ... ... .62 .63 .64 ..5 ... | .93 .92 .22 .86 .18 .26 .14 ..3 .82 .32 | .91 .99 .13 .25 ... ... ... ... ... ..4 | .56 ... .11 .45 ... .29 .33 ... .21 .55 | ... 100 .73 .42 .67 .98 ... .65 ... ...

                ... .66 .87 .30 .23 ... .78 .28 .34 ... | .58 .47 .83 ... .48 .54 .41 .43 .27 ..8 | .10 .68 .51 .72 ... ... .63 .64 ... .39 | .93 .92 .22 ... .18 .26 .14 ... .82 ... | .91 ... .13 .25 .97 ... .53 ... .20 ..4 | .56 ..9 ... ... .79 .29 .33 .40 .21 .55 | .24 100 .73 ... .67 .98 ..7 .65 .94 .74 | .90 .46 .70 .31 ... .85 .49 ... .52 .76 | .81 .75 .80 .38 .95 ... .71 .50 .89 .61 | ..1 ... .17 .15 ..2 ... .96 .59 .12 .77

                .93 .92 .22 .86 .18 .26 .14 ..3 .82 ... | .91 .99 .13 .25 .97 ... .53 .84 ... ..4 | .56 ..9 .11 .45 .79 .29 .33 .40 .21 .55 | .24 100 .73 .42 .67 .98 ..7 ... ... .74 | .90 ... .70 .31 .35 ... .49 .88 .52 .76 | .81 .75 .80 ... .95 ... .71 .50 .89 .61 | ..1 .16 .17 .15 ..2 .19 .96 .59 .12 .77 | ..6 .66 ... .30 .23 .69 .78 .28 ... .57 | .58 .47 ... .60 .48 .54 .41 .43 .27 ..8 | .10 .68 .51 ... ... .62 .63 .64 ..5 .39

                ----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+-----------------------------------------+----------------------------------------

                ... .94 .74 .24 100 .73 .42 ... .98 ..7 | .88 ... .76 ... .46 .70 .31 .35 .85 .49 | ... ... .61 .81 ... ... .38 .95 .37 .71 | .59 .12 ... ... .16 .17 ... ..2 .19 .96 | .28 .34 .57 ..6 .66 ... .30 ... .69 .78 | .43 ... ..8 .58 .47 .83 .60 .48 .54 .41 | .64 ... .39 .10 .68 .51 .72 .44 .62 .63 | ..3 .82 ... .93 .92 ... .86 .18 .26 .14 | .84 .20 ..4 .91 ... .13 ... .97 .36 .53 | .40 .21 .55 .56 ... ... .45 ... .29 .33

                ... .12 .77 ... .16 .17 .15 ..2 ... ... | .28 .34 ... ..6 .66 .87 .30 .23 .69 ... | .43 .27 ..8 .58 .47 .83 .60 .48 .54 .41 | .64 ..5 .39 .10 ... .51 ... .44 .62 .63 | ..3 .82 .32 .93 ... .22 .86 .18 .26 .14 | .84 ... ... .91 .99 .13 ... .97 .36 .53 | .40 .21 .55 .56 ..9 .11 .45 .79 ... .33 | .65 .94 .74 ... 100 .73 .42 .67 ... ..7 | .88 ... .76 ... .46 .70 .31 .35 .85 ... | .50 .89 .61 .81 ... .80 ... .95 .37 .71

                .64 ..5 ... .10 .68 .51 ... .44 .62 ... | ..3 ... .32 .93 .92 .22 .86 .18 ... .14 | ... ... ..4 .91 .99 .13 .25 .97 .36 .53 | .40 .21 .55 ... ... .11 .45 .79 ... ... | .65 .94 .74 .24 100 .73 .42 ... .98 ..7 | .88 .52 .76 .90 .46 .70 ... ... .85 .49 | .50 ... .61 ... .75 ... ... ... .37 .71 | .59 .12 .77 ..1 .16 .17 .15 ..2 .19 .96 | .28 ... .57 ..6 .66 .87 .30 .23 .69 .78 | .43 .27 ... .58 .47 .83 .60 .48 ... .41

                .40 .21 .55 ... ..9 .11 .45 .79 .29 .33 | ... .94 .74 .24 100 ... .42 .67 ... ... | .88 .52 .76 .90 .46 .70 .31 .35 .85 .49 | .50 .89 .61 .81 .75 .80 .38 .95 .37 .71 | .59 ... .77 ..1 .16 ... .15 ..2 .19 .96 | .28 .34 ... ..6 .66 ... .30 ... .69 .78 | .43 .27 ..8 .58 ... ... ... ... .54 ... | .64 ..5 .39 .10 .68 .51 .72 .44 ... ... | ..3 .82 .32 .93 .92 .22 ... .18 ... ... | .84 .20 ..4 .91 ... .13 .25 ... .36 .53

                .50 ... .61 .81 .75 .80 .38 .95 .37 ... | .59 .12 .77 ..1 .16 .17 .15 ..2 .19 ... | .28 .34 .57 ... .66 .87 ... .23 .69 ... | .43 .27 ..8 .58 .47 .83 .60 .48 .54 ... | ... ..5 ... .10 .68 .51 .72 .44 .62 .63 | ... .82 .32 .93 .92 .22 .86 ... .26 .14 | .84 .20 ..4 .91 .99 .13 .25 ... ... ... | .40 ... ... .56 ..9 ... .45 .79 .29 .33 | .65 .94 ... .24 100 ... .42 .67 ... ..7 | .88 .52 .76 .90 ... .70 .31 .35 .85 .49

                .43 .27 ..8 .58 .47 ... .60 .48 .54 .41 | .64 ..5 .39 ... .68 .51 ... .44 .62 ... | ..3 ... ... .93 .92 .22 .86 .18 .26 .14 | ... .20 ..4 .91 .99 .13 .25 .97 ... .53 | .40 ... ... .56 ..9 .11 .45 .79 .29 ... | .65 .94 .74 ... 100 .73 .42 .67 .98 ..7 | .88 ... .76 .90 .46 .70 .31 .35 .85 .49 | .50 .89 .61 ... ... .80 .38 ... .37 .71 | .59 .12 ... ... .16 .17 .15 ..2 .19 ... | .28 .34 ... ... .66 ... .30 ... .69 .78

                .84 ... ..4 .91 .99 .13 ... .97 .36 .53 | ... .21 .55 .56 ... ... ... .79 .29 .33 | .65 ... .74 .24 100 .73 .42 .67 .98 ..7 | ... ... .76 .90 .46 .70 .31 ... .85 .49 | ... .89 ... ... .75 .80 ... .95 .37 .71 | ... .12 .77 ..1 ... .17 .15 ... .19 .96 | .28 .34 .57 ..6 .66 .87 ... .23 .69 ... | .43 .27 ..8 ... ... .83 .60 .48 .54 .41 | .64 ..5 ... .10 .68 .51 ... ... .62 ... | ... .82 .32 ... .92 .22 .86 .18 .26 ...

                ... .52 .76 .90 .46 .70 .31 .35 .85 ... | ... .89 ... .81 .75 .80 .38 ... ... .71 | .59 ... .77 ..1 .16 .17 .15 ... ... .96 | ... .34 .57 ..6 ... .87 .30 .23 .69 ... | .43 .27 ..8 ... .47 .83 .60 ... .54 .41 | ... ..5 .39 .10 .68 .51 .72 .44 .62 .63 | ..3 ... .32 .93 ... .22 .86 .18 ... ... | .84 .20 ..4 .91 .99 .13 .25 .97 .36 .53 | .40 .21 .55 ... ..9 .11 .45 ... .29 ... | .65 .94 ... .24 100 .73 .42 .67 .98 ...

                .28 .34 .57 ..6 ... .87 .30 ... .69 ... | ... .27 ..8 .58 .47 ... ... ... .54 .41 | .64 ..5 .39 .10 ... ... .72 .44 ... ... | ... ... .32 ... .92 .22 .86 ... ... .14 | ... .20 ..4 .91 .99 .13 .25 ... .36 .53 | .40 .21 .55 .56 ... ... ... .79 ... .33 | ... .94 .74 .24 100 .73 .42 ... .98 ... | ... .52 ... .90 .46 ... .31 .35 ... .49 | .50 .89 .61 .81 .75 .80 .38 .95 .37 .71 | .59 .12 .77 ..1 .16 .17 ... ..2 .19 .96

                ..3 .82 .32 .93 .92 .22 .86 ... ... .14 | .84 .20 ... .91 .99 .13 .25 .97 ... .53 | .40 .21 .55 ... ..9 .11 .45 .79 .29 .33 | .65 .94 .74 .24 100 .73 .42 ... .98 ... | ... .52 ... .90 ... .70 .31 .35 .85 .49 | .50 .89 .61 ... .75 .80 .38 .95 ... .71 | .59 .12 .77 ... ... .17 .15 ..2 .19 ... | .28 .34 .57 ..6 .66 .87 .30 .23 .69 .78 | .43 .27 ..8 .58 .47 .83 .60 .48 .54 ... | ... ..5 ... ... .68 .51 .72 .44 ... .63
                """.trimIndent()
            assertEquals(expected, board.prettyPrint())
        }

        @Nested
        inner class JsonPrint {
            @Test
            fun `Prints solved 9x9 board`() {
                val board = buildBoard(solved9x9)
                assertEquals(Json.encodeToString(solved9x9), board.jsonPrint())
            }

            @Test
            fun `Prints unsolved 9x9 board`() {
                val board = buildBoard(easy9x9)
                assertEquals(Json.encodeToString(easy9x9), board.jsonPrint())
            }

            @Test
            fun `Prints solved 4x4 board`() {
                val board = buildBoard(solved4x4)
                assertEquals(Json.encodeToString(solved4x4), board.jsonPrint())
            }

            @Test
            fun `Prints unsolved 4x4 board`() {
                val board = buildBoard(easy4x4)
                assertEquals(Json.encodeToString(easy4x4), board.jsonPrint())
            }

            @Test
            fun `Prints solved 16x16 board`() {
                val board = buildBoard(solved16x16)
                assertEquals(Json.encodeToString(solved16x16), board.jsonPrint())
            }

            @Test
            fun `Prints unsolved 16x16 board`() {
                val board = buildBoard(easy16x16)
                assertEquals(Json.encodeToString(easy16x16), board.jsonPrint())
            }

            @Test
            fun `Prints solved 100x100 board`() {
                val board = buildBoard(solvedEasy100x100)
                assertEquals(Json.encodeToString(solvedEasy100x100), board.jsonPrint())
            }

            @Test
            fun `Prints unsolved 100x100 board`() {
                val board = buildBoard(easy100x100)
                assertEquals(Json.encodeToString(easy100x100), board.jsonPrint())
            }
        }
    }
}
