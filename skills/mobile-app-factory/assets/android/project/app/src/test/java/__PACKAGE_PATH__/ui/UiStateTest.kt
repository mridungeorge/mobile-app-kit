package __PACKAGE__.ui

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Pure JVM test — no Android framework, no emulator. Every screen's state machine is this enum,
 * so the four states a store reviewer checks (loading, empty, error, content) are covered here
 * once instead of per screen.
 */
class UiStateTest {
    @Test
    fun `exhaustive when covers every state`() {
        val states: List<UiState<String>> = listOf(
            UiState.Loading,
            UiState.Empty,
            UiState.Offline,
            UiState.Error("boom"),
            UiState.Content("ok")
        )
        val rendered = states.map { state ->
            when (state) {
                UiState.Loading -> "loading"
                UiState.Empty -> "empty"
                UiState.Offline -> "offline"
                is UiState.Error -> "error:${state.message}"
                is UiState.Content -> "content:${state.data}"
            }
        }
        assertEquals(listOf("loading", "empty", "offline", "error:boom", "content:ok"), rendered)
    }

    @Test
    fun `error keeps the message a screen shows`() {
        val state: UiState<Int> = UiState.Error("Could not load")
        assertTrue(state is UiState.Error)
        assertEquals("Could not load", (state as UiState.Error).message)
    }

    @Test
    fun `content is covariant so a list state can be read as its element`() {
        val list: UiState<List<String>> = UiState.Content(listOf("a"))
        // UiState<out T> means UiState<List<String>> is a UiState<Any>.
        val any: UiState<Any> = list
        assertTrue(any is UiState.Content)
    }
}
