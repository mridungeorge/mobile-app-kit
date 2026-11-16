import SwiftUI
import SwiftData

struct HomeScreen: View {
    @Environment(AppEnvironment.self) private var environment
    @Environment(\.modelContext) private var context
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    @State private var viewModel: HomeViewModel?

    var body: some View {
        StateView(
            state: viewModel?.state ?? .loading,
            retry: { Task { await load(animated: false) } }
        ) { habits in
            list(habits)
        }
        .background(Theme.background.ignoresSafeArea())
        .navigationTitle(Text("home.title"))
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    Task { await load(animated: true) }
                } label: {
                    Image(systemName: "arrow.clockwise")
                }
                .accessibilityLabel(Text("home.refresh"))
            }
        }
        .task { await load(animated: false) }
    }

    private func list(_ habits: [Habit]) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.s3) {
                Text("home.subtitle")
                    .font(Theme.label)
                    .foregroundStyle(Theme.inkMuted)
                    .padding(.horizontal, Theme.s1)

                ForEach(habits) { habit in
                    NavigationLink {
                        DetailScreen(habit: habit)
                    } label: {
                        row(habit)
                    }
                    .buttonStyle(.plain)
                    .accessibilityElement(children: .combine)
                    .accessibilityLabel(Text("\(habit.title), \(habit.streak) day streak"))
                    .accessibilityAddTraits(.isButton)
                }
            }
            .padding(.horizontal, Theme.s4)
            .padding(.vertical, Theme.s3)
        }
        .animation(reduceMotion ? nil : .default, value: habits.count)
    }

    private func row(_ habit: Habit) -> some View {
        HStack(spacing: Theme.s3) {
            VStack(alignment: .leading, spacing: 2) {
                Text(habit.title)
                    .font(Theme.headline)
                    .foregroundStyle(Theme.ink)
                Text("\(habit.streak) days")
                    .font(Theme.detail)
                    .foregroundStyle(Theme.inkMuted)
            }
            Spacer(minLength: 0)
            Image(systemName: "chevron.right")
                .font(.footnote.weight(.semibold))
                .foregroundStyle(Theme.inkMuted)
                .accessibilityHidden(true)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.card)
        .clipShape(RoundedRectangle(cornerRadius: Theme.rMedium, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: Theme.rMedium, style: .continuous)
                .stroke(Theme.line, lineWidth: 1)
        )
    }

    private func load(animated: Bool) async {
        let model = viewModel ?? HomeViewModel(
            repository: HabitRepository(context: context, api: environment.api)
        )
        viewModel = model
        if animated {
            withAnimation(reduceMotion ? nil : .default) {
                Task { await model.load() }
            }
        } else {
            await model.load()
        }
    }
}

#Preview {
    NavigationStack {
        HomeScreen()
    }
    .environment(AppEnvironment.mocked())
    .modelContainer(for: Habit.self, inMemory: true)
    .tint(Theme.accent)
}
