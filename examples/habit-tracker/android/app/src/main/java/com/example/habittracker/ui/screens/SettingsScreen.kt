package com.example.habittracker.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.habittracker.R
import com.example.habittracker.feature.auth.AuthViewModel
import com.example.habittracker.feature.settings.SettingsViewModel

@Composable
fun SettingsScreen(
    onSignIn: () -> Unit,
    onDeleteAccount: () -> Unit,
    settings: SettingsViewModel = hiltViewModel(),
    auth: AuthViewModel = hiltViewModel()
) {
    val notifications by settings.notifications.collectAsStateWithLifecycle()
    val reduceMotion by settings.reduceMotion.collectAsStateWithLifecycle()
    val session by auth.session.collectAsStateWithLifecycle()

    Column(
        modifier = Modifier.fillMaxSize().padding(horizontal = 20.dp, vertical = 16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Text(stringResource(R.string.settings_title), style = MaterialTheme.typography.headlineMedium)

        ToggleRow(
            title = stringResource(R.string.settings_notifications),
            detail = stringResource(R.string.settings_notifications_detail),
            checked = notifications,
            onChange = settings::setNotifications
        )
        ToggleRow(
            title = stringResource(R.string.settings_reduce_motion),
            detail = stringResource(R.string.settings_reduce_motion_detail),
            checked = reduceMotion,
            onChange = settings::setReduceMotion
        )

        HorizontalDivider()

        val current = session
        Text(
            if (current == null) {
                stringResource(R.string.settings_not_signed_in)
            } else {
                stringResource(R.string.settings_signed_in_as, current.email)
            },
            style = MaterialTheme.typography.bodyLarge
        )
        if (current == null) {
            OutlinedButton(onClick = onSignIn, modifier = Modifier.fillMaxWidth()) {
                Text(stringResource(R.string.settings_sign_in))
            }
        } else {
            OutlinedButton(onClick = auth::signOut, modifier = Modifier.fillMaxWidth()) {
                Text(stringResource(R.string.settings_sign_out))
            }
        }

        HorizontalDivider()

        Text(stringResource(R.string.settings_account), style = MaterialTheme.typography.titleMedium)
        Text(
            stringResource(R.string.settings_delete_detail),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        OutlinedButton(onClick = onDeleteAccount, modifier = Modifier.fillMaxWidth()) {
            Text(stringResource(R.string.settings_delete_account))
        }
    }
}

@Composable
private fun ToggleRow(title: String, detail: String, checked: Boolean, onChange: (Boolean) -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.titleLarge)
            Text(detail, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Switch(
            checked = checked,
            onCheckedChange = onChange,
            modifier = Modifier.semantics { contentDescription = title }
        )
    }
}
