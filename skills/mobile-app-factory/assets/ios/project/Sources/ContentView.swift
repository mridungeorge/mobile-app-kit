import SwiftUI

struct ContentView: View {
    var body: some View {
        NavigationStack {
            HomeScreen()
        }
        .tint(Theme.accent)
    }
}

#Preview {
    ContentView()
}
