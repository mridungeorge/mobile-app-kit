import SwiftUI
import UIKit

/// Rune-derived design tokens. Change `accent` for the app's single accent colour;
/// leave the neutral surfaces alone unless the brand requires it.
enum Theme {
    // Colour
    static let accent = Color(hex: 0x3F6FE0)
    static let accentSoft = Color(hex: 0xDCE7FF)

    static let background = Color(light: Color(hex: 0xF0F1F4), dark: Color(hex: 0x121314))
    static let card = Color(light: Color(hex: 0xFFFFFF), dark: Color(hex: 0x1C1D20))
    static let line = Color(light: Color(hex: 0xE2E5EC), dark: Color(hex: 0x2A2C31))
    static let ink = Color(light: Color(hex: 0x15171B), dark: Color(hex: 0xF2F4F8))
    static let inkMuted = Color(light: Color(hex: 0x5D6470), dark: Color(hex: 0xA5ACB8))

    // Space
    static let s1: CGFloat = 4
    static let s2: CGFloat = 8
    static let s3: CGFloat = 12
    static let s4: CGFloat = 16
    static let s6: CGFloat = 24

    // Radii
    static let rSmall: CGFloat = 6
    static let rMedium: CGFloat = 10
    static let rLarge: CGFloat = 16

    // Type
    static let title = Font.system(size: 22, weight: .semibold)
    static let headline = Font.system(size: 17, weight: .semibold)
    static let body = Font.system(size: 14, weight: .regular)
    static let detail = Font.system(size: 13, weight: .regular)
    static let label = Font.system(size: 12, weight: .medium)
}

extension Color {
    init(hex: UInt32, opacity: Double = 1) {
        let red = Double((hex >> 16) & 0xFF) / 255
        let green = Double((hex >> 8) & 0xFF) / 255
        let blue = Double(hex & 0xFF) / 255
        self.init(.sRGB, red: red, green: green, blue: blue, opacity: opacity)
    }

    /// Resolves light/dark at render time so the app follows the system setting.
    init(light: Color, dark: Color) {
        self.init(uiColor: UIColor { traits in
            traits.userInterfaceStyle == .dark ? UIColor(dark) : UIColor(light)
        })
    }
}
