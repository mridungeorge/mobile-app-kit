package __PACKAGE__.ui

/**
 * One state shape for every screen: loading, empty, error, offline or content. A screen that
 * cannot represent empty and error is not finished.
 */
sealed interface UiState<out T> {
    data object Loading : UiState<Nothing>
    data object Empty : UiState<Nothing>
    data object Offline : UiState<Nothing>
    data class Error(val message: String) : UiState<Nothing>
    data class Content<T>(val data: T) : UiState<T>
}
