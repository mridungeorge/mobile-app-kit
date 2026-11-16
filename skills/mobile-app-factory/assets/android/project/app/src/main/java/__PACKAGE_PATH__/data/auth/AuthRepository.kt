package __PACKAGE__.data.auth

import __PACKAGE__.data.api.ApiClient
import javax.inject.Singleton
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class AuthSession(val email: String, val provider: String)

/**
 * Every sign-in path is a [AuthProvider]: the screen never talks to a vendor SDK directly.
 * The Apple and Google implementations are stubs on purpose — wiring them needs an entitlement,
 * a client ID and a real key, which a starter must not invent.
 */
interface AuthProvider {
    val id: String
    suspend fun signIn(email: String, password: String): Result<AuthSession>
}

class EmailAuthProvider : AuthProvider {
    override val id = "email"

    override suspend fun signIn(email: String, password: String): Result<AuthSession> {
        if (!email.contains("@")) return Result.failure(IllegalArgumentException("Enter a valid email"))
        if (password.length < 8) return Result.failure(IllegalArgumentException("Password is at least 8 characters"))
        // Stub: replace with your backend call. Never store the password locally.
        return Result.success(AuthSession(email.trim(), id))
    }
}

class AppleAuthProvider : AuthProvider {
    override val id = "apple"

    override suspend fun signIn(email: String, password: String): Result<AuthSession> =
        Result.failure(IllegalStateException("Sign in with Apple: add the capability, then implement ASAuthorizationController here"))
}

class GoogleAuthProvider : AuthProvider {
    override val id = "google"

    override suspend fun signIn(email: String, password: String): Result<AuthSession> =
        Result.failure(IllegalStateException("Google Sign-In: add the OAuth client ID, then implement Credential Manager here"))
}

interface AuthRepository {
    val session: StateFlow<AuthSession?>
    suspend fun signInWith(provider: String, email: String, password: String): Result<AuthSession>
    suspend fun deleteAccount(): Result<Unit>
    fun signOut()
}

@Singleton
class StubAuthRepository(
    private val api: ApiClient,
    // @JvmSuppressWildcards: without it Kotlin asks Dagger for List<? extends AuthProvider>,
    // which does not match the List<AuthProvider> the module provides.
    private val providers: List<@JvmSuppressWildcards AuthProvider>
) : AuthRepository {
    private val _session = MutableStateFlow<AuthSession?>(null)
    override val session: StateFlow<AuthSession?> = _session.asStateFlow()

    override suspend fun signInWith(provider: String, email: String, password: String): Result<AuthSession> {
        val implementation = providers.firstOrNull { it.id == provider }
            ?: return Result.failure(IllegalArgumentException("Unknown provider $provider"))
        return implementation.signIn(email, password).onSuccess { _session.value = it }
    }

    override suspend fun deleteAccount(): Result<Unit> {
        val deleted = api.deleteAccount()
        if (!deleted) return Result.failure(IllegalStateException("The server did not confirm deletion"))
        _session.value = null
        return Result.success(Unit)
    }

    override fun signOut() {
        _session.value = null
    }
}

