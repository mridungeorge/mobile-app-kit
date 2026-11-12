import SwiftUI

/// Rune motion tokens, in SwiftUI form.
///
/// Five springs, not arbitrary easing. `settle` is the default state change, `snap`
/// is for small controls, `glide` for sheets and page transitions, `reflow` for
/// layout moves, and `morph` / `pop` for the one flourish per screen. Nothing here
/// exceeds 400 ms, and every helper degrades to a 150 ms fade under Reduce Motion.
///
/// The same numbers live in the Android starter as `ui/theme/Motion.kt`.
enum Motion {
    static let snapDuration: Double = 0.25
    static let settleDuration: Double = 0.30
    static let reflowDuration: Double = 0.40
    static let glideDuration: Double = 0.32
    static let morphDuration: Double = 0.30
    static let popDuration: Double = 0.25
    static let reducedFadeDuration: Double = 0.15

    /// Stagger between siblings in an entry sequence. 24–40 ms reads as one motion.
    static let stagger: Double = 0.032

    // Springs, expressed as duration + bounce so both platforms settle together.
    static let snap = Animation.spring(duration: snapDuration, bounce: 0)
    static let settle = Animation.spring(duration: settleDuration, bounce: 0)
    static let reflow = Animation.spring(duration: reflowDuration, bounce: 0.05)
    static let glide = Animation.spring(duration: glideDuration, bounce: 0.05)
    static let morph = Animation.spring(duration: morphDuration, bounce: 0.16)
    static let pop = Animation.spring(duration: popDuration, bounce: 0.15)

    /// The only motion allowed when the user has turned animation off.
    static let reducedFade = Animation.easeOut(duration: reducedFadeDuration)

    enum Token {
        case snap, settle, reflow, glide, morph, pop
    }

    /// Resolve a token against the user's Reduce Motion setting.
    ///
    /// ```swift
    /// @Environment(\.accessibilityReduceMotion) private var reduceMotion
    /// withAnimation(Motion.resolve(.settle, reduceMotion: reduceMotion)) { ... }
    /// ```
    static func resolve(_ token: Token, reduceMotion: Bool) -> Animation {
        guard !reduceMotion else { return reducedFade }
        switch token {
        case .snap: return snap
        case .settle: return settle
        case .reflow: return reflow
        case .glide: return glide
        case .morph: return morph
        case .pop: return pop
        }
    }

    /// A staggered delay for the nth sibling, zero under Reduce Motion.
    static func delay(index: Int, reduceMotion: Bool) -> Double {
        reduceMotion ? 0 : Double(min(index, 6)) * stagger
    }
}

/// Press feedback for any button: scale on touch-down, plus a light haptic.
/// The haptic is skipped under Reduce Motion, matching the visual fallback.
struct RunePressStyle: ButtonStyle {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    var pressedScale: CGFloat = 0.97

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed && !reduceMotion ? pressedScale : 1)
            .animation(reduceMotion ? Motion.reducedFade : Motion.snap, value: configuration.isPressed)
            .sensoryFeedback(.impact(weight: .light), trigger: configuration.isPressed)
    }
}

/// Reveal-on-appear for a list row or card: 16 pt rise plus fade, once.
private struct RuneReveal: ViewModifier {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @State private var shown = false
    var index: Int

    func body(content: Content) -> some View {
        content
            .opacity(shown ? 1 : 0)
            .offset(y: shown || reduceMotion ? 0 : 16)
            .onAppear {
                let animation = Motion.resolve(.settle, reduceMotion: reduceMotion)
                    .delay(Motion.delay(index: index, reduceMotion: reduceMotion))
                withAnimation(animation) { shown = true }
            }
    }
}

extension View {
    /// Staggered reveal for the nth item in a list. Pair with `ForEach(...).enumerated()`.
    func runeReveal(index: Int = 0) -> some View {
        modifier(RuneReveal(index: index))
    }
}
