import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from './motion/gsap';
import AnimatedContent from './components/reactbits/AnimatedContent';
import SplitText from './components/reactbits/SplitText';
import Magnet from './components/reactbits/Magnet';
import StarBorder from './components/reactbits/StarBorder';
import ClickSpark from './components/reactbits/ClickSpark';
import { useReducedMotion } from './hooks/useReducedMotion';
import { useColorScheme } from './hooks/useColorScheme';

const METRICS = [
  { label: 'Deep', value: '1h 42m', tone: 'accent' },
  { label: 'REM', value: '1h 58m', tone: 'violet' },
  { label: 'HRV', value: '54 ms', tone: 'green' },
] as const;

const BARS = [38, 62, 44, 78, 56, 88, 70];

export default function App() {
  const reduce = useReducedMotion();
  const scheme = useColorScheme();
  const root = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);

  /* ---------------------------------------------------------------- hero */
  useGSAP(
    () => {
      if (reduce) {
        gsap.set('[data-phone]', { clearProps: 'all' });
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      tl.from('[data-nav]', { y: -12, opacity: 0, duration: 0.4 })
        .from('[data-eyebrow]', { y: 10, opacity: 0, duration: 0.3 }, '-=0.2')
        .from('[data-hero-copy]', { y: 12, opacity: 0, duration: 0.35 }, '-=0.15')
        .from('[data-hero-cta]', { y: 10, opacity: 0, duration: 0.3 }, '-=0.2')
        .from(
          '[data-phone]',
          { y: 48, opacity: 0, scale: 0.96, duration: 0.6, ease: 'power3.out' },
          '-=0.5',
        )
        .from(
          '[data-ring-progress]',
          { strokeDashoffset: 339.3, duration: 1.1, ease: 'power2.inOut' },
          '-=0.35',
        )
        .from('[data-score]', { opacity: 0, duration: 0.4 }, '-=0.7')
        .from(
          '[data-metric]',
          { y: 10, opacity: 0, duration: 0.3, stagger: 0.06 },
          '-=0.55',
        )
        .from(
          '[data-bar]',
          { scaleY: 0, transformOrigin: 'bottom center', duration: 0.45, stagger: 0.04 },
          '-=0.4',
        )
        .from('[data-tab]', { opacity: 0, y: 6, duration: 0.25, stagger: 0.05 }, '-=0.3');

      /* in-screen motion: score breathes, bars shimmer on tap */
      gsap.to('[data-ring-glow]', {
        opacity: 0.55,
        scale: 1.06,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      /* counters */
      gsap.utils.toArray<HTMLElement>('[data-count]').forEach((el) => {
        const target = Number(el.dataset.count);
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 1,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          onUpdate: () => {
            el.textContent = String(Math.round(obj.v));
          },
        });
      });

      /* generic reveals */
      gsap.set('[data-reveal]', { opacity: 0, y: 16 });
      ScrollTrigger.batch('[data-reveal]', {
        start: 'top 88%',
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: 0.3,
            stagger: 0.05,
            overwrite: true,
          }),
      });

      /* pinned feature — desktop only; phones keep native scroll */
      const mm = gsap.matchMedia();
      mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
        const pin = gsap.timeline({
          scrollTrigger: {
            trigger: '[data-pin]',
            start: 'top top',
            end: '+=110%',
            pin: true,
            scrub: 0.6,
            anticipatePin: 1,
          },
        });
        pin
          .fromTo(
            '[data-pin-arc]',
            { strokeDashoffset: 515 },
            { strokeDashoffset: 40, ease: 'none' },
            0,
          )
          .fromTo(
            '[data-pin-step="1"]',
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, ease: 'none' },
            0.1,
          )
          .fromTo(
            '[data-pin-step="2"]',
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, ease: 'none' },
            0.45,
          )
          .fromTo(
            '[data-pin-step="3"]',
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, ease: 'none' },
            0.75,
          );
      });

      return () => mm.revert();
    },
    { scope: root, dependencies: [reduce] },
  );

  return (
    <div ref={root} className={`page ${reduce ? 'is-reduced' : ''}`}>
      <a className="skip" href="#main">
        Skip to content
      </a>

      <header className="nav" data-nav>
        <div className="nav__brand">
          <span className="mark" aria-hidden />
          Halcyon
        </div>
        <nav className="nav__links" aria-label="Sections">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#start">Download</a>
        </nav>
        <a className="nav__cta" href="#start">
          Get the app
        </a>
      </header>

      <main id="main">
        {/* ---------------------------------------------------------- hero */}
        <section className="hero">
          <div className="hero__copy">
            <p className="eyebrow" data-eyebrow>
              Sleep, measured properly
            </p>

            {reduce ? (
              <h1 className="h1">Sleep, decoded.</h1>
            ) : (
              <h1 className="h1 h1--split">
                <span className="sr-only">Sleep, decoded.</span>
                <span aria-hidden="true">
                  <SplitText
                    text="Sleep, decoded."
                    tag="span"
                    className="h1__inner"
                    splitType="chars"
                    effect="rise"
                    trigger="load"
                    delay={6}
                    duration={0.9}
                    textAlign="left"
                    color="var(--text)"
                    accentColor="var(--accent)"
                  />
                </span>
              </h1>
            )}

            <p className="lede" data-hero-copy>
              A quiet, precise sleep tracker that shows you what actually happened
              overnight — then tells you what to change tonight.
            </p>

            <div className="hero__actions" data-hero-cta>
              <ClickSpark
                className="spark"
                style={{ width: 'auto', height: 'auto' }}
                sparkColor="#4392f7"
                sparkSize={8}
                sparkRadius={22}
                sparkCount={10}
              >
                <Magnet padding={28} magnetStrength={4} wrapperClassName="magnet">
                  <StarBorder
                    as="button"
                    className="btn btn--primary"
                    color="#4392f7"
                    theme={scheme}
                    glow={0.45}
                    duration={5}
                    thickness={1}
                  >
                    Start tonight
                  </StarBorder>
                </Magnet>
              </ClickSpark>
              <a className="btn btn--ghost" href="#how">
                See how it works
              </a>
            </div>

            <p className="fine" data-reveal>
              On-device analysis. No account required. iOS 17+ · Android 12+.
            </p>
          </div>

          <div
            className="hero__device"
            role="img"
            aria-label="Preview of the Halcyon app: a sleep score of 86 with deep, REM and HRV metrics"
          >
            <RunePhone />
          </div>
        </section>

        {/* ------------------------------------------------------ features */}
        <section id="features" className="features">
          <p className="eyebrow">Less dashboard, more answer</p>
          <h2 className="h2">Three things, done properly.</h2>

          <div className="grid">
            {[
              {
                k: '01',
                t: 'One score you can act on',
                d: 'Not a wall of charts. A single number, the three inputs that moved it, and one suggestion for tonight.',
              },
              {
                k: '02',
                t: 'Sleep stages, without the noise',
                d: 'Deep, core and REM mapped from motion and heart rate, with the confidence band shown instead of hidden.',
              },
              {
                k: '03',
                t: 'Private by construction',
                d: 'Every night is analysed on the device. Nothing leaves the phone unless you export it yourself.',
              },
            ].map((f, i) =>
              reduce ? (
                <article className="card" key={f.k}>
                  <CardBody {...f} />
                </article>
              ) : (
                <AnimatedContent
                  key={f.k}
                  distance={18}
                  duration={0.45}
                  delay={i * 0.06}
                  threshold={0.2}
                  once
                  className="card"
                >
                  <CardBody {...f} />
                </AnimatedContent>
              ),
            )}
          </div>
        </section>

        {/* ---------------------------------------------------- pinned flow */}
        <section id="how" className="pin" data-pin ref={pinRef}>
          <div className="pin__stage">
            <div className="pin__visual" aria-hidden>
              <div className="pin__ring" data-pin-ring>
                <svg viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="82" className="ring-track" />
                  <circle
                    cx="100"
                    cy="100"
                    r="82"
                    className="ring-progress"
                    data-pin-arc
                    strokeDasharray="515"
                    strokeDashoffset="40"
                  />
                </svg>
                <span className="pin__num">86</span>
              </div>
            </div>

            <div className="pin__copy">
              <p className="eyebrow">How it works</p>
              <h2 className="h2">From raw signal to a decision.</h2>

              <ol className="steps">
                <li data-pin-step="1">
                  <span>01</span>
                  <div>
                    <h3>Capture</h3>
                    <p>Accelerometer and heart rate, sampled at the lowest rate that keeps stages accurate.</p>
                  </div>
                </li>
                <li data-pin-step="2">
                  <span>02</span>
                  <div>
                    <h3>Interpret</h3>
                    <p>On-device model classifies stages and flags the confidence of every transition.</p>
                  </div>
                </li>
                <li data-pin-step="3">
                  <span>03</span>
                  <div>
                    <h3>Suggest</h3>
                    <p>One change for tonight, based on the input that moved your score most.</p>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------- proof */}
        <section className="stats">
          <div className="stat" data-reveal>
            <p className="stat__num">
              <span data-count="92">0</span>%
            </p>
            <p className="stat__label">of nights scored without a single upload</p>
          </div>
          <div className="stat" data-reveal>
            <p className="stat__num">
              <span data-count="14">0</span>s
            </p>
            <p className="stat__label">median time to morning insight</p>
          </div>
          <div className="stat" data-reveal>
            <p className="stat__num">
              <span data-count="0">0</span>
            </p>
            <p className="stat__label">third-party analytics SDKs shipped</p>
          </div>
        </section>

        {/* ---------------------------------------------------------- end */}
        <section id="start" className="end">
          <h2 className="h2">Tonight is a good night to start.</h2>
          <p className="lede">
            Free for the first two weeks. One subscription after that — no ads, no
            data resale, cancel in two taps.
          </p>
          <div className="hero__actions">
            <StarBorder
              as="button"
              className="btn btn--primary"
              color="#4392f7"
              theme={scheme}
              glow={0.45}
              duration={6}
            >
              Download for iOS
            </StarBorder>
            <a className="btn btn--ghost" href="#features">
              Android build
            </a>
          </div>
          <p className="fine">
            Motion demo — GSAP + React Bits running on the Halcyon design tokens.
          </p>
        </section>
      </main>

      <footer className="foot">
        <span>© 2026 Halcyon</span>
        <span className="foot__links">
          <a href="#features">Privacy</a>
          <a href="#features">Support</a>
        </span>
      </footer>
    </div>
  );
}

function CardBody({ k, t, d }: { k: string; t: string; d: string }) {
  return (
    <>
      <span className="card__k">{k}</span>
      <h3>{t}</h3>
      <p>{d}</p>
    </>
  );
}

function RunePhone() {
  return (
    <div className="phone" data-phone>
      <div className="phone__frame">
        <div className="phone__screen">
          <div className="phone__status">
            <span>9:41</span>
            <span className="phone__pill" aria-hidden />
          </div>

          <div className="app">
            <header className="app__head">
              <div>
                <p className="app__eyebrow">Tuesday, 10 November</p>
                <h4 className="app__title">Tonight</h4>
              </div>
              <span className="avatar" aria-hidden>
                AR
              </span>
            </header>

            <div className="score">
              <div className="score__glow" data-ring-glow aria-hidden />
              <svg className="score__ring" viewBox="0 0 120 120" aria-hidden>
                <circle cx="60" cy="60" r="54" className="ring-track" />
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  className="ring-progress"
                  data-ring-progress
                  strokeDasharray="339.3"
                  strokeDashoffset="47.5"
                />
              </svg>
              <div className="score__value" data-score>
                <span className="score__num">86</span>
                <span className="score__unit">Sleep score</span>
              </div>
            </div>

            <div className="metrics">
              {METRICS.map((m) => (
                <div className={`metric metric--${m.tone}`} key={m.label} data-metric>
                  <span className="metric__label">{m.label}</span>
                  <span className="metric__value">{m.value}</span>
                </div>
              ))}
            </div>

            <div className="chart" aria-hidden>
              {BARS.map((h, i) => (
                <span
                  className="chart__bar"
                  data-bar
                  key={i}
                  style={{ height: `${h}%`, animationDelay: `${i * 60}ms` }}
                />
              ))}
            </div>

            <div className="hint">
              <span className="hint__dot" aria-hidden />
              <p>
                <strong>Go to bed 20 min earlier.</strong> Your deep sleep drops when
                you start after 11:40pm.
              </p>
            </div>

            <nav className="tabs" aria-label="App sections">
              {['Tonight', 'Trends', 'Journal', 'Profile'].map((tab, i) => (
                <span className={`tab ${i === 0 ? 'is-active' : ''}`} key={tab} data-tab>
                  <span className="tab__icon" aria-hidden />
                  {tab}
                </span>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
