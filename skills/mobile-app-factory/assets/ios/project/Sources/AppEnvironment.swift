import SwiftUI
import Observation

/// The dependency container. One place to swap mock for live, and a preview can build a
/// whole screen with injected fakes instead of reaching for singletons.
@Observable
@MainActor
final class AppEnvironment {
    let api: APIClient
    let auth: AuthService
    let settings: SettingsStore

    var baseURL: URL

    init(api: APIClient, settings: SettingsStore = SettingsStore(), baseURL: URL = AppEnvironment.defaultBaseURL) {
        self.api = api
        self.baseURL = baseURL
        self.settings = settings
        self.auth = AuthService(api: api)
    }

    static let defaultBaseURL = URL(string: "https://api.example.com/v1")!

    /// Previews and tests: no network, no persisted settings.
    static func mocked() -> AppEnvironment {
        let defaults = UserDefaults(suiteName: "preview") ?? .standard
        return AppEnvironment(api: MockAPIClient(), settings: SettingsStore(defaults: defaults))
    }
}
