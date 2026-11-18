import Foundation
import Observation

struct AuthSession: Equatable, Sendable {
    let email: String
    let provider: Provider

    enum Provider: String, Sendable {
        case email, apple, google
    }
}

enum AuthError: LocalizedError {
    case invalidEmail
    case weakPassword
    case needsCapability(String)

    var errorDescription: String? {
        switch self {
        case .invalidEmail: "Enter a valid email address."
        case .weakPassword: "Your password needs at least 8 characters."
        case .needsCapability(let detail): detail
        }
    }
}

/// Every sign-in path goes through this. The screen never imports a vendor SDK,
/// so swapping the stub for the real thing is one file, not a screen rewrite.
protocol AuthProvider: Sendable {
    var id: AuthSession.Provider { get }
    func signIn(email: String, password: String) async throws -> AuthSession
}

struct EmailAuthProvider: AuthProvider {
    let id = AuthSession.Provider.email

    func signIn(email: String, password: String) async throws -> AuthSession {
        let trimmed = email.trimmingCharacters(in: .whitespacesAndNewlines)
        guard trimmed.contains("@"), trimmed.contains(".") else { throw AuthError.invalidEmail }
        guard password.count >= 8 else { throw AuthError.weakPassword }
        // Stub: call your backend here. Never store the password on the device.
        return AuthSession(email: trimmed, provider: id)
    }
}

/// Sign in with Apple is a capability plus a real Apple ID flow. The starter refuses
/// rather than pretending, so a shipping app can never inherit a fake success.
struct AppleAuthProvider: AuthProvider {
    let id = AuthSession.Provider.apple

    func signIn(email: String, password: String) async throws -> AuthSession {
        throw AuthError.needsCapability(
            "Sign in with Apple: add the capability in Xcode, then implement ASAuthorizationController here."
        )
    }
}

struct GoogleAuthProvider: AuthProvider {
    let id = AuthSession.Provider.google

    func signIn(email: String, password: String) async throws -> AuthSession {
        throw AuthError.needsCapability(
            "Google Sign-In: add the OAuth client ID, then implement the Google Sign-In SDK here."
        )
    }
}

@Observable
@MainActor
final class AuthService {
    private(set) var session: AuthSession?
    private(set) var lastError: String?

    private let api: APIClient
    private let providers: [AuthProvider]

    init(api: APIClient, providers: [AuthProvider] = [EmailAuthProvider(), AppleAuthProvider(), GoogleAuthProvider()]) {
        self.api = api
        self.providers = providers
    }

    func signIn(provider: AuthSession.Provider, email: String, password: String) async {
        lastError = nil
        guard let implementation = providers.first(where: { $0.id == provider }) else {
            lastError = "Unknown sign-in method."
            return
        }
        do {
            session = try await implementation.signIn(email: email, password: password)
        } catch {
            lastError = error.localizedDescription
        }
    }

    func signOut() {
        session = nil
        lastError = nil
    }

    /// Apple 5.1.1(v) / Play policy: deletion must actually delete, and the server must confirm.
    func deleteAccount() async throws {
        try await api.deleteAccount()
        session = nil
    }

    func clearError() {
        lastError = nil
    }
}
