'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // En production : remonter à Sentry / Datadog / Firebase Crashlytics
    console.error('[GP Parts] Runtime error:', error);
  }, [error]);

  return (
    <div
      className="min-h-[70vh] flex items-center justify-center px-6 py-24"
      style={{ backgroundColor: '#F4EDE0' }}
    >
      <div className="max-w-xl mx-auto text-center">
        <div
          className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-5"
          style={{ background: 'rgba(217,38,39,0.10)' }}
        >
          <AlertCircle size={32} strokeWidth={1.5} className="text-cp-red" />
        </div>
        <h1 className="cp-title font-black text-cp-ink text-3xl md:text-4xl mb-3">
          Oups, une erreur est survenue
        </h1>
        <p className="text-cp-ink/60 text-base leading-relaxed mb-8 max-w-md mx-auto">
          Quelque chose s&apos;est mal passé. Vous pouvez réessayer ou revenir à l&apos;accueil.
        </p>
        {error.digest && (
          <p className="cp-mono text-xs text-cp-ink/40 mb-6">Code : {error.digest}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 bg-cp-ink text-cp-cream font-semibold px-6 py-3 rounded-full hover:bg-cp-red transition-colors"
          >
            <RotateCcw size={18} strokeWidth={1.75} /> Réessayer
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 border border-cp-ink/15 text-cp-ink font-semibold px-6 py-3 rounded-full hover:border-cp-red hover:text-cp-mango transition-colors"
          >
            <Home size={18} strokeWidth={1.75} /> Accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
