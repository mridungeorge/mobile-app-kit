import SwiftUI

private struct RowItem: Identifiable {
    let id = UUID()
    let title: String
    let detail: String
}

struct HomeScreen: View {
    private let rows: [RowItem] = [
        RowItem(title: "First item", detail: "Replace with real content from your data layer"),
        RowItem(title: "Second item", detail: "Empty, loading and error states belong here"),
        RowItem(title: "Third item", detail: "Tap should open a detail screen"),
        RowItem(title: "Fourth item", detail: "Keep rows scannable: title + one supporting line"),
        RowItem(title: "Fifth item", detail: "No placeholder copy ships to the store")
    ]

    @State private var showingAdd = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.s3) {
                heroCard
                ForEach(rows) { row in
                    listRow(row)
                }
            }
            .padding(.horizontal, Theme.s4)
            .padding(.vertical, Theme.s3)
        }
        .background(Theme.background.ignoresSafeArea())
        .navigationTitle("__APP_NAME__")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    showingAdd = true
                } label: {
                    Image(systemName: "plus")
                }
                .accessibilityLabel("Add")
            }
        }
        .sheet(isPresented: $showingAdd) {
            AddSheet()
                .presentationDetents([.medium])
        }
    }

    private var heroCard: some View {
        VStack(alignment: .leading, spacing: Theme.s2) {
            Text("Today")
                .font(Theme.label)
                .foregroundStyle(Theme.inkMuted)
            Text("Your core loop starts here")
                .font(Theme.title)
                .foregroundStyle(Theme.ink)
            Text("One clear next action. Everything else supports it.")
                .font(Theme.detail)
                .foregroundStyle(Theme.inkMuted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(Theme.s4)
        .background(Theme.accentSoft.opacity(0.6))
        .clipShape(RoundedRectangle(cornerRadius: Theme.rLarge, style: .continuous))
    }

    private func listRow(_ row: RowItem) -> some View {
        HStack(spacing: Theme.s3) {
            RoundedRectangle(cornerRadius: Theme.rMedium, style: .continuous)
                .fill(Theme.background)
                .frame(width: 38, height: 38)
            VStack(alignment: .leading, spacing: 2) {
                Text(row.title)
                    .font(Theme.headline)
                    .foregroundStyle(Theme.ink)
                Text(row.detail)
                    .font(Theme.detail)
                    .foregroundStyle(Theme.inkMuted)
            }
            Spacer(minLength: 0)
        }
        .padding(14)
        .background(Theme.card)
        .clipShape(RoundedRectangle(cornerRadius: Theme.rMedium, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: Theme.rMedium, style: .continuous)
                .stroke(Theme.line, lineWidth: 1)
        )
    }
}

private struct AddSheet: View {
    @Environment(\.dismiss) private var dismiss
    @State private var title = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("New item") {
                    TextField("Title", text: $title)
                }
            }
            .navigationTitle("Add")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { dismiss() }
                        .disabled(title.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
    }
}

#Preview {
    NavigationStack {
        HomeScreen()
    }
    .tint(Theme.accent)
}
