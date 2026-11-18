import Foundation
import Observation

/// Settings that outlive the process. UserDefaults is deliberate: none of this is a secret.
@Observable
final class SettingsStore {
    var notificationsEnabled: Bool {
        didSet { defaults.set(notificationsEnabled, forKey: Keys.notifications) }
    }

    var reduceMotionOverride: Bool {
        didSet { defaults.set(reduceMotionOverride, forKey: Keys.reduceMotion) }
    }

    private let defaults: UserDefaults

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        self.notificationsEnabled = defaults.object(forKey: Keys.notifications) as? Bool ?? true
        self.reduceMotionOverride = defaults.object(forKey: Keys.reduceMotion) as? Bool ?? false
    }

    private enum Keys {
        static let notifications = "settings.notifications"
        static let reduceMotion = "settings.reduceMotion"
    }
}
