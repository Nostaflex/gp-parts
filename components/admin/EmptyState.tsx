import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

const IOS = {
  text: 'var(--text)',
  textMuted: 'rgba(28, 28, 30, 0.6)',
  textGhost: 'rgba(28, 28, 30, 0.28)',
} as const;

/**
 * État vide iOS Clarity : icône + titre + description + action optionnelle.
 *
 * `action` est un noeud libre (typiquement un <ButtonLink href> vers /new
 * ou un <Button onClick>) — EmptyState ne décide pas du type d'action.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {Icon && (
        <Icon size={40} strokeWidth={1.5} className="mb-4" style={{ color: IOS.textGhost }} />
      )}
      <p className="font-title text-h3 mb-1" style={{ color: IOS.text }}>
        {title}
      </p>
      {description && (
        <p className="text-body-sm max-w-sm mb-5" style={{ color: IOS.textMuted }}>
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
