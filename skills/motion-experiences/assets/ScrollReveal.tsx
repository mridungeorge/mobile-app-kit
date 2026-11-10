'use client';

import React, { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from './gsap-setup';

/**
 * Reveal children once when they scroll into view.
 * - 16px travel + fade, 300ms (Rune `settle`)
 * - reduced motion: no transform, content immediately visible
 * - cleanup via useGSAP scope
 */
export function ScrollReveal({
  children,
  className,
  delay = 0,
  stagger = 0.04,
  y = 16,
  as: Tag = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  stagger?: number;
  y?: number;
  as?: keyof React.JSX.IntrinsicElements;
}) {
  const root = useRef<HTMLElement>(null);
  const Component = Tag as React.ElementType;

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;

      const items = el.children.length > 1 ? Array.from(el.children) : [el];

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set(items, { opacity: 1, y: 0, clearProps: 'transform' });
        return;
      }

      gsap.set(items, { opacity: 0, y });

      ScrollTrigger.batch(items as Element[], {
        start: 'top 85%',
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: 0.3,
            ease: 'power2.out',
            stagger,
            delay,
            overwrite: true,
          }),
      });
    },
    { scope: root },
  );

  return (
    <Component ref={root} className={className}>
      {children}
    </Component>
  );
}
