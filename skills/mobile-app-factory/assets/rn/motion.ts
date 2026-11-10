/**
 * Rune motion tokens for React Native (Reanimated 3+).
 *
 * Rune defines springs as duration + bounce. Reanimated's `withSpring` accepts
 * `duration` + `dampingRatio`, which maps cleanly: dampingRatio = 1 - bounce.
 * Keeping the names identical to Rune means design docs and code speak the same language.
 */
import {
  Easing,
  withSpring,
  withTiming,
  WithSpringConfig,
  WithTimingConfig,
} from 'react-native-reanimated';

export const springTokens = {
  /** Pointer-tied: colour changes, drag feedback. */
  instant: { duration: 100, dampingRatio: 1 },
  /** Small controls: indicators, widths that lead. */
  snap: { duration: 250, dampingRatio: 1 },
  /** Default state change. Arrives and stops. */
  settle: { duration: 300, dampingRatio: 1 },
  /** Layout moving out of the way. */
  reflow: { duration: 400, dampingRatio: 1 },
  /** Big surfaces travelling: sheets, drawers, pages. */
  glide: { duration: 320, dampingRatio: 1 },
  /** One shape becoming another. */
  morph: { duration: 300, dampingRatio: 0.84 },
  /** A release with a little life. Presses and confirmations only. */
  pop: { duration: 250, dampingRatio: 0.85 },
  /** Slow reveals the eye follows. Never utility UI. */
  drift: { duration: 850, dampingRatio: 1 },
} satisfies Record<string, WithSpringConfig>;

export type SpringToken = keyof typeof springTokens;

/** Exit variants are shorter; motion should leave faster than it arrives. */
export const exitTokens: Record<SpringToken, WithSpringConfig> = {
  instant: { duration: 100, dampingRatio: 1 },
  snap: { duration: 200, dampingRatio: 1 },
  settle: { duration: 240, dampingRatio: 1 },
  reflow: { duration: 320, dampingRatio: 1 },
  glide: { duration: 260, dampingRatio: 1 },
  morph: { duration: 270, dampingRatio: 0.92 },
  pop: { duration: 200, dampingRatio: 0.95 },
  drift: { duration: 600, dampingRatio: 1 },
};

export const timing = {
  fast: { duration: 150, easing: Easing.bezier(0.2, 0.8, 0.2, 1) } satisfies WithTimingConfig,
  exit: { duration: 110, easing: Easing.bezier(0.4, 0, 1, 1) } satisfies WithTimingConfig,
  fade: { duration: 150, easing: Easing.out(Easing.quad) } satisfies WithTimingConfig,
};

/** Default helpers. `reduce` is the OS reduce-motion value. */
export const springTo = (
  value: number,
  token: SpringToken = 'settle',
  reduce = false,
) => (reduce ? withTiming(value, timing.fade) : withSpring(value, springTokens[token]));

export const springOut = (
  value: number,
  token: SpringToken = 'settle',
  reduce = false,
) => (reduce ? withTiming(value, timing.exit) : withSpring(value, exitTokens[token]));

/** Stagger helper: 24–40ms per item, capped at 6 so lists don't feel slow. */
export const staggerDelay = (index: number, step = 32, max = 6) =>
  Math.min(index, max) * step;

/** Enter recipe used by <Reveal/>: 12px travel + fade. */
export const revealFrom = { translateY: 12, opacity: 0 };
export const revealTo = { translateY: 0, opacity: 1 };
