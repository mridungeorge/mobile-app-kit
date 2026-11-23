import SwiftUI

/// Renders the shared `UiState`. Every screen gets loading, empty, offline and error
/// for free, so a new screen cannot quietly ship without them.
struct StateView<Value, Content: View>: View {
    let state: UiState<Value>
    let retry: () -> Void
    let content: (Value) -> Content

    init(
        state: UiState<Value>,
        retry: @escaping () -> Void,
        @ViewBuilder content: @escaping (Value) -> Content
    ) {
        self.state = state
        self.retry = retry
        self.content = content
    }

    var body: some View {
        switch state {
        case .loading:
            ProgressView()
                .accessibilityLabel(Text("state.loading"))
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        case .empty:
            StateMessage(
                title: Text("state.empty.title"),
                detail: Text("state.empty.body")
            )
        case .offline:
            StateMessage(
                title: Text("state.offline.title"),
                detail: Text("state.offline.body"),
                retry: retry
            )
        case .error(let message):
            StateMessage(
                title: Text("state.error.title"),
                detail: Text(message),
                retry: retry
            )
        case .content(let value):
            content(value)
        }
    }
}

private struct StateMessage: View {
    let title: Text
    let detail: Text
    var retry: (() -> Void)?

    var body: some View {
        VStack(spacing: Theme.s3) {
            title
                .font(Theme.title)
                .foregroundStyle(Theme.ink)
                .multilineTextAlignment(.center)
            detail
                .font(Theme.body)
                .foregroundStyle(Theme.inkMuted)
                .multilineTextAlignment(.center)
            if let retry {
                Button(action: retry) {
                    Text("common.retry")
                }
                .buttonStyle(.borderedProminent)
                .accessibilityHint(Text("common.retry.hint"))
            }
        }
        .padding(Theme.s6)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
