package __PACKAGE__.feature.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import __PACKAGE__.data.auth.AuthRepository
import __PACKAGE__.data.auth.AuthSession
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val auth: AuthRepository
) : ViewModel() {
    val session: StateFlow<AuthSession?> = auth.session
    private val _message = MutableStateFlow<String?>(null)
    val message: StateFlow<String?> = _message.asStateFlow()

    fun signIn(provider: String, email: String, password: String) {
        viewModelScope.launch {
            _message.value = null
            auth.signInWith(provider, email, password)
                .onFailure { _message.value = it.message ?: "Sign-in failed" }
        }
    }

    fun signOut() {
        auth.signOut()
        _message.value = null
    }

    fun deleteAccount(onDeleted: () -> Unit) {
        viewModelScope.launch {
            auth.deleteAccount()
                .onSuccess { onDeleted() }
                .onFailure { _message.value = it.message ?: "Deletion failed" }
        }
    }

    fun clearMessage() {
        _message.value = null
    }
}
