/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Server Actions : restreindre les origines autorisées (defense-in-depth
  // CSRF — Phase 5 §9.28). Memory mentionne gp-parts.vercel.app comme prod.
  experimental: {
    serverActions: {
      allowedOrigins: ['gp-parts.vercel.app', '*.vercel.app'],
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
    ];
  },
  // Security headers
  async headers() {
    return [
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
