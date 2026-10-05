'use client';

// Fiches du BO par étapes (décision Djemil du 2026-10-05, docs/architecture/
// 2026-10-05-centre-et-formulaires.plan.json) : la fiche véhicule, 28 champs,
// tenait sur deux écrans et demi. Tous les champs restent dans le même
// <form> — une étape masquée est seulement cachée — donc ce qui part au
// serveur ne change pas.

import {
  Children,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

import { SubmitButton, useFieldErrors } from '@/components/admin/FormShell';
import { useToast } from '@/components/ui/Toast';

type StepProps = {
  title: string;
  /** Noms des champs à remplir avant de passer à l'étape suivante. */
  requis?: string[];
  children: ReactNode;
};

/** Une étape de fiche. Rendue par <FormSteps>, qui lit son titre et ses champs requis. */
export function FormStep({ children }: StepProps) {
  return <>{children}</>;
}

export function FormSteps({
  children,
  submitLabel,
  editing = false,
}: {
  children: ReactNode;
  submitLabel: string;
  /** Fiche existante : on saute à l'étape voulue et « Enregistrer » est partout. */
  editing?: boolean;
}) {
  const steps = Children.toArray(children).filter(isValidElement) as ReactElement<StepProps>[];
  const last = steps.length - 1;
  const [current, setCurrent] = useState(0);
  const panels = useRef<(HTMLDivElement | null)[]>([]);
  const top = useRef<HTMLDivElement>(null);
  const errors = useFieldErrors();
  const { showToast } = useToast();

  // Refus du serveur : ouvrir la première étape qui porte une erreur, sinon
  // le message resterait sur un écran qu'on ne voit pas.
  useEffect(() => {
    if (Object.keys(errors).length === 0) return;
    const fautive = panels.current.findIndex((panel) => panel?.querySelector('[role="alert"]'));
    if (fautive >= 0) setCurrent(fautive);
  }, [errors]);

  const go = (index: number) => {
    setCurrent(index);
    top.current?.scrollIntoView?.({ block: 'start' });
  };

  const suivant = () => {
    const panel = panels.current[current];
    const vide = (steps[current].props.requis ?? [])
      .map((name) =>
        panel?.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`)
      )
      .find((champ) => champ && champ.value.trim() === '');
    if (vide) {
      vide.focus();
      showToast({ type: 'error', message: 'Complète les champs obligatoires de cette étape.' });
      return;
    }
    go(current + 1);
  };

  const secondaire =
    'h-11 px-4 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] text-body-sm font-semibold text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]';

  return (
    <div ref={top} className="flex scroll-mt-20 flex-col gap-4">
      <div>
        <ol className="flex gap-1.5" aria-label="Étapes de la fiche">
          {steps.map((step, i) => (
            <li key={step.props.title} className="flex-1">
              <button
                type="button"
                onClick={() => go(i)}
                // Création : on ne saute pas une étape non remplie ; on peut revenir en arrière.
                disabled={!editing && i > current}
                aria-current={i === current ? 'step' : undefined}
                aria-label={`Étape ${i + 1} : ${step.props.title}`}
                className="block h-1.5 w-full rounded-full disabled:cursor-default"
                style={{ background: i <= current ? 'var(--blue)' : 'var(--border)' }}
              />
            </li>
          ))}
        </ol>
        <p className="mt-2 text-body-sm text-[var(--text-secondary)]">
          Étape {current + 1} sur {steps.length} ·{' '}
          <b className="text-[var(--text)]">{steps[current].props.title}</b>
        </p>
      </div>

      {steps.map((step, i) => (
        <div
          key={step.props.title}
          ref={(el) => {
            panels.current[i] = el;
          }}
          hidden={i !== current}
          className={i === current ? 'flex flex-col gap-4' : 'hidden'}
        >
          {step.props.children}
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        {current > 0 && (
          <button type="button" onClick={() => go(current - 1)} className={secondaire}>
            Précédent
          </button>
        )}
        {current < last && (
          <button
            type="button"
            onClick={suivant}
            className={
              editing
                ? secondaire
                : 'h-11 px-5 rounded-[10px] text-body-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]'
            }
            style={editing ? undefined : { background: 'var(--blue)' }}
          >
            Suivant
          </button>
        )}
        {(editing || current === last) && <SubmitButton>{submitLabel}</SubmitButton>}
      </div>
    </div>
  );
}
