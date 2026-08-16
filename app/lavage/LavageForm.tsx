'use client';

import { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { CpRgpdNotice } from '@/components/cp/CpRgpdNotice';
import { formatPrice } from '@/lib/utils';
import { CRENEAUX_LAVAGE, niveauRemplissage, prochainCreneau } from '@/lib/lavage-creneaux';
import { submitLavage } from './actions';

import type { PrisParDate } from '@/lib/lavage-creneaux';
import type { LavageTarif } from '@/lib/lavage-settings';

type FormData = {
  prenom: string;
  nom: string;
  email: string;
  tel: string;
  marque: string;
  modele: string;
  formule: string;
  gabarit: string;
  date: string;
  creneau: string;
  message: string;
};

export type LavageFormFormule = { nom: string; tarifs: LavageTarif[] };

// Libellés de jour — T12:00 neutralise le fuseau sur la conversion.
const JOUR_COURT = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' });
const JOUR_LONG = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});
const midi = (date: string) => new Date(`${date}T12:00:00`);

const EMPTY: FormData = {
  prenom: '',
  nom: '',
  email: '',
  tel: '',
  marque: '',
  modele: '',
  formule: '',
  gabarit: '',
  date: '',
  creneau: '',
  message: '',
};

const field =
  'w-full px-4 py-3 rounded-xl border border-[#E5DDD3] bg-white text-cp-ink placeholder:text-cp-ink/30 text-sm outline-none transition-all focus:border-cp-red focus:ring-2 focus:ring-cp-mango/10';
const label = 'block text-xs font-semibold text-cp-ink/50 uppercase tracking-wider mb-1.5';

export function LavageForm({
  formules,
  dates,
  initialPris,
  feries = {},
  initialFormule = '',
}: {
  formules: LavageFormFormule[];
  /** Horizon du sélecteur (YYYY-MM-DD, ordre chronologique). */
  dates: string[];
  /** Créneaux pris par date, rendus côté serveur — zéro fetch au premier affichage. */
  initialPris: PrisParDate;
  /** Jours fériés de l'horizon (date → libellé) — indication, pas blocage. */
  feries?: Record<string, string>;
  initialFormule?: string;
}) {
  const [website, setWebsite] = useState(''); // honeypot anti-spam
  const [done, setDone] = useState(false);
  const [ref, setRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [emailed, setEmailed] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [data, setData] = useState<FormData>({ ...EMPTY, formule: initialFormule });

  const set = (k: keyof FormData, v: string) => {
    setData((d) => ({ ...d, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  // Créneaux pris par date. Servis par le serveur au premier rendu, rafraîchis
  // au retour d'onglet. Fail-open : si la lecture échoue, tout reste
  // sélectionnable — le serveur re-vérifie au submit.
  const [pris, setPris] = useState<PrisParDate>(initialPris);
  const prisDe = (d: string) => pris[d] ?? [];

  const refreshDispos = () => {
    fetch(`/api/lavage/disponibilites?from=${dates[0]}&to=${dates[dates.length - 1]}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { dispos?: PrisParDate } | null) => {
        if (j?.dispos) setPris(j.dispos);
      })
      .catch(() => {
        /* fail-open — le submit serveur reste la garde */
      });
  };

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshDispos();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choisir = (date: string, creneau: string) => {
    setData((d) => ({ ...d, date, creneau }));
    setErrors((e) => ({ ...e, date: undefined, creneau: undefined }));
  };

  const prochain = prochainCreneau(dates, pris);

  // Tarifs de la formule choisie — plus d'un tarif → le gabarit est requis
  // (le prix en dépend : Citadine / Gamme B / SUV, gamme Stéphane 2026-08-16).
  const tarifsChoisis = formules.find((f) => f.nom === data.formule)?.tarifs ?? [];

  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (!data.prenom.trim()) errs.prenom = 'Prénom requis';
    if (!data.nom.trim()) errs.nom = 'Nom requis';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errs.email = 'Email invalide';
    if (!/^[0-9\s\+]{8,}$/.test(data.tel)) errs.tel = 'Numéro invalide';
    if (!data.formule) errs.formule = 'Choisissez une formule';
    if (tarifsChoisis.length > 1 && !data.gabarit) errs.gabarit = 'Choisissez le type de véhicule';
    if (!data.date) errs.date = 'Choisissez un jour';
    if (!data.creneau) errs.creneau = 'Choisissez un créneau';
    else if (data.date && prisDe(data.date).includes(data.creneau))
      errs.creneau = 'Ce créneau vient d’être pris — choisissez-en un autre';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);
    const res = await submitLavage({ ...data, website });
    setSubmitting(false);
    if (!res.ok) {
      setSubmitError(res.error);
      // Collision probable → re-synchroniser les disponibilités affichées.
      refreshDispos();
      return;
    }
    setRef(res.ref);
    setEmailed(res.emailed);
    setDone(true);
  };

  const err = (k: keyof FormData) =>
    errors[k] ? <p className="text-[0.75rem] text-red-500 mt-1">{errors[k]}</p> : null;

  if (done) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5DDD3] p-10 text-center">
        <div className="w-16 h-16 rounded-full bg-[#52C88A]/15 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="text-[#52C88A]" size={32} strokeWidth={1.5} />
        </div>
        <p className="cp-mono text-xs text-cp-ink/35 tracking-widest uppercase mb-2">
          Demande envoyée
        </p>
        <h3 className="cp-title font-black text-cp-ink text-3xl mb-3">DEMANDE REÇUE</h3>
        <p className="text-cp-ink/55 text-sm leading-relaxed mb-6">
          Votre demande a bien été enregistrée. Notre équipe vous contacte sous 24 h en jours ouvrés
          pour confirmer le créneau.
        </p>
        <div className="bg-[#F8F5F0] rounded-xl px-6 py-4 mb-6">
          <p className="text-xs text-cp-ink/40 mb-1">Référence de votre demande</p>
          <p className="cp-mono font-medium text-cp-ink text-lg tracking-wider">{ref}</p>
        </div>
        <p className="text-xs text-cp-ink/40">
          {emailed ? (
            <>
              Un email de confirmation a été envoyé à <strong>{data.email}</strong>.
            </>
          ) : (
            <>
              Nous vous recontactons sous 24 h (jours ouvrés) au <strong>{data.tel}</strong>.
            </>
          )}
        </p>
        <button
          onClick={() => {
            setDone(false);
            setData({ ...EMPTY });
          }}
          className="mt-8 text-sm text-cp-mango hover:underline"
        >
          Faire une nouvelle demande
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#E5DDD3] p-8">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="lav-prenom" className={label}>
              Prénom *
            </label>
            <input
              id="lav-prenom"
              className={field}
              autoComplete="given-name"
              value={data.prenom}
              onChange={(e) => set('prenom', e.target.value)}
            />
            {err('prenom')}
          </div>
          <div>
            <label htmlFor="lav-nom" className={label}>
              Nom *
            </label>
            <input
              id="lav-nom"
              className={field}
              autoComplete="family-name"
              value={data.nom}
              onChange={(e) => set('nom', e.target.value)}
            />
            {err('nom')}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="lav-email" className={label}>
              Email *
            </label>
            <input
              id="lav-email"
              className={field}
              type="email"
              autoComplete="email"
              value={data.email}
              onChange={(e) => set('email', e.target.value)}
            />
            {err('email')}
          </div>
          <div>
            <label htmlFor="lav-tel" className={label}>
              Téléphone *
            </label>
            <input
              id="lav-tel"
              className={field}
              type="tel"
              autoComplete="tel"
              placeholder="0690 …"
              value={data.tel}
              onChange={(e) => set('tel', e.target.value)}
            />
            {err('tel')}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="lav-marque" className={label}>
              Marque
            </label>
            <input
              id="lav-marque"
              className={field}
              placeholder="Peugeot"
              value={data.marque}
              onChange={(e) => set('marque', e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="lav-modele" className={label}>
              Modèle
            </label>
            <input
              id="lav-modele"
              className={field}
              placeholder="308"
              value={data.modele}
              onChange={(e) => set('modele', e.target.value)}
            />
          </div>
        </div>
        <div>
          <p className={label}>Formule *</p>
          <div className="flex flex-wrap gap-2">
            {formules.map((f) => (
              <button
                key={f.nom}
                type="button"
                onClick={() => {
                  // Changer de formule réinitialise le gabarit — les tarifs
                  // ne se correspondent pas d'une formule à l'autre.
                  setData((d) => ({ ...d, formule: f.nom, gabarit: '' }));
                  setErrors((e) => ({ ...e, formule: undefined, gabarit: undefined }));
                }}
                className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${data.formule === f.nom ? 'bg-cp-ink border-cp-ink text-cp-cream' : 'border-[#E5DDD3] text-cp-ink/60 hover:border-cp-red hover:text-cp-mango'}`}
              >
                {f.nom}
              </button>
            ))}
          </div>
          {err('formule')}
        </div>
        {tarifsChoisis.length > 1 && (
          <div>
            <p className={label}>Type de véhicule *</p>
            <div className="flex flex-wrap gap-2">
              {tarifsChoisis.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => set('gabarit', t.label)}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${data.gabarit === t.label ? 'bg-cp-ink border-cp-ink text-cp-cream' : 'border-[#E5DDD3] text-cp-ink/60 hover:border-cp-red hover:text-cp-mango'}`}
                >
                  {t.label} · {formatPrice(t.prixTTCEnCents)}
                </button>
              ))}
            </div>
            {err('gabarit')}
          </div>
        )}
        {/* ── Sélecteur Pit Lane (spec 2026-08-16) ────────────────── */}
        {prochain && (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-cp-ink px-4 py-3">
            <div>
              <p className="text-[0.65rem] uppercase tracking-widest text-cp-cream/50">
                Prochain créneau
              </p>
              <p className="cp-mono text-sm text-cp-cream">
                {JOUR_LONG.format(midi(prochain.date))} · {prochain.creneau}
              </p>
            </div>
            <button
              type="button"
              onClick={() => choisir(prochain.date, prochain.creneau)}
              className="flex-shrink-0 text-sm font-bold text-cp-mango hover:underline"
            >
              Choisir →
            </button>
          </div>
        )}

        <div>
          <p className={label}>Jour *</p>
          <div
            className="flex gap-2 overflow-x-auto pb-1"
            role="group"
            aria-label="Choisir un jour"
          >
            {dates.map((d) => {
              const n = prisDe(d).length;
              const complet = n >= CRENEAUX_LAVAGE.length;
              const niveau = niveauRemplissage(n);
              const sel = data.date === d;
              return (
                <button
                  key={d}
                  type="button"
                  disabled={complet}
                  aria-pressed={sel}
                  title={feries[d]}
                  aria-label={`${JOUR_LONG.format(midi(d))}${feries[d] ? ` (férié : ${feries[d]})` : ''}, ${
                    complet ? 'complet' : `${CRENEAUX_LAVAGE.length - n} créneaux libres`
                  }`}
                  onClick={() => {
                    setData((s) => ({ ...s, date: d, creneau: '' }));
                    setErrors((e) => ({ ...e, date: undefined, creneau: undefined }));
                  }}
                  className={`w-16 flex-shrink-0 rounded-xl border px-2 py-2 text-center transition-all ${
                    sel
                      ? 'border-cp-ink bg-cp-ink text-cp-cream'
                      : complet
                        ? 'border-[#E5DDD3] opacity-50'
                        : 'border-[#E5DDD3] text-cp-ink hover:border-cp-red'
                  }`}
                >
                  <span className="block text-[0.6rem] uppercase tracking-wider opacity-60">
                    {JOUR_COURT.format(midi(d))}
                    {/* Férié : point mangue — l'info complète vit dans title/aria-label */}
                    {feries[d] && (
                      <span aria-hidden="true" className="ml-0.5 text-cp-mango">
                        ●
                      </span>
                    )}
                  </span>
                  <span className="cp-mono block text-base font-bold">{d.slice(8)}</span>
                  {/* Jauge : piste blanche, avancement vert → orange → rouge */}
                  <span
                    aria-hidden="true"
                    className="mt-1 block h-1.5 overflow-hidden rounded-full border border-[#E5DDD3] bg-white"
                  >
                    <span
                      className={`block h-full ${
                        niveau === 'rouge'
                          ? 'bg-cp-red'
                          : niveau === 'orange'
                            ? 'bg-cp-mango'
                            : 'bg-cp-vert-l'
                      }`}
                      style={{ width: `${(n / CRENEAUX_LAVAGE.length) * 100}%` }}
                    />
                  </span>
                </button>
              );
            })}
          </div>
          {err('date')}
        </div>

        {data.date && (
          <div>
            <p className={label}>Créneau *</p>
            <div
              className="grid grid-cols-2 gap-2"
              role="group"
              aria-label={`Choisir un créneau le ${JOUR_LONG.format(midi(data.date))}`}
            >
              {CRENEAUX_LAVAGE.map((c) => {
                const off = prisDe(data.date).includes(c);
                const sel = data.creneau === c;
                return (
                  <button
                    key={c}
                    type="button"
                    disabled={off}
                    aria-pressed={sel}
                    aria-label={off ? `${c} — pris` : c}
                    onClick={() => set('creneau', c)}
                    className={`cp-mono rounded-lg border px-3 py-2.5 text-sm transition-all ${
                      sel
                        ? 'border-cp-vert bg-cp-vert font-bold text-white shadow-[inset_0_0_0_2px_rgba(255,255,255,0.35)]'
                        : off
                          ? 'border-[#E5DDD3] text-cp-ink/35 line-through'
                          : 'border-cp-lagon bg-cp-lagon-l text-cp-ink shadow-[inset_0_0_0_2px_#FFFFFF] hover:border-cp-red'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
            {err('creneau')}
          </div>
        )}

        {/* ── Ticket d'atelier : récap noir, construit en direct ───── */}
        {data.formule && (
          <div className="cp-mono rounded-xl border border-dashed border-cp-cream/40 bg-cp-ink px-5 py-4 text-sm text-cp-cream">
            <div className="flex justify-between gap-3">
              <span className="font-bold uppercase">{data.formule}</span>
              <span>
                {tarifsChoisis.length > 1 ? data.gabarit || '—' : tarifsChoisis[0]?.label}
              </span>
            </div>
            <div className="mt-1 flex justify-between gap-3 text-cp-cream/70">
              <span>{data.date ? JOUR_LONG.format(midi(data.date)) : '—'}</span>
              <span>{data.creneau || '—'}</span>
            </div>
            <div className="mt-3 flex justify-between gap-3 border-t border-cp-cream/30 pt-3 font-bold">
              <span>TOTAL TTC</span>
              <span className="text-cp-mango">
                {(() => {
                  const t =
                    tarifsChoisis.length === 1
                      ? tarifsChoisis[0]
                      : tarifsChoisis.find((x) => x.label === data.gabarit);
                  return t ? formatPrice(t.prixTTCEnCents) : 'Sur devis';
                })()}
              </span>
            </div>
          </div>
        )}
        <div>
          <label htmlFor="lav-message" className={label}>
            Précisions (facultatif)
          </label>
          <textarea
            id="lav-message"
            className={`${field} resize-none`}
            rows={3}
            placeholder="État du véhicule, demandes particulières…"
            value={data.message}
            onChange={(e) => set('message', e.target.value)}
          />
        </div>

        {/* Honeypot anti-spam : invisible pour un humain, rempli par les bots. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }}
        />

        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="w-full py-3.5 rounded-xl bg-cp-ink text-cp-cream text-sm font-bold hover:bg-cp-red transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? 'Envoi…' : 'Demander mon créneau'}
        </button>
        {submitError && (
          <p role="alert" className="text-sm text-red-600 text-center">
            {submitError}
          </p>
        )}
        <CpRgpdNotice />
      </div>
    </div>
  );
}
