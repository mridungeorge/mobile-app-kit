import Foundation
import SwiftData

/// The on-disk store, created explicitly.
///
/// SwiftData's default container assumes `Application Support` already exists. On a fresh
/// simulator — and on a restored device backup — it may not, and the store then fails with
/// "Failed to stat path ... errno 2" and takes the app down with it. Creating the directory
/// first fixes that; falling back to memory means a broken store still renders a usable app
/// instead of a white screen.
enum Persistence {
    static func container() -> ModelContainer {
        let directory = URL.applicationSupportDirectory
        try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        let configuration = ModelConfiguration(url: directory.appending(path: "Habit.store"))
        if let container = try? ModelContainer(for: Habit.self, configurations: configuration) {
            return container
        }
        // Safe to force: an in-memory container has no file system to fail on.
        return try! ModelContainer(for: Habit.self, configurations: ModelConfiguration(isStoredInMemoryOnly: true))
    }
}
