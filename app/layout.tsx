import type { Metadata, Viewport } from 'next';
import { Big_Shoulders, Instrument_Sans, JetBrains_Mono } from 'next/font/google';
import { CartProvider } from '@/components/cart/CartProvider';
import { ToastProvider } from '@/components/ui/Toast';
import { CookieBanner } from '@/components/gdpr/CookieBanner';
import { JsonLd } from '@/components/seo/JsonLd';
import { FeatureFlagsProvider } from '@/components/cp/FeatureFlagsProvider';
import { getCachedFeatureFlags } from '@/lib/data/feature-flags-cache';
import { getCachedContactInfo } from '@/lib/data/contact-info-cache';
import { SITE_URL, localBusinessJsonLd, organizationJsonLd, websiteJsonLd } from '@/lib/seo';
import './globals.css';

const bigShoulders = Big_Shoulders({
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
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Car Performance — Garage auto & moto Guadeloupe',
    template: '%s | Car Performance',
  },
  description:
    'Réparation, location et vente de véhicules en Guadeloupe. Pièces détachées auto & moto livrées partout en Guadeloupe.',
  alternates: { canonical: '/' },
  keywords: [
    'garage',
    'Guadeloupe',
    'réparation auto',
    'pièces détachées',
    'location véhicule',
    'vente VO',
    '971',
  ],
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Car Performance',
    url: SITE_URL,
    title: 'Car Performance — Garage auto & moto Guadeloupe',
    description: 'Réparation, location et vente VO en Guadeloupe.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Car Performance — Garage auto & moto Guadeloupe',
    description: 'Réparation, location et vente VO en Guadeloupe.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#0D0905',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const featureFlags = await getCachedFeatureFlags();
  const contactInfo = await getCachedContactInfo();

  return (
    <html
      lang="fr"
      className={`${bigShoulders.variable} ${instrumentSans.variable} ${monoFont.variable}`}
    >
      <body className="min-h-dvh flex flex-col cp-clip">
        <JsonLd
          data={[
            localBusinessJsonLd(contactInfo),
            organizationJsonLd(contactInfo),
            websiteJsonLd(),
          ]}
        />
        <a href="#main" className="skip-link">
          Aller au contenu principal
        </a>
        <FeatureFlagsProvider value={featureFlags}>
          <ToastProvider>
            <CartProvider>
              <main id="main" tabIndex={-1} className="flex-1 flex flex-col">
                {children}
              </main>
              <CookieBanner />
            </CartProvider>
          </ToastProvider>
        </FeatureFlagsProvider>
      </body>
    </html>
  );
}
