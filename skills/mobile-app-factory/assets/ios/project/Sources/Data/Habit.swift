import Foundation
import SwiftData

/// The local source of truth. Cloud data is a cache fill, never the render source —
/// a rebuild that renders straight from the network shows an empty screen on a train.
@Model
final class Habit {
    @Attribute(.unique) var id: String
    var title: String
    var streak: Int
    var updatedAt: Date

    init(id: String, title: String, streak: Int, updatedAt: Date = .now) {
        self.id = id
        self.title = title
        self.streak = streak
        self.updatedAt = updatedAt
    }
}

@MainActor
struct HabitRepository {
    let context: ModelContext
    let api: APIClient

    func habits() throws -> [Habit] {
        let descriptor = FetchDescriptor<Habit>(sortBy: [SortDescriptor(\.title)])
        return try context.fetch(descriptor)
    }

    /// Fills an empty cache from the API, then returns what is on disk.
    /// Throws only when the cache is empty *and* the network failed.
    func load() async throws -> [Habit] {
        if try habits().isEmpty {
            let remote = try await api.habits()
            for payload in remote {
                context.insert(Habit(id: payload.id, title: payload.title, streak: payload.streak))
            }
            try context.save()
        }
        return try habits()
    }

    func deleteAll() throws {
        for habit in try habits() {
            context.delete(habit)
        }
        try context.save()
    }
}
