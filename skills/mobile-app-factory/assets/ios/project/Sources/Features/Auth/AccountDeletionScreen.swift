import SwiftUI

struct AccountDeletionScreen: View {
    @Environment(AppEnvironment.self) private var environment
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss

    @State private var confirming = false
    @State private var working = false
    @State private var errorMessage: String?

    var body: some View {
        Form {
            Section {
                Text("deletion.body")
                    .font(Theme.body)
            }

            Section {
                Text("deletion.web")
                    .font(Theme.detail)
                    .foregroundStyle(Theme.inkMuted)
            } footer: {
                Text("deletion.web.hint")
            }

            Section {
                Button(role: .destructive) {
                    confirming = true
                } label: {
                    if working {
                        ProgressView()
                    } else {
                        Text("deletion.action")
                    }
                }
                .disabled(working)
            }

            if let errorMessage {
                Section {
                    Text(errorMessage)
                        .foregroundStyle(.red)
                }
            }
        }
        .navigationTitle(Text("deletion.title"))
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("common.cancel") { dismiss() }
            }
        }
        .alert(Text("deletion.confirm.title"), isPresented: $confirming) {
            Button("common.cancel", role: .cancel) {}
            Button("deletion.confirm.action", role: .destructive) {
                Task { await delete() }
            }
        } message: {
            Text("deletion.confirm.body")
        }
    }

    private func delete() async {
        working = true
        defer { working = false }
        do {
            try await environment.auth.deleteAccount()
            // Local data goes too: a deleted account must not leave a readable cache behind.
            let repository = HabitRepository(context: context, api: environment.api)
            try repository.deleteAll()
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

#Preview {
    NavigationStack {
        AccountDeletionScreen()
    }
    .environment(AppEnvironment.mocked())
    .modelContainer(for: Habit.self, inMemory: true)
}
