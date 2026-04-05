import type { Metadata } from 'next';
import { Big_Shoulders_Display, Instrument_Sans, JetBrains_Mono } from 'next/font/google';
import { CartProvider } from '@/components/cart/CartProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
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
  metadataBase: new URL('https://gpparts.gp'),
  title: {
    default: 'GP Parts — Pièces détachées auto & moto en Guadeloupe',
    template: '%s | GP Parts',
  },
  description:
    'Pièces détachées auto et moto de qualité origine, livrées partout en Guadeloupe. Freinage, moteur, transmission, filtres, éclairage et plus.',
  keywords: [
    'pièces détachées',
    'Guadeloupe',
    'auto',
    'moto',
    'freinage',
    'filtres',
    'plaquettes',
    'disques',
  ],
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'GP Parts',
    title: 'GP Parts — Pièces détachées auto & moto en Guadeloupe',
    description: 'Qualité origine, livraison rapide sur toute l\'île.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${bigShoulders.variable} ${instrumentSans.variable} ${monoFont.variable}`}>
      <body className="min-h-screen flex flex-col">
        <a href="#main" className="skip-link">
          Aller au contenu principal
        </a>
        <ToastProvider>
          <CartProvider>
            <Navbar />
            <main id="main" className="flex-1 pt-8">
              {children}
            </main>
            <Footer />
            <CookieBanner />
          </CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
