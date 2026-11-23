import SwiftUI
import SwiftData

@main
struct HabitTrackerApp: App {
    // Swap MockAPIClient for LiveAPIClient(baseURL:) when the backend exists. No key, no
    // account and no network are needed to run the starter.
    @State private var environment = AppEnvironment(api: MockAPIClient())

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(environment)
        }
        .modelContainer(Persistence.container())
    }
}
