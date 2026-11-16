import SwiftUI

struct SettingsScreen: View {
    @Environment(AppEnvironment.self) private var environment

    @State private var showingAuth = false
    @State private var showingDeletion = false

    private var settings: SettingsStore { environment.settings }
    private var auth: AuthService { environment.auth }

    var body: some View {
        Form {
            Section {
                Toggle(isOn: Binding(
                    get: { settings.notificationsEnabled },
                    set: { settings.notificationsEnabled = $0 }
                )) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("settings.notifications")
                        Text("settings.notifications.detail")
                            .font(Theme.detail)
                            .foregroundStyle(Theme.inkMuted)
                    }
                }
                Toggle(isOn: Binding(
                    get: { settings.reduceMotionOverride },
                    set: { settings.reduceMotionOverride = $0 }
                )) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("settings.reduceMotion")
                        Text("settings.reduceMotion.detail")
                            .font(Theme.detail)
                            .foregroundStyle(Theme.inkMuted)
                    }
                }
            } header: {
                Text("settings.section.general")
            }

            Section {
                if let session = auth.session {
                    LabeledContent("settings.signedIn", value: session.email)
                    Button("settings.signOut", role: .destructive) {
                        auth.signOut()
                    }
                } else {
                    Button("settings.signIn") {
                        showingAuth = true
                    }
                }
            } header: {
                Text("settings.section.account")
            }

            Section {
                Button("settings.deleteAccount", role: .destructive) {
                    showingDeletion = true
                }
                Text("settings.deleteAccount.detail")
                    .font(Theme.detail)
                    .foregroundStyle(Theme.inkMuted)
            } header: {
                Text("settings.section.data")
            }
        }
        .navigationTitle(Text("settings.title"))
        .sheet(isPresented: $showingAuth) {
            NavigationStack {
                AuthScreen()
            }
        }
        .sheet(isPresented: $showingDeletion) {
            NavigationStack {
                AccountDeletionScreen()
            }
        }
    }
}

#Preview {
    NavigationStack {
        SettingsScreen()
    }
    .environment(AppEnvironment.mocked())
    .tint(Theme.accent)
}
