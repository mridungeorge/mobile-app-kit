package __PACKAGE__.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.hilt.lifecycle.viewmodel.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import __PACKAGE__.R
import __PACKAGE__.feature.auth.AuthViewModel

@Composable
fun AuthScreen(onBack: () -> Unit, viewModel: AuthViewModel = hiltViewModel()) {
    var email by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }
    val message by viewModel.message.collectAsStateWithLifecycle()
    val session by viewModel.session.collectAsStateWithLifecycle()

    Column(
        modifier = Modifier.fillMaxSize().padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        TextButton(onClick = onBack, modifier = Modifier.padding(bottom = 4.dp)) {
            Text("‹ " + stringResource(R.string.action_back))
        }
        Text(stringResource(R.string.auth_title), style = MaterialTheme.typography.headlineMedium)

        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text(stringResource(R.string.auth_email)) },
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )
        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text(stringResource(R.string.auth_password)) },
            singleLine = true,
            visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth()
        )
        Button(
            onClick = { viewModel.signIn("email", email, password) },
            modifier = Modifier.fillMaxWidth()
        ) { Text(stringResource(R.string.auth_sign_in_email)) }

        OutlinedButton(
            onClick = { viewModel.signIn("apple", email, password) },
            modifier = Modifier.fillMaxWidth()
        ) { Text(stringResource(R.string.auth_sign_in_apple)) }
        OutlinedButton(
            onClick = { viewModel.signIn("google", email, password) },
            modifier = Modifier.fillMaxWidth()
        ) { Text(stringResource(R.string.auth_sign_in_google)) }

        Text(
            stringResource(R.string.auth_stub_note),
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        message?.let {
            Text(it, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.error)
        }
        session?.let {
            Text(
                stringResource(R.string.auth_signed_in, it.email, it.provider),
                style = MaterialTheme.typography.bodyMedium
            )
        }
    }
}
