import Link from 'next/link';

/**
 * Mention RGPD affichée sous tout formulaire qui collecte des données
 * personnelles (RDV, contact, réservation location, checkout). Texte fourni
 * par Stéphane (retours phase de test, 2026-08-12).
 */
export function CpRgpdNotice({
  className = '',
  tone = 'light',
}: {
  className?: string;
  /** 'light' = fond clair (cream), 'dark' = section sombre (contact). */
  tone?: 'light' | 'dark';
}) {
  const text = tone === 'dark' ? 'text-cp-cream/45' : 'text-cp-ink/45';
  const link = tone === 'dark' ? 'hover:text-cp-vert-l' : 'hover:text-cp-mango';
  return (
    <p className={`text-xs ${text} leading-relaxed ${className}`}>
      Les informations renseignées sont utilisées par CAR PERFORMANCE afin de traiter votre demande
      et de vous recontacter. Pour en savoir plus sur l&apos;utilisation de vos données et
      l&apos;exercice de vos droits, consultez notre{' '}
      <Link href="/confidentialite" className={`underline ${link} transition-colors`}>
        Politique de confidentialité
      </Link>
      .
    </p>
  );
}
