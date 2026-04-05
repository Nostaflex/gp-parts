'use client';

import { useEffect } from 'react';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';

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
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
      <div className="w-16 h-16 bg-error/10 rounded-full mx-auto flex items-center justify-center mb-4">
        <AlertCircle size={32} strokeWidth={1.5} className="text-error" />
      </div>
      <h1 className="font-title text-h2 text-basalt mb-3">Oups, une erreur est survenue</h1>
      <p className="text-body text-basalt/70 mb-8">
        Quelque chose s&apos;est mal passé. Vous pouvez réessayer ou revenir à l&apos;accueil.
      </p>
      {error.digest && (
        <p className="text-caption font-mono text-basalt/40 mb-6">Code : {error.digest}</p>
      )}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button variant="primary" size="md" onClick={reset}>
          <RotateCcw size={18} strokeWidth={1.75} /> Réessayer
        </Button>
        <ButtonLink href="/" variant="outline" size="md">
          <Home size={18} strokeWidth={1.75} /> Accueil
        </ButtonLink>
      </div>
    </div>
  );
}
