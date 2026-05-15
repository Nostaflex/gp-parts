import type { ReactNode } from 'react';

/**
 * Pill de statut iOS Clarity (back-office).
 *
 * `tone` mappe une couleur sémantique iOS. Pas de logique métier ici —
 * l'appelant traduit son statut domaine (commande, stock, demande) en `tone`.
 */
export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const TONES: Record<BadgeTone, { bg: string; fg: string }> = {
  neutral: { bg: 'rgba(120, 120, 128, 0.12)', fg: 'rgba(28, 28, 30, 0.6)' },
  info: { bg: 'rgba(0, 122, 255, 0.12)', fg: '#007AFF' },
  success: { bg: 'rgba(52, 199, 89, 0.14)', fg: '#248A3D' },
  warning: { bg: 'rgba(255, 149, 0, 0.14)', fg: '#C25E00' },
  danger: { bg: 'rgba(255, 59, 48, 0.12)', fg: '#C0271F' },
};

export function StatusBadge({
  tone = 'neutral',
  children,
}: {
  tone?: BadgeTone;
  children: ReactNode;
}) {
  const { bg, fg } = TONES[tone];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-caption font-medium whitespace-nowrap"
      style={{ background: bg, color: fg }}
    >
      {children}
    </span>
  );
}
