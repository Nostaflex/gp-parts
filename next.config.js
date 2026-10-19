/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Server Actions : restreindre les origines autorisées (defense-in-depth
  // CSRF — Phase 5 §9.28). Memory mentionne gp-parts.vercel.app comme prod.
  experimental: {
    serverActions: {
      // Previews du SEUL projet gp-parts — jamais '*.vercel.app' entier
      // (audit 2026-08-18 : confiance trop large envers des sous-domaines tiers).
      allowedOrigins: ['gp-parts.vercel.app', 'gp-parts-*.vercel.app'],
    },
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  // Redirects 301 — ancien chemin /vente-vo → /vente-vehicule (rename 2026-05-14)
  async redirects() {
    return [
      { source: '/vente-vo', destination: '/vente-vehicule', permanent: true },
      { source: '/vente-vo/:id', destination: '/vente-vehicule/:id', permanent: true },
      // Pages légales fusionnées dans /mentions-legales : 308 permanent (SEO lot 1,
      // 2026-10-11, P2.4 de l'audit) — avant : redirect() 307 dans trois pages.
      { source: '/cgv', destination: '/mentions-legales', permanent: true },
      { source: '/cookies', destination: '/mentions-legales', permanent: true },
      { source: '/confidentialite', destination: '/mentions-legales', permanent: true },
      // Domaine canonique : apex → www (évite le duplicate content SEO).
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'car-performance.biz' }],
        destination: 'https://www.car-performance.biz/:path*',
        permanent: true,
      },
    ];
  },
  // Security headers
  async headers() {
    return [
      // Surfaces privées : noindex aussi en en-tête HTTP, lisible même quand le
      // crawl est bloqué par robots.txt (SEO lot 1, P1.1 de l'audit du 19/08).
      ...['/admin', '/admin/:path*', '/panier', '/commande/:path*', '/compte/:path*'].map(
        (source) => ({
          source,
          headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
        })
      ),
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              // Audit 2026-08-18 — étape 1 (sans nonce : incompatible ISR/SSG,
              // cf. learnings Next 15) : neutralise plugins/objets, détourne
              // les <base> injectés et cadenasse les cibles de formulaires.
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://images.unsplash.com https://firebasestorage.googleapis.com https://*.firebasestorage.app https://res.cloudinary.com",
              "font-src 'self' https://fonts.gstatic.com",
              // connect-src DOIT lister Firebase Storage : sans ça, l'upload
              // resumable (ImageUploader → uploadBytesResumable) est bloqué par
              // le CSP → spinner figé. Bucket = *.firebasestorage.app, API =
              // firebasestorage.googleapis.com / storage.googleapis.com.
              "connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://firebasestorage.googleapis.com https://storage.googleapis.com https://*.firebasestorage.app https://*.firebaseio.com wss://*.firebaseio.com",
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
