package com.example.habittracker.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.habittracker.R
import com.example.habittracker.feature.auth.AuthViewModel

@Composable
fun AccountDeletionScreen(
    onBack: () -> Unit,
    onDeleted: () -> Unit,
    viewModel: AuthViewModel = hiltViewModel()
) {
    var confirming by remember { mutableStateOf(false) }
    val message by viewModel.message.collectAsStateWithLifecycle()

    Column(
        modifier = Modifier.fillMaxSize().padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        TextButton(onClick = onBack, modifier = Modifier.padding(bottom = 4.dp)) {
            Text("‹ " + stringResource(R.string.action_back))
        }
        Text(stringResource(R.string.deletion_title), style = MaterialTheme.typography.headlineMedium)
        Text(
            stringResource(R.string.deletion_body),
            style = MaterialTheme.typography.bodyLarge
        )
        Text(
            stringResource(R.string.deletion_web_link),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Button(
            onClick = { confirming = true },
            modifier = Modifier.fillMaxWidth()
        ) { Text(stringResource(R.string.deletion_action)) }
        message?.let {
            Text(it, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.error)
        }
    }

    if (confirming) {
        AlertDialog(
            onDismissRequest = { confirming = false },
            title = { Text(stringResource(R.string.deletion_confirm_title)) },
            text = { Text(stringResource(R.string.deletion_confirm_body)) },
            confirmButton = {
                TextButton(onClick = {
                    confirming = false
                    viewModel.deleteAccount(onDeleted)
                }) { Text(stringResource(R.string.action_delete)) }
            },
            dismissButton = {
                TextButton(onClick = { confirming = false }) {
                    Text(stringResource(R.string.action_cancel))
                }
            }
        )
    }
}
