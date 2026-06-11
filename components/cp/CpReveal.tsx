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

    const reveal = () => {
      el.classList.add('visible');
      obs.disconnect();
      window.removeEventListener('scroll', onScroll);
    };

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) reveal();
      },
      { threshold: 0.15 }
    );

    // Filet de sécurité : un saut instantané (ancre, touche Fin) ne franchit
    // aucun seuil IO — l'élément resterait invisible sans ce check.
    const onScroll = () => {
      if (el.getBoundingClientRect().top < window.innerHeight) reveal();
    };

    obs.observe(el);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      obs.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <div ref={ref} className={`cp-reveal ${DELAYS[delay]} ${className}`}>
      {children}
    </div>
  );
}
