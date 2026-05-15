'use client';

import { useCallback, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

import type { ReactNode } from 'react';

const IOS = {
  surface: 'var(--surface)',
  text: 'var(--text)',
  textMuted: 'rgba(28, 28, 30, 0.6)',
  borderFaint: 'rgba(198, 198, 200, 0.5)',
} as const;

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Drawer slide-in droite — composant maison iOS Clarity (décision spec v3.1
 * §7 : pas de shadcn Sheet). Pensé pour le pattern Parallel/Intercepting
 * Routes : l'appelant câble `onClose` sur `router.back()` (mode interception)
 * ou un setState (mode contrôlé).
 *
 * - Escape + clic overlay → tentative de fermeture (passe par le dirty-check)
 * - `isDirty` true → demande confirmation avant de fermer (perte de saisie)
 * - Focus-trap : Tab cycle dans le drawer, focus initial sur le panneau,
 *   focus restauré sur l'élément déclencheur à la fermeture
 * - Scroll body verrouillé tant que le drawer est ouvert
 */
export function Drawer({
  open,
  onClose,
  title,
  children,
  isDirty = false,
  dirtyMessage = 'Des modifications non enregistrées seront perdues. Fermer quand même ?',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  isDirty?: boolean;
  dirtyMessage?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const attemptClose = useCallback(() => {
    if (isDirty && !window.confirm(dirtyMessage)) return;
    onClose();
  }, [isDirty, dirtyMessage, onClose]);

  // Focus management : mémorise le déclencheur, focus le panneau, restaure à la sortie
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const trigger = previouslyFocused.current;
    return () => trigger?.focus?.();
  }, [open]);

  // Scroll lock
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Escape + focus-trap
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        attemptClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const nodes = panel.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, attemptClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="presentation">
      <button
        type="button"
        aria-label="Fermer le panneau"
        onClick={attemptClose}
        className="absolute inset-0 animate-fade-in"
        style={{ background: 'rgba(0, 0, 0, 0.35)' }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="relative w-full max-w-md h-full flex flex-col overflow-y-auto animate-fade-in focus:outline-none"
        style={{ background: IOS.surface }}
      >
        <div
          className="sticky top-0 z-10 px-5 h-16 flex items-center justify-between"
          style={{ background: IOS.surface, borderBottom: `1px solid ${IOS.borderFaint}` }}
        >
          <h2 className="font-title text-h3" style={{ color: IOS.text }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={attemptClose}
            aria-label="Fermer"
            className="w-9 h-9 flex items-center justify-center rounded-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]"
            style={{ color: IOS.textMuted }}
          >
            <X size={20} strokeWidth={1.75} />
          </button>
        </div>
        <div className="flex-1 px-5 py-5">{children}</div>
      </div>
    </div>
  );
}
