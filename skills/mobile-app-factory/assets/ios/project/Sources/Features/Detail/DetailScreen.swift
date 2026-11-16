import SwiftUI
import SwiftData

struct DetailScreen: View {
    let habit: Habit

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.s3) {
                Text(habit.title)
                    .font(Theme.title)
                    .foregroundStyle(Theme.ink)
                Text("\(habit.streak) day streak")
                    .font(Theme.headline)
                    .foregroundStyle(Theme.accent)
                Text("detail.body")
                    .font(Theme.body)
                    .foregroundStyle(Theme.inkMuted)
                Text("Updated \(habit.updatedAt.formatted(date: .abbreviated, time: .shortened))")
                    .font(Theme.detail)
                    .foregroundStyle(Theme.inkMuted)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(Theme.s4)
        }
        .background(Theme.background.ignoresSafeArea())
        .navigationTitle(Text("detail.title"))
        .navigationBarTitleDisplayMode(.inline)
    }
}

#Preview {
    NavigationStack {
        DetailScreen(habit: Habit(id: "1", title: "Morning walk", streak: 12))
    }
    .tint(Theme.accent)
}
