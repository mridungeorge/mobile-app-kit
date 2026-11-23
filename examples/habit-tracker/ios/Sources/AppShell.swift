import SwiftUI

enum AppTab: String, CaseIterable, Identifiable {
    case home
    case settings

    var id: String { rawValue }

    var title: LocalizedStringKey {
        switch self {
        case .home: "tab.home"
        case .settings: "tab.settings"
        }
    }

    var systemImage: String {
        switch self {
        case .home: "house"
        case .settings: "gearshape"
        }
    }
}

/// Shell: a tab bar in compact width, a split view in regular width (iPad, large
/// iPhone in landscape). Same screens, no duplicated layout code.
struct AppShell: View {
    @Environment(\.horizontalSizeClass) private var sizeClass
    @State private var selection: AppTab = .home

    var body: some View {
        if sizeClass == .regular {
            NavigationSplitView {
                List {
                    ForEach(AppTab.allCases) { tab in
                        Button {
                            selection = tab
                        } label: {
                            Label(tab.title, systemImage: tab.systemImage)
                        }
                        .listRowBackground(
                            selection == tab ? Theme.accentSoft.opacity(0.6) : Color.clear
                        )
                    }
                }
                .navigationTitle(Text("app.title"))
            } detail: {
                destination(for: selection)
            }
        } else {
            TabView(selection: $selection) {
                ForEach(AppTab.allCases) { tab in
                    destination(for: tab)
                        .tabItem { Label(tab.title, systemImage: tab.systemImage) }
                        .tag(tab)
                }
            }
        }
    }

    @ViewBuilder
    private func destination(for tab: AppTab) -> some View {
        switch tab {
        case .home:
            NavigationStack {
                HomeScreen()
            }
        case .settings:
            NavigationStack {
                SettingsScreen()
            }
        }
    }
}
