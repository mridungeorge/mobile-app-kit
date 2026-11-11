package __PACKAGE__.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val LightColors = lightColorScheme(
    primary = Accent,
    onPrimary = LightCard,
    primaryContainer = AccentSoft,
    onPrimaryContainer = Ink,
    background = LightBg,
    onBackground = Ink,
    surface = LightCard,
    onSurface = Ink,
    surfaceVariant = LightBg,
    onSurfaceVariant = InkMuted,
    outline = LightLine,
    outlineVariant = LightLine
)

private val DarkColors = darkColorScheme(
    primary = Accent,
    onPrimary = DarkInk,
    primaryContainer = DarkCard,
    onPrimaryContainer = DarkInk,
    background = DarkBg,
    onBackground = DarkInk,
    surface = DarkCard,
    onSurface = DarkInk,
    surfaceVariant = DarkCard,
    onSurfaceVariant = DarkInkMuted,
    outline = DarkLine,
    outlineVariant = DarkLine
)

@Composable
fun AppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        typography = AppTypography,
        content = content
    )
}
