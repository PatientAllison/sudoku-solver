package primitives

import dev.patientallison.sudoku.Coordinates
import dev.patientallison.sudoku.HouseType
import dev.patientallison.sudoku.primitives.House
import org.junit.jupiter.api.Nested
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertTrue

class HouseTest {
    val validRow = (0 until 9).map { Coordinates(0, it) }
    val validCol = (0 until 9).map { Coordinates(it, 0) }
    val validBox =
        (0 until 3).flatMap { row ->
            (0 until 3).map { col -> Coordinates(row, col) }
        }

    @Nested
    inner class ValidHouses {
        @Nested
        inner class ValidRows {
            @Test
            fun `Valid row, pre-sorted`() {
                val houseType = HouseType.ROW
                val row = House(houseType, validRow)

                // constructor didn't throw, check properties
                assertEquals(houseType, row.houseType)
                for (i in row.cellCoordinates.indices) assertEquals(validRow[i], row.cellCoordinates[i])
                assertEquals(validRow[0], row.topLeftIndex)
            }

            @Test
            fun `Valid row, shuffled`() {
                val houseType = HouseType.ROW
                val row = House(houseType, validRow.shuffled())

                assertEquals(houseType, row.houseType)
                for (i in row.cellCoordinates.indices) assertEquals(validRow[i], row.cellCoordinates[i])
                assertEquals(validRow[0], row.topLeftIndex)
            }
        }

        @Nested
        inner class ValidCols {
            @Test
            fun `Valid column, pre-sorted`() {
                val houseType = HouseType.COLUMN
                val col = House(houseType, validCol)

                // constructor didn't throw, check properties
                assertEquals(houseType, col.houseType)
                for (i in col.cellCoordinates.indices) assertEquals(validCol[i], col.cellCoordinates[i])
                assertEquals(validCol[0], col.topLeftIndex)
            }

            @Test
            fun `Valid column, shuffled`() {
                val houseType = HouseType.COLUMN
                val col = House(houseType, validCol.shuffled())

                // constructor didn't throw, check properties
                assertEquals(houseType, col.houseType)
                for (i in col.cellCoordinates.indices) assertEquals(validCol[i], col.cellCoordinates[i])
                assertEquals(validCol[0], col.topLeftIndex)
            }
        }

        @Nested
        inner class ValidBoxes {
            @Test
            fun `Valid box, pre-sorted`() {
                val houseType = HouseType.BOX
                val box = House(houseType, validBox)

                // constructor didn't throw, check properties
                assertEquals(houseType, box.houseType)
                for (i in box.cellCoordinates.indices) assertEquals(validBox[i], box.cellCoordinates[i])
                assertEquals(validBox[0], box.topLeftIndex)
            }

            @Test
            fun `Valid box, shuffled`() {
                val houseType = HouseType.BOX
                val box = House(houseType, validBox.shuffled())

                // constructor didn't throw, check properties
                assertEquals(houseType, box.houseType)
                for (i in box.cellCoordinates.indices) assertEquals(validBox[i], box.cellCoordinates[i])
                assertEquals(validBox[0], box.topLeftIndex)
            }
        }
    }

    @Nested
    inner class InvalidUnits {
        @Nested
        inner class NonSquare {
            @Test
            fun `Empty array is not square`() {
                val cellCoordinates = emptyList<Coordinates>()
                val exception =
                    assertFailsWith<IllegalArgumentException> {
                        House(HouseType.ROW, cellCoordinates)
                    }
                assertTrue(exception.message!!.contains("Cell count must be a square positive integer!"))
            }

            @Test
            fun `Non-square positive coordinate count fails`() {
                val cellCoordinates = (0 until 3).map { Coordinates(0, it) }
                val exception =
                    assertFailsWith<IllegalArgumentException> {
                        House(HouseType.ROW, cellCoordinates)
                    }
                assertTrue(exception.message!!.contains("Cell count must be a square positive integer!"))
            }
        }

        @Nested
        inner class InvalidRows {
            @Test
            fun `Not all coords have the same row value`() {
                val exception =
                    assertFailsWith<IllegalArgumentException> {
                        House(HouseType.ROW, validCol)
                    }
                assertTrue(exception.message!!.contains("ROW coords are not in the same row!"))
            }

            @Test
            fun `Row value out of bounds of board`() {
                val cellCoordinates = (0 until 9).map { Coordinates(9, it) }
                val exception =
                    assertFailsWith<IllegalArgumentException> {
                        House(HouseType.ROW, cellCoordinates)
                    }
                assertTrue(exception.message!!.contains("ROW index is greater than cell count!"))
            }

            @Test
            fun `Col values have duplicates`() {
                val cellCoordinates = validRow.toMutableList().apply { this[1] = this[0] }
                val exception =
                    assertFailsWith<IllegalArgumentException> {
                        House(HouseType.ROW, cellCoordinates)
                    }
                assertTrue(exception.message!!.contains("Validation of column values in a ROW failed!"))
            }

            @Test
            fun `Col values do not start at 0`() {
                val cellCoordinates = (1 until 10).map { Coordinates(0, it) }
                val exception =
                    assertFailsWith<IllegalArgumentException> {
                        House(HouseType.ROW, cellCoordinates)
                    }
                assertTrue(exception.message!!.contains("Validation of column values in a ROW failed!"))
            }

            @Test
            fun `Col values are non-consecutive`() {
                val cellCoordinates = validRow.toMutableList().apply { this[8] = Coordinates(0, 10) }
                val exception =
                    assertFailsWith<IllegalArgumentException> {
                        House(HouseType.ROW, cellCoordinates)
                    }
                assertTrue(exception.message!!.contains("Validation of column values in a ROW failed!"))
            }
        }

        @Nested
        inner class InvalidCols {
            @Test
            fun `Not all coords have the same col value`() {
                val exception =
                    assertFailsWith<IllegalArgumentException> {
                        House(HouseType.COLUMN, validRow)
                    }
                assertTrue(exception.message!!.contains("COLUMN coords are not in the same column!"))
            }

            @Test
            fun `Row value out of bounds of board`() {
                val cellCoordinates = (0 until 9).map { Coordinates(0, 9) }
                val exception =
                    assertFailsWith<IllegalArgumentException> {
                        House(HouseType.COLUMN, cellCoordinates)
                    }
                assertTrue(exception.message!!.contains("COLUMN index is greater than cell count!"))
            }

            @Test
            fun `Col values have duplicates`() {
                val cellCoordinates = validCol.toMutableList().apply { this[1] = this[0] }
                val exception =
                    assertFailsWith<IllegalArgumentException> {
                        House(HouseType.COLUMN, cellCoordinates)
                    }
                assertTrue(exception.message!!.contains("Validation of row values in a COLUMN failed!"))
            }

            @Test
            fun `Col values do not start at 0`() {
                val cellCoordinates = (1 until 10).map { Coordinates(it, 0) }
                val exception =
                    assertFailsWith<IllegalArgumentException> {
                        House(HouseType.COLUMN, cellCoordinates)
                    }
                assertTrue(exception.message!!.contains("Validation of row values in a COLUMN failed!"))
            }

            @Test
            fun `Col values are non-consecutive`() {
                val cellCoordinates = validCol.toMutableList().apply { this[8] = Coordinates(10, 0) }
                val exception =
                    assertFailsWith<IllegalArgumentException> {
                        House(HouseType.COLUMN, cellCoordinates)
                    }
                assertTrue(exception.message!!.contains("Validation of row values in a COLUMN failed!"))
            }
        }

        @Nested
        inner class InvalidBoxes {
            @Test
            fun `Duplicate coords are invalid`() {
                val cellCoordinates = validBox.toMutableList().apply { this[1] = this[0] }
                val exception =
                    assertFailsWith<IllegalArgumentException> {
                        House(HouseType.BOX, cellCoordinates)
                    }
                assertTrue(exception.message!!.contains("Not all cell coordinates are unique!"))
            }

            @Test
            fun `Horizontally misaligned box is invalid`() {
                val cellCoordinates =
                    (0 until 3).flatMap { row ->
                        (1 until 4).map { col -> Coordinates(row, col) }
                    }
                val exception =
                    assertFailsWith<IllegalArgumentException> {
                        House(HouseType.BOX, cellCoordinates)
                    }
                assertTrue(exception.message!!.contains("Box is not aligned with the overall board!"))
            }

            @Test
            fun `Subsequent columns cannot be less than first column`() {
                val cellCoordinates =
                    (3 until 6).map { Coordinates(0, it) } +
                        (1 until 3).flatMap { row ->
                            (1 until 4).map { col -> Coordinates(row, col) }
                        }
                val exception =
                    assertFailsWith<IllegalArgumentException> {
                        House(HouseType.BOX, cellCoordinates)
                    }
                assertTrue(exception.message!!.contains("Cell column is less than first cell's column!"))
            }

            @Test
            fun `Subsequent columns cannot be greater than maxCol`() {
                val cellCoordinates =
                    (3 until 6).map { Coordinates(0, it) } +
                        (1 until 3).flatMap { row ->
                            (6 until 9).map { col -> Coordinates(row, col) }
                        }
                val exception =
                    assertFailsWith<IllegalArgumentException> {
                        House(HouseType.BOX, cellCoordinates)
                    }
                assertTrue(exception.message!!.contains("Cell column is too high to be in the same box as the first column!"))
            }

            @Test
            fun `Subsequent rows cannot be greater than maxRow`() {
                val cellCoordinates =
                    (0 until 3).map { Coordinates(3, it) } +
                        (6 until 8).flatMap { row ->
                            (0 until 3).map { col -> Coordinates(row, col) }
                        }
                val exception =
                    assertFailsWith<IllegalArgumentException> {
                        House(HouseType.BOX, cellCoordinates)
                    }
                print(exception.message)
                assertTrue(exception.message!!.contains("Cell row is too high to be in the same box as the first row!"))
            }
        }
    }
}
