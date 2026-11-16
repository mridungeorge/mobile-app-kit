import Foundation

protocol Analytics {
    func track(_ event: String, properties: [String: String])
    func recordError(_ error: Error)
}

struct NoopAnalytics: Analytics {
    func track(_ event: String, properties: [String: String]) {}
    func recordError(_ error: Error) {}
}

/// Blocks everything until the user has consented. Wrap your vendor adapter in this.
final class ConsentGate: Analytics {
    private let inner: Analytics
    private let defaults: UserDefaults
    init(inner: Analytics, defaults: UserDefaults = .standard) { self.inner = inner; self.defaults = defaults }
    var hasConsent: Bool {
        get { defaults.bool(forKey: "analytics.consent") }
        set { defaults.set(newValue, forKey: "analytics.consent") }
    }
    func track(_ event: String, properties: [String: String] = [:]) { if hasConsent { inner.track(event, properties: properties) } }
    func recordError(_ error: Error) { if hasConsent { inner.recordError(error) } }
}
