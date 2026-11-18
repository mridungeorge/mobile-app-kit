package __PACKAGE__.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import __PACKAGE__.R
import __PACKAGE__.ui.UiState

/**
 * Renders the shared [UiState]. Every screen gets loading, empty, offline and error for free;
 * a new screen cannot quietly ship without them.
 */
@Composable
fun <T> StateHost(
    state: UiState<T>,
    onRetry: () -> Unit,
    empty: @Composable () -> Unit = {
        EmptyState(
            title = stringResource(R.string.state_empty_title),
            detail = stringResource(R.string.state_empty_detail)
        )
    },
    content: @Composable (T) -> Unit
) {
    when (state) {
        UiState.Loading -> LoadingState()
        UiState.Empty -> empty()
        UiState.Offline -> MessageState(
            title = stringResource(R.string.state_offline_title),
            detail = stringResource(R.string.state_offline_detail),
            onRetry = onRetry
        )
        is UiState.Error -> MessageState(
            title = stringResource(R.string.state_error_title),
            detail = state.message,
            onRetry = onRetry
        )
        is UiState.Content -> content(state.data)
    }
}

@Composable
fun LoadingState() {
    val label = stringResource(R.string.state_loading)
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator(Modifier.semantics { contentDescription = label })
    }
}

@Composable
fun EmptyState(title: String, detail: String) {
    Box(Modifier.fillMaxSize().padding(24.dp), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(title, style = MaterialTheme.typography.titleLarge, textAlign = TextAlign.Center)
            Text(
                detail,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
fun MessageState(title: String, detail: String, onRetry: () -> Unit) {
    Box(Modifier.fillMaxSize().padding(24.dp), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text(title, style = MaterialTheme.typography.titleLarge, textAlign = TextAlign.Center)
            Text(
                detail,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
            Button(onClick = onRetry) { Text(stringResource(R.string.state_retry)) }
        }
    }
}
