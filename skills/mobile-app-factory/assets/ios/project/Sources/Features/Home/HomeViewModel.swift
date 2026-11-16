import SwiftUI
import Observation

@Observable
@MainActor
final class HomeViewModel {
    private(set) var state: UiState<[Habit]> = .loading

    private let repository: HabitRepository

    init(repository: HabitRepository) {
        self.repository = repository
    }

    func load() async {
        state = .loading
        do {
            let habits = try await repository.load()
            state = habits.isEmpty ? .empty : .content(habits)
        } catch is CancellationError {
            return
        } catch APIError.offline {
            state = .offline
        } catch {
            state = .error(error.localizedDescription)
        }
    }
}
