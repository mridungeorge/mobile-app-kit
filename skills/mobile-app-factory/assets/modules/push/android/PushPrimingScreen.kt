package __PACKAGE__.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

/** Show after a relevant user action; call the permission launcher from onEnable. */
@Composable
fun PushPrimingScreen(benefit: String, onEnable: () -> Unit, onSkip: () -> Unit) {
    Column(
        Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp, Alignment.CenterVertically)
    ) {
        Text("Stay in the loop", style = MaterialTheme.typography.headlineSmall)
        Text(benefit)
        Button(onClick = onEnable) { Text("Turn on notifications") }
        TextButton(onClick = onSkip) { Text("Not now") }
    }
}
