# GSAP Recipes

Copy-paste patterns for React (Vite/Next) and Capacitor builds. All timing values come from the Rune motion table; all recipes include a reduced-motion path.

## Contents
1. Setup
2. Entrance timeline
3. Scroll reveal (batch, once)
4. Pinned section with scrub
5. Parallax with clamp
6. Split-text headline
7. Scroll progress
8. Page transitions
9. Magnetic button (pointer only)
10. Count up
11. Accordion with Flip
12. Cleanup and performance

---

## 1. Setup

```tsx
// app/motion/gsap.ts
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Flip } from 'gsap/Flip';
import { useGSAP } from '@gsap/react';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(useGSAP, ScrollTrigger, Flip, SplitText);

// One place, not per component. Vite/Next: this module is client-only.
export { gsap, ScrollTrigger, Flip, SplitText, useGSAP };
```

Reduced motion is a branch, not a flag:

```ts
const mm = gsap.matchMedia();
mm.add('(prefers-reduced-motion: no-preference)', () => {
  /* animation setup; ScrollTriggers created in here are reverted automatically */
});
mm.add('(prefers-reduced-motion: reduce)', () => {
  gsap.set('[data-anim]', { clearProps: 'all' }); // ensure nothing is left hidden
});
```

Anything hidden by GSAP (`opacity: 0`) must be revealed in the reduce branch, or the page is blank for those users. That is the single most common motion bug.

---

## 2. Entrance timeline

```tsx
function Hero() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
      tl.from('[data-hero="media"]', { scale: 0.96, opacity: 0, duration: 0.45 })
        .from('[data-hero="title"]', { y: 14, opacity: 0, duration: 0.3 }, '-=0.25')
        .from('[data-hero="copy"]', { y: 10, opacity: 0, duration: 0.3 }, '-=0.2')
        .from('[data-hero="cta"]', { y: 8, opacity: 0, duration: 0.25 }, '-=0.15');
    });
    return () => mm.revert();
  }, { scope: root });

  return (
    <section ref={root}>
      <img data-hero="media" src="/hero.webp" alt="" />
      <h1 data-hero="title">Sleep, decoded</h1>
      <p data-hero="copy">Know what happened while you slept.</p>
      <button data-hero="cta">Start tonight</button>
    </section>
  );
}
```

Rules: one timeline, one direction, total ≤ 900ms, no bounce on text.

---

## 3. Scroll reveal (batch, once)

For lists and grids, `ScrollTrigger.batch` is cheaper than one trigger per card:

```tsx
useGSAP(() => {
  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    gsap.set('[data-reveal]', { opacity: 0, y: 16 });
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 85%',
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, {
          opacity: 1, y: 0, duration: 0.3, ease: 'power2.out',
          stagger: 0.04, overwrite: true,
        }),
    });
    return () => mm.revert();
  });
}, { scope: root });
```

If the content is above the fold on load, `batch` still fires on refresh — which is what you want. Do not `once: false` for content.

---

## 4. Pinned section with scrub

```tsx
useGSAP(() => {
  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference) and (min-width: 768px)', () => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.feature',
        start: 'top top',
        end: '+=120%',
        pin: true,
        scrub: 0.6,
        anticipatePin: 1,
      },
    });
    tl.to('.feature__copy', { y: -24, opacity: 1 })
      .to('.feature__panel', { scale: 1, borderRadius: 12 }, 0);
  });
}, { scope: root });
```

Pin only on desktop/tablet widths. On phones, pinned sections eat the viewport and fight the browser chrome.

---

## 5. Parallax with clamp

```tsx
gsap.to('.parallax img', {
  yPercent: 12,
  ease: 'none',
  scrollTrigger: {
    trigger: '.parallax',
    start: 'top bottom',
    end: 'bottom top',
    scrub: true,
  },
});
```

- Keep `yPercent` ≤ 15 so edges never show.
- Make the image 120% height with `object-fit: cover`.
- Never parallax text; it hurts readability and causes motion sickness.

---

## 6. Split-text headline

```tsx
import { SplitText } from 'gsap/SplitText';

useGSAP(() => {
  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const split = new SplitText('.headline', { type: 'lines,words', linesClass: 'line' });
    gsap.from(split.words, {
      yPercent: 60, opacity: 0, duration: 0.5, ease: 'power3.out', stagger: 0.02,
    });
    return () => split.revert();
  });
}, { scope: root });
```

Always `split.revert()` on cleanup and re-split on resize if text reflows (SplitText 3.13 has `autoSplit` for that). Keep an `aria-label` with the plain text.

---

## 7. Scroll progress

```tsx
gsap.to('.progress-bar', {
  scaleX: 1,
  ease: 'none',
  scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.2 },
});
```

`transform-origin: left center` in CSS. Do not animate `width`.

---

## 8. Page transitions

Prefer the platform API where available:

```ts
// SPA route change
if (document.startViewTransition) {
  document.startViewTransition(() => updateDom());
}
```

```css
::view-transition-old(root) { animation: 150ms cubic-bezier(.4,0,1,1) both fade-out; }
::view-transition-new(root) { animation: 250ms cubic-bezier(.2,.8,.2,1) both fade-in; }
```

GSAP fallback (no scroll position games):

```tsx
const enter = (el: HTMLElement) =>
  gsap.fromTo(el, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' });

const leave = (el: HTMLElement, done: () => void) =>
  gsap.to(el, { opacity: 0, duration: 0.15, ease: 'power1.in', onComplete: done });
```

In Capacitor, disable native page slide transitions when you use a custom one — double transitions look broken.

---

## 9. Magnetic button (pointer only)

```tsx
useGSAP(() => {
  const el = buttonRef.current!;
  if (window.matchMedia('(hover: none)').matches) return;

  const xTo = gsap.quickTo(el, 'x', { duration: 0.3, ease: 'power3.out' });
  const yTo = gsap.quickTo(el, 'y', { duration: 0.3, ease: 'power3.out' });

  const move = (e: PointerEvent) => {
    const r = el.getBoundingClientRect();
    xTo((e.clientX - (r.left + r.width / 2)) * 0.25);
    yTo((e.clientY - (r.top + r.height / 2)) * 0.25);
  };
  const reset = () => { xTo(0); yTo(0); };

  el.addEventListener('pointermove', move);
  el.addEventListener('pointerleave', reset);
  return () => {
    el.removeEventListener('pointermove', move);
    el.removeEventListener('pointerleave', reset);
  };
}, { scope: root });
```

`quickTo` reuses one tween instead of allocating per pointer event — that is the difference between smooth and janky.

---

## 10. Count up

```tsx
const obj = { v: 0 };
gsap.to(obj, {
  v: target,
  duration: 0.8,
  ease: 'power2.out',
  snap: { v: 1 },
  scrollTrigger: { trigger: el, start: 'top 85%', once: true },
  onUpdate: () => { el.textContent = new Intl.NumberFormat().format(obj.v); },
});
```

Under reduced motion, set the final value immediately.

---

## 11. Accordion with Flip

```tsx
const open = (panel: HTMLElement) => {
  const state = Flip.getState('.accordion-item');
  panel.hidden = false;
  Flip.from(state, { duration: 0.3, ease: 'power2.out', absolute: true, nested: true });
};
```

Flip animates layout without animating `height` frame by frame. Prefer it to measuring scrollHeight.

---

## 12. Cleanup and performance

| Problem | Fix |
|---|---|
| Animations replay on hot reload | `useGSAP` scope + `mm.revert()` |
| ScrollTrigger positions stale after images load | `ScrollTrigger.refresh()` after load, or set explicit dimensions |
| Jank on mobile | Animate only transform/opacity; drop `filter`/`backdrop-filter` |
| Memory growth on route change | Kill triggers in cleanup (`ctx.revert()` / `mm.revert()`) |
| Double registration warnings | Register plugins once in a module |
| Layout shift on first paint | Set initial state via CSS (`opacity: 0` only when JS is confirmed) |
| Reduced-motion users see blank content | Reveal in the reduce branch |
