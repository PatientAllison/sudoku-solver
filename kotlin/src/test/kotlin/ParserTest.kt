import dev.patientallison.sudoku.Coordinates
import dev.patientallison.sudoku.parse
import dev.patientallison.sudoku.parseFromFile
import kotlinx.serialization.SerializationException
import kotlinx.serialization.json.Json
import org.junit.jupiter.api.Nested
import kotlin.test.Test
import kotlin.test.assertFailsWith
import kotlin.test.assertNotNull

const val PATH = "/puzzleInputs/9x9/easy/0.json"

class ParserTest {
    @Nested
    inner class Parse {
        @Test
        fun `Successfully parses valid board`() {
            val json = object {}::class.java.getResource(PATH)!!.readText()
            assertNotNull(parse(json))
        }

        @Test
        fun `Throws error if string is not valid json`() {
            assertFailsWith<SerializationException> { parse("Not Json") }
        }

        @Test
        fun `Throws error if json is not a 2D list of Int`() {
            val not2dList = Coordinates(0, 0)
            assertFailsWith<SerializationException> { parse(Json.encodeToString(not2dList)) }
        }
    }

    @Nested
    inner class ParseFromFile {
        @Test
        fun `Successfully parses valid board`() {
            assertNotNull(parseFromFile("../resources$PATH"))
        }

        @Test
        fun `Throws error when file does not exist`() {
            assertFailsWith<Exception> { parseFromFile("/nonexistent/path.json") }
        }
    }
}
