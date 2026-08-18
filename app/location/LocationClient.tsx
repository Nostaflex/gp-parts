'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import type { LocationCar } from '@/lib/location-cars';
import type { LocationSettings } from '@/lib/location-settings';
import { LLD_SEUIL_JOURS } from '@/lib/reservations';
import { formatPrice, localDateISO } from '@/lib/utils';
import { CpRgpdNotice } from '@/components/cp/CpRgpdNotice';
import { CpMarketingOptIn } from '@/components/cp/CpMarketingOptIn';
import { checkDispo, submitDevisLLD } from './actions';
import { PitLaneBooking } from './PitLaneBooking';

type Categorie = 'Toutes' | 'Citadine' | 'Berline' | 'SUV' | 'Utilitaire';

const CATEGORIES: Categorie[] = ['Toutes', 'Citadine', 'Berline', 'SUV', 'Utilitaire'];

const field =
  'w-full px-4 py-3 rounded-xl border border-[#E5DDD3] bg-white text-cp-ink placeholder:text-cp-ink/30 text-sm outline-none transition-all focus:border-cp-red focus:ring-2 focus:ring-cp-mango/10';
const lbl = 'block text-xs font-semibold text-cp-ink/50 uppercase tracking-wider mb-1.5';

function calcNbJours(depart: string, retour: string): number {
  if (!depart || !retour) return 0;
  const d1 = new Date(depart);
  const d2 = new Date(retour);
  const diff = Math.ceil((d2.getTime() - d1.getTime()) / 86400000);
  return diff > 0 ? diff : 0;
}

export function LocationClient({
  cars,
  settings,
}: {
  cars: LocationCar[];
  settings: LocationSettings;
}) {
  const VEHICULES = cars;
  const [categorie, setCategorie] = useState<Categorie>('Toutes');
  const [dateDepart, setDateDepart] = useState('');
  const [dateRetour, setDateRetour] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const formSectionRef = useRef<HTMLDivElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [unavailableIds, setUnavailableIds] = useState<string[]>([]);
  const [showDevisLLD, setShowDevisLLD] = useState(false);

  // Dates choisies → pré-filtre dispo (best-effort ; la garde finale est serveur)
  useEffect(() => {
    if (!dateDepart || !dateRetour || dateRetour < dateDepart) {
      setUnavailableIds([]);
      return;
    }
    let cancelled = false;
    checkDispo(dateDepart, dateRetour).then(({ unavailableIds: ids }) => {
      if (!cancelled) setUnavailableIds(ids);
    });
    return () => {
      cancelled = true;
    };
  }, [dateDepart, dateRetour]);

  const vehiculesFiltres = useMemo(
    () => VEHICULES.filter((v) => categorie === 'Toutes' || v.categorie === categorie),
    [VEHICULES, categorie]
  );

  const nbJoursRecherche = calcNbJours(dateDepart, dateRetour);

  const openReservation = (id: string) => {
    setSelectedId(id);
    setShowForm(true);
    // Le Pit Lane est rendu en bas de page (après le catalogue) : sans ce
    // scroll, le clic « Réserver » paraît sans effet. requestAnimationFrame
    // laisse React peindre la section avant de scroller.
    requestAnimationFrame(() => {
      formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <>
      {/* ── SEARCH ─────────────────────────── */}
      <section className="px-6 py-16 pt-32" style={{ backgroundColor: '#F4EDE0' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <p className="cp-mono text-cp-mango text-xs tracking-widest uppercase mb-3">
              Nos véhicules
            </p>
            <h2
              className="cp-title font-black text-cp-ink leading-none"
              style={{ fontSize: 'clamp(2.5rem,4vw,3.5rem)' }}
            >
              Trouvez votre <em className="text-cp-mango not-italic">véhicule</em>
            </h2>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5DDD3] shadow-[0_8px_40px_rgba(26,15,6,0.08)] p-6 max-w-3xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-semibold text-cp-ink/70 mb-1.5">
                  Date de départ
                </label>
                <input
                  type="date"
                  className={field}
                  min={localDateISO(1)}
                  value={dateDepart}
                  onChange={(e) => setDateDepart(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-cp-ink/70 mb-1.5">
                  Date de retour
                </label>
                <input
                  type="date"
                  className={field}
                  min={dateDepart || localDateISO(2)}
                  value={dateRetour}
                  onChange={(e) => setDateRetour(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-cp-ink/70 mb-1.5">
                  Catégorie
                </label>
                <select
                  className={field}
                  value={categorie}
                  onChange={(e) => setCategorie(e.target.value as Categorie)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c === 'Toutes' ? 'Toutes catégories' : c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CATALOGUE ──────────────────────── */}
      <section className="px-6 pb-24" style={{ backgroundColor: '#F4EDE0' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <p className="cp-mono text-xs text-cp-ink/40 tracking-wider">
              {vehiculesFiltres.length} véhicule{vehiculesFiltres.length > 1 ? 's' : ''} disponible
              {vehiculesFiltres.length > 1 ? 's' : ''}
            </p>
            <div className="flex gap-2">
              {CATEGORIES.filter((c) => c !== 'Toutes').map((c) => (
                <button
                  key={c}
                  onClick={() => setCategorie(c)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${categorie === c ? 'bg-cp-ink border-cp-ink text-cp-cream' : 'border-[#E5DDD3] text-cp-ink/50 hover:border-cp-red hover:text-cp-mango'}`}
                >
                  {c}
                </button>
              ))}
              {categorie !== 'Toutes' && (
                <button
                  onClick={() => setCategorie('Toutes')}
                  className="text-xs px-3 py-1.5 rounded-full border border-[#E5DDD3] text-cp-ink/40 hover:border-cp-red hover:text-cp-mango transition-all"
                >
                  Tout
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehiculesFiltres.map((v) => (
              <div
                key={v.id}
                className="bg-white rounded-2xl border border-[#E5DDD3] overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_60px_rgba(26,15,6,0.10)]"
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden bg-[#F8F5F0]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={v.image}
                    alt={`${v.marque} ${v.modele}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span
                    className={`absolute top-3 left-3 text-white text-[0.65rem] cp-mono px-3 py-1 rounded-full ${
                      unavailableIds.includes(v.id)
                        ? 'bg-[#B85450]/90'
                        : v.disponible
                          ? 'bg-[#7A9B76]/90'
                          : 'bg-[#D4A24C]/90'
                    }`}
                  >
                    {unavailableIds.includes(v.id)
                      ? 'Indisponible à ces dates'
                      : v.disponible
                        ? 'Disponible'
                        : 'Stock limité'}
                  </span>
                  <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-[#1A0F06]/85 to-transparent">
                    <p className="cp-title text-[0.75rem] font-bold text-[#E9C46A] tracking-widest uppercase">
                      {v.marque}
                    </p>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5">
                  <p className="cp-title font-black text-cp-ink text-xl mb-2">{v.modele}</p>
                  <div className="flex flex-wrap gap-3 mb-4">
                    {[
                      { icon: '👤', val: `${v.places} places` },
                      { icon: '⚙️', val: v.transmission },
                      { icon: '⛽', val: v.carburant },
                    ].map((s) => (
                      <span
                        key={s.val}
                        className="cp-mono text-[0.65rem] text-cp-ink/50 tracking-wide flex items-center gap-1"
                      >
                        {s.val}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-end justify-between pt-4 border-t border-[#F8F5F0]">
                    <div>
                      <p className="cp-title font-black text-cp-mango text-2xl leading-none">
                        {formatPrice(v.prixJourEnCents)}
                        <span className="text-sm font-normal text-cp-ink/40">/jour</span>
                      </p>
                      <p className="text-xs text-cp-ink/35 mt-0.5">
                        {formatPrice(v.prixSemaineEnCents)}/semaine
                      </p>
                    </div>
                    <button
                      onClick={() => openReservation(v.id)}
                      disabled={unavailableIds.includes(v.id)}
                      className="px-4 py-2 rounded-xl bg-cp-red/10 border border-cp-red/20 text-cp-mango text-sm font-semibold hover:bg-cp-red/20 hover:border-cp-red/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-cp-red/10 disabled:hover:border-cp-red/20"
                    >
                      Réserver
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEVIS LONGUE DURÉE (≥ 30 j) ────── */}
      {showDevisLLD && (
        <DevisLLDSection
          onClose={() => setShowDevisLLD(false)}
          dureeInitialeMois={
            nbJoursRecherche >= LLD_SEUIL_JOURS ? String(Math.round(nbJoursRecherche / 30)) : ''
          }
        />
      )}

      {/* ── PIT LANE — parcours de réservation 3 étapes (handoff §4) ── */}
      {showForm && selectedId && !showDevisLLD && (
        // scroll-mt : le header fixe recouvre ~70 px, l'ancre compense.
        <div ref={formSectionRef} className="scroll-mt-[70px]">
          <PitLaneBooking
            key={selectedId}
            cars={VEHICULES}
            settings={settings}
            initialVehiculeId={selectedId}
            initialDateDepart={dateDepart || undefined}
            initialDateRetour={dateRetour || undefined}
            onClose={() => {
              setShowForm(false);
              setSelectedId(null);
            }}
            onDevisLLD={() => setShowDevisLLD(true)}
          />
        </div>
      )}
    </>
  );
}

/** Devis longue durée (≥ 30 jours) — décision 2026-07-31 : devis en ligne,
 * contrat LLD signé en agence. La demande arrive dans la boîte Demandes BO. */
function DevisLLDSection({
  onClose,
  dureeInitialeMois,
}: {
  onClose: () => void;
  dureeInitialeMois: string;
}) {
  const [data, setData] = useState({
    dureeMois: dureeInitialeMois,
    kmParMois: '',
    categorie: '',
    budgetMensuel: '',
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    consent: false,
  });
  const [website, setWebsite] = useState('');
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);

  const set = (k: keyof typeof data, v: string | boolean) => {
    setData((d) => ({ ...d, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const submit = async () => {
    if (sending) return;
    setSending(true);
    const res = await submitDevisLLD({ ...data, marketingOptIn, website });
    setSending(false);
    if (!res.success) {
      setErrors(res.errors);
      return;
    }
    setDone(true);
  };

  const e = (k: string) =>
    errors[k] ? <p className="text-[0.75rem] text-red-500 mt-1">{errors[k]}</p> : null;

  return (
    <section className="py-16 px-6" style={{ backgroundColor: '#F4EDE0' }}>
      <div className="max-w-xl mx-auto bg-white rounded-2xl border border-[#E5DDD3] p-8">
        {done ? (
          <div className="text-center">
            <CheckCircle className="text-[#52C88A] mx-auto mb-4" size={36} strokeWidth={1.5} />
            <p className="cp-title font-black text-cp-ink text-2xl mb-2">DEMANDE ENVOYÉE</p>
            <p className="text-sm text-cp-ink/55 leading-relaxed">
              Nous préparons votre devis longue durée et revenons vers vous sous 48 h (jours
              ouvrés).
            </p>
            <button onClick={onClose} className="mt-6 text-sm text-cp-mango hover:underline">
              Fermer
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <p className="cp-mono text-[0.65rem] text-[#C8A040] uppercase tracking-widest mb-1">
                Longue durée · 30 jours et plus
              </p>
              <p className="cp-title font-black text-cp-ink text-xl">Devis personnalisé</p>
              <p className="text-xs text-cp-ink/40 mt-1">
                Tarif dégressif, contrat adapté, réponse sous 48 h. Le contrat longue durée est
                établi et signé à l&apos;agence.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="lld-duree" className={lbl}>
                  Durée (mois) *
                </label>
                <input
                  id="lld-duree"
                  className={field}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={data.dureeMois}
                  onChange={(ev) => set('dureeMois', ev.target.value)}
                />
                {e('dureeMois')}
              </div>
              <div>
                <label htmlFor="lld-km" className={lbl}>
                  Km / mois (estimé)
                </label>
                <input
                  id="lld-km"
                  className={field}
                  type="number"
                  inputMode="numeric"
                  value={data.kmParMois}
                  onChange={(ev) => set('kmParMois', ev.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="lld-cat" className={lbl}>
                  Catégorie
                </label>
                <select
                  id="lld-cat"
                  className={field}
                  value={data.categorie}
                  onChange={(ev) => set('categorie', ev.target.value)}
                >
                  <option value="">Indifférent</option>
                  {CATEGORIES.filter((c) => c !== 'Toutes').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="lld-budget" className={lbl}>
                  Budget (€ / mois)
                </label>
                <input
                  id="lld-budget"
                  className={field}
                  type="number"
                  inputMode="decimal"
                  value={data.budgetMensuel}
                  onChange={(ev) => set('budgetMensuel', ev.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="lld-prenom" className={lbl}>
                  Prénom *
                </label>
                <input
                  id="lld-prenom"
                  className={field}
                  type="text"
                  autoComplete="given-name"
                  value={data.prenom}
                  onChange={(ev) => set('prenom', ev.target.value)}
                />
                {e('prenom')}
              </div>
              <div>
                <label htmlFor="lld-nom" className={lbl}>
                  Nom *
                </label>
                <input
                  id="lld-nom"
                  className={field}
                  type="text"
                  autoComplete="family-name"
                  value={data.nom}
                  onChange={(ev) => set('nom', ev.target.value)}
                />
                {e('nom')}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="lld-email" className={lbl}>
                  Email *
                </label>
                <input
                  id="lld-email"
                  className={field}
                  type="email"
                  autoComplete="email"
                  value={data.email}
                  onChange={(ev) => set('email', ev.target.value)}
                />
                {e('email')}
              </div>
              <div>
                <label htmlFor="lld-tel" className={lbl}>
                  Téléphone *
                </label>
                <input
                  id="lld-tel"
                  className={field}
                  type="tel"
                  autoComplete="tel"
                  value={data.telephone}
                  onChange={(ev) => set('telephone', ev.target.value)}
                />
                {e('telephone')}
              </div>
            </div>
            {/* Honeypot anti-spam */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={website}
              onChange={(ev) => setWebsite(ev.target.value)}
              style={{
                position: 'absolute',
                left: '-9999px',
                width: '1px',
                height: '1px',
                opacity: 0,
              }}
            />
            <div className="flex items-start gap-3">
              <input
                id="lld-consent"
                type="checkbox"
                checked={data.consent}
                onChange={(ev) => set('consent', ev.target.checked)}
                className="w-4 h-4 accent-cp-mango cursor-pointer mt-0.5 flex-shrink-0"
              />
              <label
                htmlFor="lld-consent"
                className="text-xs text-cp-ink/60 leading-relaxed cursor-pointer"
              >
                J&apos;accepte que mes données soient utilisées pour établir ce devis.
              </label>
            </div>
            {e('consent')}
            <CpMarketingOptIn checked={marketingOptIn} onChange={setMarketingOptIn} />
            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="text-sm font-medium text-cp-ink/50 hover:text-cp-ink transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={sending}
                className="flex-1 py-3 rounded-xl bg-cp-ink text-cp-cream text-sm font-semibold hover:bg-cp-red transition-colors disabled:opacity-60"
              >
                {sending ? 'Envoi…' : 'Demander mon devis'}
              </button>
            </div>
            <CpRgpdNotice className="mt-4" />
          </div>
        )}
      </div>
    </section>
  );
}
