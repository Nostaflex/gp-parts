'use client';

/**
 * Admin — Estimation reprise (form VIN-based).
 *
 * #9 Stephane: pré-saisie info véhicule pour estimation reprise.
 * Architecture no-cost:
 *  - VIN → /api/vehicule/decode-vin (proxy gratuit NHTSA vPIC)
 *  - Champs complémentaires saisis à la main (km, état, prix demandé)
 *  - Pas d'API plaque FR (SIV réservé aux pros agréés, voir docs Stephane)
 *  - Lien Histovec optionnel: le vendeur partage l'URL, on stocke pas les données
 *
 * Output: récapitulatif texte copiable pour interne (note dossier + email client).
 */

import { useState } from 'react';
import Link from 'next/link';

const IOS = {
  bg: 'var(--bg)',
  surface: 'var(--surface)',
  text: 'var(--text)',
  blue: 'var(--blue)',
  border: 'var(--border)',
  textMuted: 'rgba(28, 28, 30, 0.6)',
  textSubtle: 'rgba(28, 28, 30, 0.5)',
  success: '#34C759',
  warning: '#FF9500',
  warningBg: 'rgba(255, 149, 0, 0.1)',
};

type DecodedVin = {
  ok: true;
  vin: string;
  marque: string | null;
  modele: string | null;
  annee: number | null;
  carrosserie: string | null;
  energie: string | null;
  cylindres: string | null;
  cylindree: string | null;
  transmission: string | null;
  portes: number | null;
  finition: string | null;
};

type ApiError = { ok: false; error: string; vin?: string };

type FormState = {
  vin: string;
  marque: string;
  modele: string;
  annee: string;
  energie: string;
  cylindree: string;
  km: string;
  etat: 'excellent' | 'bon' | 'moyen' | 'a-reviser';
  prixDemande: string;
  histovecUrl: string;
  notes: string;
};

const ETATS: { val: FormState['etat']; label: string; color: string }[] = [
  { val: 'excellent', label: 'Excellent', color: '#34C759' },
  { val: 'bon', label: 'Bon', color: '#5AC8FA' },
  { val: 'moyen', label: 'Moyen', color: '#FF9500' },
  { val: 'a-reviser', label: 'À réviser', color: '#FF3B30' },
];

export function EstimationClient() {
  const [form, setForm] = useState<FormState>({
    vin: '',
    marque: '',
    modele: '',
    annee: '',
    energie: '',
    cylindree: '',
    km: '',
    etat: 'bon',
    prixDemande: '',
    histovecUrl: '',
    notes: '',
  });
  const [decoding, setDecoding] = useState(false);
  const [decodeError, setDecodeError] = useState<string | null>(null);
  const [decodedAt, setDecodedAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
  };

  const decodeVin = async () => {
    const vin = form.vin.trim().toUpperCase();
    if (!vin) {
      setDecodeError('Veuillez entrer un VIN.');
      return;
    }
    setDecoding(true);
    setDecodeError(null);
    setDecodedAt(null);
    try {
      const res = await fetch(`/api/vehicule/decode-vin?vin=${encodeURIComponent(vin)}`);
      const data: DecodedVin | ApiError = await res.json();
      if (!data.ok) {
        setDecodeError(data.error);
        return;
      }
      // Auto-fill form
      setForm((f) => ({
        ...f,
        vin: data.vin,
        marque: data.marque ?? f.marque,
        modele: data.modele ?? f.modele,
        annee: data.annee ? String(data.annee) : f.annee,
        energie: data.energie ?? f.energie,
        cylindree: data.cylindree ?? f.cylindree,
      }));
      setDecodedAt(new Date().toLocaleTimeString('fr-FR'));
    } catch (err) {
      setDecodeError(err instanceof Error ? err.message : 'Erreur réseau');
    } finally {
      setDecoding(false);
    }
  };

  const recapTexte = generateRecap(form);

  const copyRecap = async () => {
    try {
      await navigator.clipboard.writeText(recapTexte);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore — fallback prompt utilisateur de sélectionner manuellement */
    }
  };

  return (
    <div className="min-h-screen" style={{ background: IOS.bg }}>
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="text-sm font-medium mb-2 inline-block"
            style={{ color: IOS.blue }}
          >
            ← Retour au tableau de bord
          </Link>
          <h1 className="text-3xl font-bold mt-2" style={{ color: IOS.text }}>
            Estimation reprise
          </h1>
          <p className="text-sm mt-2" style={{ color: IOS.textMuted }}>
            Pré-saisie info véhicule pour répondre à une demande de reprise client.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
          {/* Form */}
          <div
            className="rounded-2xl p-6 border"
            style={{ background: IOS.surface, borderColor: IOS.border }}
          >
            {/* VIN decoder */}
            <section className="mb-8 pb-8 border-b" style={{ borderColor: IOS.border }}>
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: IOS.textSubtle }}
              >
                Étape 1 · VIN (numéro châssis)
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={form.vin}
                  onChange={(e) => set('vin', e.target.value.toUpperCase())}
                  placeholder="VF1KMS40554XXXXXX"
                  maxLength={17}
                  className="flex-1 px-4 py-3 rounded-xl border font-mono text-sm uppercase tracking-wider"
                  style={{
                    background: 'white',
                    borderColor: IOS.border,
                    color: IOS.text,
                  }}
                />
                <button
                  type="button"
                  onClick={decodeVin}
                  disabled={decoding || form.vin.length !== 17}
                  className="px-5 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: IOS.blue }}
                >
                  {decoding ? 'Décodage…' : 'Décoder'}
                </button>
              </div>
              <p className="text-xs mt-2" style={{ color: IOS.textSubtle }}>
                17 caractères, sans I/O/Q. Le VIN se trouve sur la carte grise (case E) ou au pied
                du pare-brise.
              </p>
              {decodeError && (
                <div
                  className="mt-3 p-3 rounded-lg text-sm"
                  style={{
                    background: 'rgba(255, 59, 48, 0.08)',
                    color: '#FF3B30',
                    borderLeft: '3px solid #FF3B30',
                  }}
                >
                  {decodeError}
                </div>
              )}
              {decodedAt && !decodeError && (
                <div
                  className="mt-3 p-3 rounded-lg text-sm"
                  style={{
                    background: 'rgba(52, 199, 89, 0.08)',
                    color: IOS.success,
                  }}
                >
                  ✓ Champs pré-remplis depuis NHTSA à {decodedAt}. Vérifie et complète.
                </div>
              )}
              <p className="text-[0.7rem] mt-3 italic" style={{ color: IOS.textSubtle }}>
                Source: NHTSA vPIC (US gov, gratuit, sans clé). Couverture variable selon
                constructeur : bonne pour Peugeot / VW / Toyota / BMW vendus mondialement, faible
                pour Renault / Citroën / Dacia (uniquement EU). Si données incomplètes, complète
                manuellement depuis la carte grise du client.
              </p>
            </section>

            {/* Form fields */}
            <section className="mb-8 pb-8 border-b" style={{ borderColor: IOS.border }}>
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-4"
                style={{ color: IOS.textSubtle }}
              >
                Étape 2 · Caractéristiques véhicule
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Marque" value={form.marque} onChange={(v) => set('marque', v)} />
                <Field label="Modèle" value={form.modele} onChange={(v) => set('modele', v)} />
                <Field
                  label="Année"
                  type="number"
                  value={form.annee}
                  onChange={(v) => set('annee', v)}
                />
                <Field label="Énergie" value={form.energie} onChange={(v) => set('energie', v)} />
                <Field
                  label="Cylindrée"
                  value={form.cylindree}
                  onChange={(v) => set('cylindree', v)}
                />
                <Field
                  label="Kilométrage"
                  type="number"
                  value={form.km}
                  onChange={(v) => set('km', v)}
                  placeholder="ex: 42000"
                />
              </div>

              <div className="mt-5">
                <label
                  className="text-xs font-semibold uppercase tracking-wider block mb-2"
                  style={{ color: IOS.textSubtle }}
                >
                  État général
                </label>
                <div className="flex gap-2">
                  {ETATS.map((e) => (
                    <button
                      key={e.val}
                      type="button"
                      onClick={() => set('etat', e.val)}
                      className="px-4 py-2 rounded-full border-2 text-sm font-medium transition-all"
                      style={{
                        borderColor: form.etat === e.val ? e.color : IOS.border,
                        background: form.etat === e.val ? e.color : 'white',
                        color: form.etat === e.val ? 'white' : IOS.text,
                      }}
                    >
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Estimation */}
            <section className="mb-8 pb-8 border-b" style={{ borderColor: IOS.border }}>
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-4"
                style={{ color: IOS.textSubtle }}
              >
                Étape 3 · Estimation
              </p>
              <Field
                label="Prix demandé par le client (€)"
                type="number"
                value={form.prixDemande}
                onChange={(v) => set('prixDemande', v)}
                placeholder="ex: 8500"
              />
              <div className="mt-5">
                <label
                  className="text-xs font-semibold uppercase tracking-wider block mb-2"
                  style={{ color: IOS.textSubtle }}
                >
                  URL Histovec (optionnel)
                </label>
                <input
                  type="url"
                  value={form.histovecUrl}
                  onChange={(e) => set('histovecUrl', e.target.value)}
                  placeholder="https://histovec.interieur.gouv.fr/..."
                  className="w-full px-4 py-3 rounded-xl border text-sm"
                  style={{ background: 'white', borderColor: IOS.border, color: IOS.text }}
                />
                <p className="text-[0.7rem] mt-2 italic" style={{ color: IOS.textSubtle }}>
                  Le client peut générer ce lien depuis{' '}
                  <a
                    href="https://histovec.interieur.gouv.fr/"
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: IOS.blue }}
                    className="underline"
                  >
                    histovec.interieur.gouv.fr
                  </a>{' '}
                  pour prouver l&apos;historique du véhicule (gratuit, officiel).
                </p>
              </div>
              <div className="mt-5">
                <label
                  className="text-xs font-semibold uppercase tracking-wider block mb-2"
                  style={{ color: IOS.textSubtle }}
                >
                  Notes internes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border text-sm"
                  style={{ background: 'white', borderColor: IOS.border, color: IOS.text }}
                  placeholder="Observations, défauts, négociation possible…"
                />
              </div>
            </section>
          </div>

          {/* Recap sidebar */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div
              className="rounded-2xl p-6 border"
              style={{ background: IOS.surface, borderColor: IOS.border }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: IOS.textSubtle }}
              >
                Récapitulatif
              </p>
              <pre
                className="text-xs font-mono p-4 rounded-lg whitespace-pre-wrap break-words mb-4 max-h-[420px] overflow-auto"
                style={{
                  background: '#F5F5F7',
                  color: IOS.text,
                  lineHeight: 1.7,
                }}
              >
                {recapTexte}
              </pre>
              <button
                type="button"
                onClick={copyRecap}
                className="w-full px-4 py-3 rounded-xl text-sm font-semibold text-white"
                style={{ background: copied ? IOS.success : IOS.blue }}
              >
                {copied ? '✓ Copié dans le presse-papier' : 'Copier le récapitulatif'}
              </button>
              <p className="text-[0.7rem] mt-3 italic" style={{ color: IOS.textSubtle }}>
                Colle dans ta note dossier, dans un email au client, ou dans WhatsApp.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: 'text' | 'number';
  placeholder?: string;
}) {
  return (
    <div>
      <label
        className="text-xs font-semibold uppercase tracking-wider block mb-2"
        style={{ color: IOS.textSubtle }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border text-sm"
        style={{ background: 'white', borderColor: IOS.border, color: IOS.text }}
      />
    </div>
  );
}

function generateRecap(form: FormState): string {
  const lines: string[] = ['═══ ESTIMATION REPRISE ═══', ''];
  if (form.marque || form.modele) {
    lines.push(`Véhicule  : ${[form.marque, form.modele].filter(Boolean).join(' ')}`);
  }
  if (form.annee) lines.push(`Année     : ${form.annee}`);
  if (form.km) lines.push(`Km        : ${Number(form.km).toLocaleString('fr-FR')} km`);
  if (form.energie) lines.push(`Énergie   : ${form.energie}`);
  if (form.cylindree) lines.push(`Cylindrée : ${form.cylindree}`);
  if (form.vin) lines.push(`VIN       : ${form.vin}`);
  const etat = ETATS.find((e) => e.val === form.etat);
  lines.push(`État      : ${etat?.label ?? form.etat}`);
  if (form.prixDemande) {
    lines.push(`Prix client : ${Number(form.prixDemande).toLocaleString('fr-FR')} €`);
  }
  if (form.histovecUrl) {
    lines.push('', `Histovec  : ${form.histovecUrl}`);
  }
  if (form.notes.trim()) {
    lines.push('', '── Notes ──', form.notes.trim());
  }
  lines.push('', `Généré le ${new Date().toLocaleString('fr-FR')}`);
  return lines.join('\n');
}
