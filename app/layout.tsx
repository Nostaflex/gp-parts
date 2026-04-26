import type { Metadata } from 'next';
import { Big_Shoulders_Display, Instrument_Sans, JetBrains_Mono } from 'next/font/google';
import { CartProvider } from '@/components/cart/CartProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { CookieBanner } from '@/components/gdpr/CookieBanner';
import './globals.css';

const bigShoulders = Big_Shoulders_Display({
  subsets: ['latin'],
  variable: '--font-title',
  weight: ['700'],
  display: 'swap',
});

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500'],
  display: 'swap',
});

const monoFont = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://car-performance.gp'),
  title: {
    default: 'Car Performance — Garage auto & moto Guadeloupe',
    template: '%s | Car Performance',
  },
  description:
    'Réparation, expertise, location et vente de véhicules en Guadeloupe. Pièces détachées auto & moto livrées partout en Guadeloupe.',
  keywords: [
    'garage',
    'Guadeloupe',
    'réparation auto',
    'pièces détachées',
    'location véhicule',
    'vente VO',
    'expertise',
    '971',
  ],
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Car Performance',
    title: 'Car Performance — Garage auto & moto Guadeloupe',
    description: 'Réparation, expertise, location et vente VO en Guadeloupe.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${bigShoulders.variable} ${instrumentSans.variable} ${monoFont.variable}`}
    >
      <body className="min-h-dvh flex flex-col cp-clip">
        <a href="#main" className="skip-link">
          Aller au contenu principal
        </a>
        <ToastProvider>
          <CartProvider>
            {children}
            <CookieBanner />
          </CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
