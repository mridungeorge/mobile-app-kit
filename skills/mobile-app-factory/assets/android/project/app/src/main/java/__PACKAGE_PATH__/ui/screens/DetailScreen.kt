package __PACKAGE__.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import __PACKAGE__.R
import __PACKAGE__.data.db.HabitEntity
import __PACKAGE__.feature.detail.DetailViewModel
import __PACKAGE__.ui.components.StateHost

@Composable
fun DetailScreen(onBack: () -> Unit, viewModel: DetailViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()

    Column(Modifier.fillMaxSize()) {
        TextButton(onClick = onBack, modifier = Modifier.padding(8.dp)) {
            Text("‹ " + stringResource(R.string.action_back))
        }
        StateHost(state = state, onRetry = onBack) { habit -> DetailContent(habit) }
    }
}

@Composable
private fun DetailContent(habit: HabitEntity) {
    Column(
        modifier = Modifier.fillMaxWidth().padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Text(habit.title, style = MaterialTheme.typography.headlineMedium)
        Text(
            pluralStringResource(R.plurals.detail_streak, habit.streak, habit.streak),
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.primary
        )
        Text(
            stringResource(R.string.detail_body, habit.id),
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            stringResource(R.string.detail_a11y_note),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}
