'use client';

import { createContext, useContext, useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';

import { useToast } from '@/components/ui/Toast';

import type { ReactNode } from 'react';

/**
 * État retourné par toute Server Action admin (contrat spec §6/§8).
 * Soit succès, soit erreurs de champ Zod (`flatten().fieldErrors`).
 */
export type FormActionState =
  | { ok: true; message?: string }
  | { ok?: false; errors: Record<string, string[] | undefined> }
  | null;

type FormAction = (prevState: FormActionState, formData: FormData) => Promise<FormActionState>;

const FieldErrorsContext = createContext<Record<string, string[] | undefined>>({});

/** Affiche l'erreur Zod du champ `name` si présente (placée sous l'input). */
export function FieldError({ name }: { name: string }) {
  const errors = useContext(FieldErrorsContext);
  const msg = errors[name]?.[0];
  if (!msg) return null;
  return (
    <p className="text-caption mt-1" style={{ color: '#C0271F' }} role="alert">
      {msg}
    </p>
  );
}

/** Bouton submit avec état pending natif (useFormStatus). */
export function SubmitButton({ children = 'Enregistrer' }: { children?: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-11 px-5 rounded-[10px] text-body-sm font-semibold text-white transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]"
      style={{ background: 'var(--blue)' }}
    >
      {pending ? 'Enregistrement…' : children}
    </button>
  );
}

/**
 * Wrapper de formulaire admin : câble une Server Action via `useActionState`
 * (React 19 natif — raison de l'upgrade Next 15/R19), surface les erreurs
 * Zod par champ aux <FieldError>, et émet un toast succès/erreur.
 *
 * `onSuccess` : callback après succès (ex: fermer le drawer, router.back).
 */
export function FormShell({
  action,
  children,
  onSuccess,
  successMessage = 'Modifications enregistrées.',
}: {
  action: FormAction;
  children: ReactNode;
  onSuccess?: () => void;
  successMessage?: string;
}) {
  const [state, formAction] = useActionState(action, null);
  const { showToast } = useToast();
  const handled = useRef<FormActionState>(null);

  useEffect(() => {
    if (!state || state === handled.current) return;
    handled.current = state;
    if ('ok' in state && state.ok) {
      showToast({ type: 'success', message: state.message ?? successMessage });
      onSuccess?.();
    } else if (state && 'errors' in state) {
      showToast({ type: 'error', message: 'Vérifie les champs en erreur.' });
    }
  }, [state, showToast, onSuccess, successMessage]);

  const fieldErrors = state && 'errors' in state ? state.errors : {};

  // Erreurs globales (`_form`) — ex: conflit optimistic lock « modifié
  // entre-temps ». Sans ce bandeau, ces messages n'étaient affichés nulle
  // part : l'admin recevait un toast vague sans la cause réelle.
  const formErrors = fieldErrors._form ?? [];

  return (
    <FieldErrorsContext.Provider value={fieldErrors}>
      <form action={formAction} className="flex flex-col gap-4">
        {formErrors.length > 0 && (
          <div
            role="alert"
            className="rounded-[10px] px-3 py-2 text-body-sm"
            style={{ background: 'rgba(255, 59, 48, 0.1)', color: '#C0271F' }}
          >
            {formErrors.map((msg, i) => (
              <p key={i}>{msg}</p>
            ))}
          </div>
        )}
        {children}
      </form>
    </FieldErrorsContext.Provider>
  );
}
