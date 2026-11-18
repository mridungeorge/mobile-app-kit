import SwiftUI

struct ContentView: View {
    var body: some View {
        AppShell()
            .tint(Theme.accent)
    }
}

#Preview {
    ContentView()
        .environment(AppEnvironment.mocked())
        .modelContainer(for: Habit.self, inMemory: true)
}
