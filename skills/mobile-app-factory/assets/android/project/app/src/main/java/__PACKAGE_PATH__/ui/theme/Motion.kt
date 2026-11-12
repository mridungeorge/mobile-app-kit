package __PACKAGE__.ui.theme

import android.provider.Settings
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.AnimatedVisibilityScope
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.IntOffset

/**
 * Rune motion tokens, in Compose form.
 *
 * Five springs, not arbitrary easing. Use [settle] for the default state change,
 * [snap] for small controls, [glide] for sheets and page transitions, [reflow] for
 * layout moves, [morph] and [pop] for the one flourish per screen. Nothing here
 * exceeds 400 ms, and every helper degrades to a 150 ms fade under Reduce Motion.
 *
 * The same numbers live in the iOS starter as `DesignSystem/Motion.swift`.
 */
object Motion {
    const val SNAP_MS = 250
    const val SETTLE_MS = 300
    const val REFLOW_MS = 400
    const val GLIDE_MS = 320
    const val MORPH_MS = 300
    const val POP_MS = 250
    const val REDUCED_FADE_MS = 150

    /** Stagger between siblings in an entry sequence. 24–40 ms reads as one motion. */
    const val STAGGER_MS = 32

    private const val NO_BOUNCE = 0.9f

    /** Small controls, indicators, width changes. */
    fun <T> snap() = spring<T>(dampingRatio = NO_BOUNCE, stiffness = Spring.StiffnessMedium)

    /** The default state change. */
    fun <T> settle() = spring<T>(dampingRatio = NO_BOUNCE, stiffness = Spring.StiffnessMediumLow)

    /** Layout moves: reorder, expand, constraint changes. */
    fun <T> reflow() = spring<T>(dampingRatio = 0.85f, stiffness = Spring.StiffnessLow)

    /** Sheets and page transitions. */
    fun <T> glide() = spring<T>(dampingRatio = 0.85f, stiffness = Spring.StiffnessMediumLow)

    /** Morphing a shared element. One per screen. */
    fun <T> morph() = spring<T>(dampingRatio = 0.72f, stiffness = Spring.StiffnessMediumLow)

    /** Confirmations and pops. Never on a destructive action. */
    fun <T> pop() = spring<T>(dampingRatio = 0.70f, stiffness = Spring.StiffnessMedium)

    /** The only motion allowed when the user has turned animation off. */
    fun <T> reducedFade() = tween<T>(durationMillis = REDUCED_FADE_MS)
}

/**
 * True when the OS animation scale is zero (Developer options, accessibility
 * settings, or a battery saver). Read once per composition: re-reading on every
 * frame would be wasteful, and the setting rarely changes mid-screen.
 */
@Composable
fun rememberReducedMotion(): Boolean {
    val context = LocalContext.current
    return remember(context) {
        runCatching {
            Settings.Global.getFloat(
                context.contentResolver,
                Settings.Global.ANIMATOR_DURATION_SCALE,
                1f
            ) == 0f
        }.getOrDefault(false)
    }
}

/**
 * Entry animation for a block of content: a short rise plus a fade, or a plain
 * fade under Reduce Motion. Use one per screen region, not per row.
 */
@Composable
fun MotionEnter(
    visible: Boolean,
    modifier: Modifier = Modifier,
    reduced: Boolean = rememberReducedMotion(),
    content: @Composable AnimatedVisibilityScope.() -> Unit
) {
    AnimatedVisibility(
        visible = visible,
        modifier = modifier,
        enter = if (reduced) {
            fadeIn(Motion.reducedFade<Float>())
        } else {
            fadeIn(Motion.settle<Float>()) +
                slideInVertically(Motion.settle<IntOffset>()) { height -> height / 6 }
        },
        exit = if (reduced) {
            fadeOut(Motion.reducedFade<Float>())
        } else {
            fadeOut(Motion.snap<Float>()) +
                slideOutVertically(Motion.snap<IntOffset>()) { height -> height / 8 }
        },
        content = content
    )
}

/**
 * Press feedback: the target scales down on touch-down, not on release.
 * Attach to the same [MutableInteractionSource] the clickable uses.
 */
@Composable
fun Modifier.pressFeedback(
    interactionSource: MutableInteractionSource,
    reduced: Boolean = rememberReducedMotion(),
    pressedScale: Float = 0.97f
): Modifier {
    val pressed by interactionSource.collectIsPressedAsState()
    val scale by animateFloatAsState(
        targetValue = if (pressed && !reduced) pressedScale else 1f,
        animationSpec = if (reduced) Motion.reducedFade() else Motion.snap(),
        label = "pressFeedback"
    )
    return this.graphicsLayer {
        scaleX = scale
        scaleY = scale
    }
}

/** Per-item delay for a staggered entry. Zero when Reduce Motion is on. */
fun staggerDelay(index: Int, reduced: Boolean): Int =
    if (reduced) 0 else index.coerceAtMost(6) * Motion.STAGGER_MS
