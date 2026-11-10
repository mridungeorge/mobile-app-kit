# React Bits — Curated Catalog

[React Bits](https://github.com/DavidHDev/react-bits) is a copy-paste registry of 120+ animated React components. **Do not install the whole set.** Each component is a dependency and a maintenance surface; pick what the screen needs.

## Contents
1. Install
2. Animations (transitions, reveals, cursor)
3. Text animations
4. Components (navigation, cards, galleries)
5. Micro-interactions (mobile-relevant)
6. Backgrounds
7. Selection heuristics
8. What not to use on mobile

---

## 1. Install

```bash
# shadcn CLI — suffix is -{JS|TS}-{CSS|TW}
npx shadcn@latest add @react-bits/AnimatedContent-TS-TW

# jsrepo
npx jsrepo@latest add https://reactbits.dev/r/AnimatedContent-TS-TW
```

Registry config for agent-driven installs (`components.json`):

```json
{ "registries": { "@react-bits": "https://reactbits.dev/r/{name}.json" } }
```

Most animation components import `gsap` and register `ScrollTrigger` themselves. If you already register plugins in a setup module, remove the duplicate registration when you vendor the file.

---

## 2. Animations

| Component | Use it for | Watch out |
|---|---|---|
| **AnimatedContent** | Scroll- or mount-triggered reveal with direction, blur, rotate, wipe, stagger, `once`/`scrub` | The closest thing to a universal reveal; configure it instead of writing five variants |
| **FadeContent** | Simple fade/slide reveal for sections | Prefer `once: true` |
| **ScrollExpand** | Media that expands on scroll | Scrub-heavy; test on mobile |
| **PixelTransition** | Image swap with a pixel-grid wipe | One per page max |
| **PixelSwap** | Content swap effect | Use for hero image changes, not navigation |
| **GlareHover** | Specular highlight on cards | Pointer-only; disable on touch |
| **StarBorder** | Animated border for a premium CTA | Cheap and effective on dark surfaces |
| **ElectricBorder** | High-energy border | Use once; dates fast if everywhere |
| **LogoLoop** | Logo/wordmark marquee | Pause on hover; respect reduced motion |
| **Magnet** | Cursor-attracted element | Pointer-only |
| **ClickSpark** | Particle burst on click | Fun on marketing pages, noisy in an app |
| **ImageTrail** | Cursor image trail | Desktop-only |
| **BlobCursor / SplashCursor / GhostCursor** | Custom cursors | Never on touch |
| **StickerPeel** | Peel-away sticker reveal | Niche; heavy DOM |
| **Cubes / Ribbons / Strands** | 3D decorative scenes | Three.js weight; lazy-load |

---

## 3. Text animations

| Component | Use it for | Watch out |
|---|---|---|
| **SplitText** | Headline split into chars/words/lines with stagger | One headline per page; keep body copy whole |
| **BlurText** | Words blurring into focus | Great for subheads |
| **TextType** | Typewriter effect | Cap at one line; provide `aria-label` with the full text |
| **ShinyText** | Gradient shimmer on a label | Keep contrast; not for body |
| **GradientText** | Animated gradient text | Legibility at small sizes |
| **CountUp** | Number counting when in view | Format with `Intl.NumberFormat`; reduced motion → final value |
| **ScrollFloat / ScrollReveal** | Paragraphs rising on scroll | `once: true` for content |
| **ScrollVelocity** | Marquee speed tied to scroll | Decorative only |
| **RotatingText / TextLoop / CircularText** | Rotating value props, badges | Avoid in forms/UI chrome |
| **DecryptedText / ScrambledText / Shuffle** | Hacker/glitch reveals | One instance; unreadable if repeated |
| **FuzzyText / GlitchText / StrokeText** | Display treatments | Headline only |

Accessibility: split text must keep a readable accessible name. Wrap with `aria-label` on the container and `aria-hidden` on the visual spans, or use the component's built-in label prop if it has one.

---

## 4. Components

| Component | Use it for |
|---|---|
| **Dock** | macOS-style magnification bar — desktop web only |
| **StaggeredMenu / BubbleMenu / PillNav / GooeyNav / CardNav** | Marketing navigation; pick one, not five |
| **AnimatedList** | Feed with enter/exit transitions |
| **ScrollStack** | Stacked cards revealed on scroll |
| **Stack / CardSwap / DepthCarousel / Carousel / FlexCarousel** | Card layouts with depth |
| **ProfileCard / TiltedCard / SpotlightCard / PixelCard / ReflectiveCard / HoloCard** | Hero/profile treatments — one per page |
| **MagicBento / Masonry / ChromaGrid** | Feature grids |
| **Counter / Stepper** | Progress and quantity UI |
| **GlassSurface / FluidGlass** | One translucent surface, maximum |
| **Folder / GlassIcons / Lanyard / ModelViewer** | Decorative or 3D showcase |
| **AccordionGallery / CircularGallery / DomeGallery / InfiniteMenu / InfiniteSpiral** | Galleries — heavy, use on marketing pages |

---

## 5. Micro-interactions (the mobile-relevant set)

These are the ones that translate into good app UI, because they map to familiar controls:

| Component | Maps to |
|---|---|
| **SpringCheck** | Checkbox with spring confirm |
| **SquishSwitch / JellyRadio** | Toggle and radio with tactile press |
| **SlideCommit / SwipeRow / SwipeToast** | Swipe actions and confirm-to-commit |
| **HoldButton / SlingButton / FuseButton** | Destructive or high-commitment actions |
| **RefineFrame / ScrubField** | Sliders with live feedback |
| **LatticeLoader** | Skeleton/loader with structure |
| **PulseHeart** | Like/favourite |
| **BellToggle** | Notification toggle |
| **WarmTooltip / PeekRating** | Contextual help |

Use these as **reference implementations** even on React Native: the interaction model (press-down, overshoot, settle) is what you port, not the DOM code.

---

## 6. Backgrounds

Backgrounds are the highest-risk category: beautiful, expensive, and easy to overuse.

Safe on mobile web: **Aurora**, **Grainient**, **DotGrid**, **Silk**, **Waves**, **Topography**, **LightRays** (low intensity).
Desktop-only or lazy-load: **Ballpit**, **Ferrofluid**, **LiquidChrome**, **MoltenMetal**, **Hyperspeed**, **Galaxy**, **Prism**, **LiquidEther**, **MetaBalls**.

Rules:
- One background layer per page, `aria-hidden`, `pointer-events: none`.
- Opacity ≤ 0.5 over a solid surface so text contrast survives.
- Pause when the tab is hidden (`IntersectionObserver` + `visibilitychange`).
- Provide a static gradient fallback for reduced motion and low-end devices.

---

## 7. Selection heuristics

1. **Name the job first** ("reveal the pricing cards", "make the hero feel alive"), then pick. Never browse and decorate.
2. **One expressive component per screen.** If two components both animate the same element, delete one.
3. **Prefer the boring one.** `AnimatedContent` + `FadeContent` cover 70% of marketing needs.
4. **Check the dependencies** before installing: `three`, `ogl`, `matter-js` add hundreds of KB. Lazy-load anything above 50KB gzipped.
5. **Vendor the file** rather than depending on the registry at build time; registries change.

---

## 8. What not to use on mobile

- Cursor-based effects (Magnet, BlobCursor, ImageTrail, GhostCursor, TargetCursor)
- Dock magnification
- Heavy WebGL backgrounds on a content screen
- Scroll-jacking galleries
- Any component that requires hover to reveal essential information

For React Native, use `references/mobile-motion.md` — the interaction model transfers, the code does not.
