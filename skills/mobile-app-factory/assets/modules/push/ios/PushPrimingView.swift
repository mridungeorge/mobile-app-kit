import SwiftUI

struct PushPrimingView: View {
    let benefit: String
    let onEnable: () -> Void
    let onSkip: () -> Void
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "bell.badge").font(.largeTitle).accessibilityHidden(true)
            Text("Stay in the loop").font(.title2.bold())
            Text(benefit).multilineTextAlignment(.center)
            Button("Turn on notifications", action: onEnable).buttonStyle(.borderedProminent)
            Button("Not now", action: onSkip)
        }.padding()
    }
}
