import UIKit
import UserNotifications

protocol PushTokenSink { func registerToken(_ token: String) async }

/// Call `requestAuthorization()` only from the priming screen's primary button.
@MainActor final class PushRegistrar {
    private let sink: PushTokenSink
    init(sink: PushTokenSink) { self.sink = sink }

    func requestAuthorization() async -> Bool {
        let granted = (try? await UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound])) ?? false
        if granted { UIApplication.shared.registerForRemoteNotifications() }
        return granted
    }

    /// Forward from `application(_:didRegisterForRemoteNotificationsWithDeviceToken:)`.
    func didRegister(deviceToken: Data) async { await sink.registerToken(deviceToken.map { String(format: "%02x", $0) }.joined()) }
}
