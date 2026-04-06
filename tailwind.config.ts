import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Volcanic Clarity v1.2 — palette identité
        cream: '#F8F7F4',
        ivory: '#F5F0EB',
        lin: '#E5DDD3',
        volcanic: '#FF4D00',
        caribbean: '#00B996',
        basalt: '#12100E',
        // Couleurs sémantiques
        error: '#DC2626',
        warning: '#D97706',
      },
      fontFamily: {
        title: ['var(--font-title)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      fontSize: {
        display: ['3rem', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '700' }],
        h1: ['2.25rem', { lineHeight: '1.1', letterSpacing: '-0.01em', fontWeight: '700' }],
        h2: ['1.875rem', { lineHeight: '1.15', letterSpacing: '-0.01em', fontWeight: '700' }],
        h3: ['1.5rem', { lineHeight: '1.2', fontWeight: '700' }],
        h4: ['1.25rem', { lineHeight: '1.3', fontWeight: '700' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
        body: ['1rem', { lineHeight: '1.6' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        caption: ['0.75rem', { lineHeight: '1.4' }],
        overline: ['0.75rem', { lineHeight: '1', letterSpacing: '0.08em', fontWeight: '500' }],
      },
      borderRadius: {
        pill: '9999px',
      },
      boxShadow: {
        subtle: '0 1px 3px rgba(18, 16, 14, 0.06)',
        medium: '0 4px 12px rgba(18, 16, 14, 0.08)',
        elevated: '0 8px 24px rgba(18, 16, 14, 0.12)',
      },
      zIndex: {
        nav: '10',
        dropdown: '20',
        'modal-backdrop': '30',
        modal: '31',
        toast: '40',
        'cookie-banner': '50',
      },
      transitionDuration: {
        fast: '150ms',
        normal: '250ms',
        slow: '350ms',
      },
      keyframes: {
        'skeleton-pulse': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.7' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        skeleton: 'skeleton-pulse 1.8s ease-in-out infinite',
        'slide-up': 'slide-up 250ms ease-out',
        'fade-in': 'fade-in 200ms ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
