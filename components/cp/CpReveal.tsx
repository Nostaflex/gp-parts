'use client';

import { useEffect, useRef, type ReactNode } from 'react';

type CpRevealProps = {
  children: ReactNode;
  delay?: 0 | 1 | 2 | 3 | 4;
  className?: string;
};

const DELAYS = ['', 'delay-100', 'delay-200', 'delay-300', 'delay-[400ms]'];

export function CpReveal({ children, delay = 0, className = '' }: CpRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible');
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={`cp-reveal ${DELAYS[delay]} ${className}`}>
      {children}
    </div>
  );
}
