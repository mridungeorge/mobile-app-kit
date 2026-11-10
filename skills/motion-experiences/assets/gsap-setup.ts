/**
 * GSAP setup for React (Vite / Next client components / Capacitor).
 * Import from here instead of registering plugins in every file.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP, ScrollTrigger, Flip);

/** Touch devices: no hover, no cursor effects. */
export const isTouch = () =>
  typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches;

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Run motion setup only when the user allows motion.
 * Returns a cleanup that reverts everything created inside.
 */
export function withMotion(setup: () => void | (() => void)) {
  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const cleanup = setup();
    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
  });
  return () => mm.revert();
}

/** Rune timing tokens as GSAP-friendly values. */
export const motion = {
  instant: 0.1,
  snap: 0.25,
  settle: 0.3,
  reflow: 0.4,
  glide: 0.32,
  morph: 0.3,
  pop: 0.25,
  drift: 0.85,
  easeIn: 'power2.out',
  easeOut: 'power1.in',
  overshoot: 'back.out(1.4)',
} as const;

/** Standard reveal: 12–16px travel + fade, once. */
export function reveal(targets: gsap.TweenTarget, vars: gsap.TweenVars = {}) {
  return gsap.fromTo(
    targets,
    { y: 16, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: motion.settle,
      ease: motion.easeIn,
      stagger: 0.032,
      overwrite: 'auto',
      ...vars,
    },
  );
}

export { gsap, ScrollTrigger, Flip, useGSAP };
