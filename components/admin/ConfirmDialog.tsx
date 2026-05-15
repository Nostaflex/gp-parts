'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

const IOS = {
  surface: 'var(--surface)',
  text: 'var(--text)',
  textMuted: 'rgba(28, 28, 30, 0.6)',
  borderFaint: 'rgba(198, 198, 200, 0.5)',
  danger: '#FF3B30',
  dangerHover: '#E0322A',
} as const;

/**
 * Dialog de confirmation destructive — maison iOS Clarity (décision spec
 * v3.1 §7 : pas de shadcn AlertDialog). Double-confirm : pour
 * `requireText`, l'admin doit retaper un mot (ex: le nom du véhicule)
 * avant que le bouton destructif s'active. Mitige le risque §12
 * "Stephane supprime par erreur".
 *
 * `onConfirm` peut être async : le bouton passe en état chargement et le
 * dialog reste ouvert jusqu'à résolution (l'appelant ferme via `open`).
 */
export function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title,
  message,
  confirmLabel = 'Supprimer',
  requireText,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  requireText?: string;
}) {
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      setTyped('');
      setBusy(false);
      cancelRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !busy) onCancel();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  const confirmDisabled = busy || (requireText !== undefined && typed.trim() !== requireText);

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        aria-label="Annuler"
        onClick={() => !busy && onCancel()}
        className="absolute inset-0 animate-fade-in"
        style={{ background: 'rgba(0, 0, 0, 0.4)' }}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-sm rounded-[14px] p-6 animate-fade-in"
        style={{ background: IOS.surface, border: `1px solid ${IOS.borderFaint}` }}
      >
        <div className="flex flex-col items-center text-center">
          <AlertTriangle
            size={32}
            strokeWidth={1.75}
            style={{ color: IOS.danger }}
            className="mb-3"
          />
          <h2 className="font-title text-h3 mb-1" style={{ color: IOS.text }}>
            {title}
          </h2>
          <p className="text-body-sm mb-4" style={{ color: IOS.textMuted }}>
            {message}
          </p>
          {requireText !== undefined && (
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={`Tapez « ${requireText} » pour confirmer`}
              aria-label="Confirmation par saisie"
              className="w-full mb-4 px-3 h-11 rounded-[10px] text-body-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]"
              style={{
                background: 'var(--bg)',
                border: `1px solid ${IOS.borderFaint}`,
                color: IOS.text,
              }}
            />
          )}
        </div>
        <div className="flex gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex-1 h-11 rounded-[10px] text-body-sm font-medium transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]"
            style={{ background: 'var(--bg)', color: IOS.text }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={confirmDisabled}
            className="flex-1 h-11 rounded-[10px] text-body-sm font-semibold text-white transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]"
            style={{ background: confirmDisabled ? IOS.danger : IOS.danger }}
            onMouseEnter={(e) => {
              if (!confirmDisabled)
                (e.currentTarget as HTMLElement).style.background = IOS.dangerHover;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = IOS.danger;
            }}
          >
            {busy ? 'Suppression…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
