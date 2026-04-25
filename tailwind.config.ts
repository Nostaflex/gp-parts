import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // GP-Parts boutique — aligné sur palette CarPerformance
        cream: '#F4EDE0', // était #F8F7F4 — harmonisé cp-cream
        ivory: '#F8F5F0', // était #F5F0EB — harmonisé u-craft
        lin: '#E5DDD3', // inchangé
        volcanic: '#E87200', // était #FF4D00 — harmonisé cp-mango
        caribbean: '#52C88A', // était #00B996 — harmonisé cp-vert-l
        basalt: '#1A0F06', // était #12100E — harmonisé cp-ink
        // Couleurs sémantiques GP-Parts
        error: '#DC2626',
        warning: '#D97706',

        // Car Performance — palette globale
        cp: {
          cream: '#F4EDE0',
          ink: '#1A0F06',
          mango: '#E87200',
          vert: '#2A5C45',
          'vert-l': '#52C88A',
          gold: '#E9C46A',
        },
        // Car Performance — univers (backgrounds de section)
        u: {
          hero: '#F4EDE0', // Cream Drama
          cinema: '#0D0905', // Cinéma Sombre
          foret: '#0E1F18', // Forêt Profonde
          amber: '#1E0E04', // Ambre Cuir
          craft: '#F8F5F0', // Craft Ivoire
          dusk: '#1A1208', // Dusk Tropical
        },
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
        // GP-Parts
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
        // Car Performance
        'cp-reveal': {
          '0%': { opacity: '0', transform: 'translateY(32px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'cp-orb-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.6' },
          '50%': { transform: 'scale(1.15)', opacity: '0.9' },
        },
        'cp-float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'cp-fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        // GP-Parts
        skeleton: 'skeleton-pulse 1.8s ease-in-out infinite',
        'slide-up': 'slide-up 250ms ease-out',
        'fade-in': 'fade-in 200ms ease-out',
        // Car Performance
        'cp-reveal': 'cp-reveal 700ms cubic-bezier(0.16,1,0.3,1) both',
        'cp-orb': 'cp-orb-pulse 6s ease-in-out infinite',
        'cp-float': 'cp-float 4s ease-in-out infinite',
        'cp-fade': 'cp-fade-in 500ms ease-out both',
      },
      transitionTimingFunction: {
        'cp-out': 'cubic-bezier(0.16,1,0.3,1)',
        'cp-spring': 'cubic-bezier(0.34,1.56,0.64,1)',
        'cp-in': 'cubic-bezier(0.4,0,1,1)',
      },
    },
  },
  plugins: [],
};

export default config;
