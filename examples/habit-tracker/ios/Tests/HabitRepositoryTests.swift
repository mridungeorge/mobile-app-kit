import XCTest
import SwiftData
@testable import HabitTracker

struct FailingAPIClient: APIClient {
    let error: Error

    func habits() async throws -> [HabitPayload] { throw error }
    func deleteAccount() async throws { throw error }
}

@MainActor
final class HabitRepositoryTests: XCTestCase {
    private func container() throws -> ModelContainer {
        let configuration = ModelConfiguration(isStoredInMemoryOnly: true)
        return try ModelContainer(for: Habit.self, configurations: configuration)
    }

    func testLoadFillsAnEmptyCacheFromTheAPI() async throws {
        // Hold the container: the context does not keep it alive, and a deallocated
        // container crashes SwiftData on the next insert.
        let model = try container()
        let repository = HabitRepository(context: model.mainContext, api: MockAPIClient())
        let habits = try await repository.load()
        XCTAssertEqual(habits.count, 3)
        // Order is a store collation detail; the fixture content is what matters here.
        XCTAssertEqual(Set(habits.map(\.title)), ["Morning walk", "No phone after 22:00", "Read 20 pages"])
    }

    func testLoadIsIdempotent() async throws {
        let model = try container()
        let repository = HabitRepository(context: model.mainContext, api: MockAPIClient())
        _ = try await repository.load()
        let second = try await repository.load()
        XCTAssertEqual(second.count, 3, "a second load must not duplicate rows")
    }

    func testLoadThrowsWhenTheCacheIsEmptyAndTheNetworkFails() async throws {
        let model = try container()
        let repository = HabitRepository(
            context: model.mainContext,
            api: FailingAPIClient(error: APIError.offline)
        )
        do {
            _ = try await repository.load()
            XCTFail("expected the offline error to surface")
        } catch APIError.offline {
            // expected
        }
    }

    func testCacheSurvivesANetworkFailure() async throws {
        let model = try container()
        let populated = HabitRepository(context: model.mainContext, api: MockAPIClient())
        _ = try await populated.load()

        let offline = HabitRepository(context: model.mainContext, api: FailingAPIClient(error: APIError.offline))
        let habits = try await offline.load()
        XCTAssertEqual(habits.count, 3, "saved habits must render when the network is gone")
    }

    func testDeleteAllEmptiesTheCache() async throws {
        let model = try container()
        let repository = HabitRepository(context: model.mainContext, api: MockAPIClient())
        _ = try await repository.load()
        try repository.deleteAll()
        XCTAssertTrue(try repository.habits().isEmpty)
    }
}
