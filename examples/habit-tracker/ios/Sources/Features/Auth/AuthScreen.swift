import SwiftUI

struct AuthScreen: View {
    @Environment(AppEnvironment.self) private var environment
    @Environment(\.dismiss) private var dismiss

    @State private var email = ""
    @State private var password = ""
    @State private var working = false

    private var auth: AuthService { environment.auth }

    var body: some View {
        Form {
            Section {
                TextField("auth.email", text: $email)
                    .textContentType(.emailAddress)
                    .keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .accessibilityLabel(Text("auth.email"))

                SecureField("auth.password", text: $password)
                    .textContentType(.password)
                    .accessibilityLabel(Text("auth.password"))
            } footer: {
                Text("auth.password.hint")
            }

            Section {
                Button {
                    Task { await signIn(.email) }
                } label: {
                    if working {
                        ProgressView()
                    } else {
                        Text("auth.signIn.email")
                    }
                }
                .disabled(working || email.isEmpty || password.isEmpty)

                Button("auth.signIn.apple") { Task { await signIn(.apple) } }
                    .disabled(working)

                Button("auth.signIn.google") { Task { await signIn(.google) } }
                    .disabled(working)
            }

            if let error = auth.lastError {
                Section {
                    Text(error)
                        .font(Theme.body)
                        .foregroundStyle(.red)
                        .accessibilityLabel(Text(error))
                }
            }
        }
        .navigationTitle(Text("auth.title"))
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("common.cancel") { dismiss() }
            }
        }
        .onChange(of: auth.session) { _, session in
            if session != nil { dismiss() }
        }
    }

    private func signIn(_ provider: AuthSession.Provider) async {
        working = true
        defer { working = false }
        await auth.signIn(provider: provider, email: email, password: password)
    }
}

#Preview {
    NavigationStack {
        AuthScreen()
    }
    .environment(AppEnvironment.mocked())
}
