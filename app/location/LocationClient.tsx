'use client';

import { useState, useMemo } from 'react';
import { CheckCircle } from 'lucide-react';

type Categorie = 'Toutes' | 'Citadine' | 'Berline' | 'SUV' | 'Utilitaire';
type Step = 0 | 1 | 2;

type ReservationData = {
  vehiculeId: string;
  dateDepart: string;
  dateRetour: string;
  prenom: string;
  nom: string;
  email: string;
  tel: string;
  permis: string;
  consent: boolean;
};

const VEHICULES = [
  {
    id: 'clio-v',
    marque: 'Renault',
    modele: 'Clio V',
    categorie: 'Citadine' as Categorie,
    places: 5,
    transmission: 'Auto',
    carburant: 'Essence',
    prixJour: 45,
    prixSemaine: 270,
    dispo: true,
    image: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=600&q=80&fit=crop',
  },
  {
    id: 'peugeot-308sw',
    marque: 'Peugeot',
    modele: '308 SW',
    categorie: 'Berline' as Categorie,
    places: 5,
    transmission: 'Auto',
    carburant: 'Diesel',
    prixJour: 65,
    prixSemaine: 390,
    dispo: true,
    image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&q=80&fit=crop',
  },
  {
    id: 'citroen-c5',
    marque: 'Citroën',
    modele: 'C5 Aircross',
    categorie: 'SUV' as Categorie,
    places: 5,
    transmission: 'Auto',
    carburant: 'Hybride',
    prixJour: 80,
    prixSemaine: 480,
    dispo: true,
    image: 'https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600&q=80&fit=crop',
  },
  {
    id: 'toyota-yaris',
    marque: 'Toyota',
    modele: 'Yaris Hybride',
    categorie: 'Citadine' as Categorie,
    places: 5,
    transmission: 'Auto',
    carburant: 'Hybride',
    prixJour: 52,
    prixSemaine: 312,
    dispo: true,
    image: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=600&q=80&fit=crop',
  },
  {
    id: 'vw-golf',
    marque: 'Volkswagen',
    modele: 'Golf VIII',
    categorie: 'Berline' as Categorie,
    places: 5,
    transmission: 'Auto',
    carburant: 'Essence',
    prixJour: 72,
    prixSemaine: 432,
    dispo: true,
    image: 'https://images.unsplash.com/photo-1471444928139-48c5bf5173f8?w=600&q=80&fit=crop',
  },
  {
    id: 'renault-trafic',
    marque: 'Renault',
    modele: 'Trafic',
    categorie: 'Utilitaire' as Categorie,
    places: 9,
    transmission: 'Manuelle',
    carburant: 'Diesel',
    prixJour: 95,
    prixSemaine: 570,
    dispo: false,
    image: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=600&q=80&fit=crop',
  },
];

const CATEGORIES: Categorie[] = ['Toutes', 'Citadine', 'Berline', 'SUV', 'Utilitaire'];

const field =
  'w-full px-4 py-3 rounded-xl border border-[#E5DDD3] bg-white text-cp-ink placeholder:text-cp-ink/30 text-sm outline-none transition-all focus:border-cp-mango focus:ring-2 focus:ring-cp-mango/10';
const lbl = 'block text-xs font-semibold text-cp-ink/50 uppercase tracking-wider mb-1.5';

function generateRef() {
  return `LOC-CP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function calcNbJours(depart: string, retour: string): number {
  if (!depart || !retour) return 0;
  const d1 = new Date(depart);
  const d2 = new Date(retour);
  const diff = Math.ceil((d2.getTime() - d1.getTime()) / 86400000);
  return diff > 0 ? diff : 0;
}

export function LocationClient() {
  const [categorie, setCategorie] = useState<Categorie>('Toutes');
  const [dateDepart, setDateDepart] = useState('');
  const [dateRetour, setDateRetour] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState<Step>(0);
  const [done, setDone] = useState(false);
  const [ref, setRef] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof ReservationData, string>>>({});
  const [formData, setFormData] = useState<ReservationData>({
    vehiculeId: '',
    dateDepart: '',
    dateRetour: '',
    prenom: '',
    nom: '',
    email: '',
    tel: '',
    permis: '',
    consent: false,
  });

  const vehiculesFiltres = useMemo(
    () => VEHICULES.filter((v) => categorie === 'Toutes' || v.categorie === categorie),
    [categorie]
  );

  const vehiculeSelectionne = VEHICULES.find((v) => v.id === selectedId);
  const nbJours = calcNbJours(formData.dateDepart || dateDepart, formData.dateRetour || dateRetour);
  const prixTotal = vehiculeSelectionne ? vehiculeSelectionne.prixJour * nbJours : 0;

  const setForm = <K extends keyof ReservationData>(k: K, v: ReservationData[K]) => {
    setFormData((d) => ({ ...d, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const openReservation = (id: string) => {
    setSelectedId(id);
    setFormData((d) => ({ ...d, vehiculeId: id, dateDepart, dateRetour }));
    setShowForm(true);
    setStep(0);
  };

  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (step === 0) {
      if (!formData.dateDepart) errs.dateDepart = 'Date de départ requise';
      if (!formData.dateRetour) errs.dateRetour = 'Date de retour requise';
      else if (calcNbJours(formData.dateDepart, formData.dateRetour) <= 0)
        errs.dateRetour = 'Date de retour invalide';
    }
    if (step === 1) {
      if (!formData.prenom.trim()) errs.prenom = 'Prénom requis';
      if (!formData.nom.trim()) errs.nom = 'Nom requis';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = 'Email invalide';
      if (!/^[0-9\s\+]{8,}$/.test(formData.tel)) errs.tel = 'Numéro invalide';
      if (!formData.permis.trim()) errs.permis = 'N° de permis requis';
    }
    if (step === 2) {
      if (!formData.consent) errs.consent = 'Consentement requis';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => {
    if (!validate()) return;
    if (step === 2) {
      setRef(generateRef());
      setDone(true);
      return;
    }
    setStep((s) => (s + 1) as Step);
  };

  const err = (k: keyof ReservationData) =>
    errors[k] ? <p className="text-[0.75rem] text-red-500 mt-1">{errors[k]}</p> : null;

  if (done) {
    return (
      <section className="py-24 px-6" style={{ backgroundColor: '#F4EDE0' }}>
        <div className="max-w-xl mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-[#E9C46A]/15 border-2 border-[#E9C46A]/25 flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="text-[#C8A040]" size={36} strokeWidth={1.5} />
          </div>
          <p className="cp-mono text-xs text-cp-mango tracking-widest uppercase mb-3">
            Réservation confirmée
          </p>
          <h2
            className="cp-title font-black text-cp-ink leading-none mb-4"
            style={{ fontSize: 'clamp(2.5rem,5vw,4.5rem)' }}
          >
            VOTRE VÉHICULE
            <br />
            <em className="text-cp-mango not-italic">EST RÉSERVÉ</em>
          </h2>
          <p className="text-cp-ink/55 text-base leading-relaxed mb-8 max-w-md mx-auto">
            Votre réservation a bien été enregistrée. Nous vous contactons sous 2h pour confirmer
            les modalités de remise.
          </p>
          <div className="bg-white rounded-2xl border border-[#E5DDD3] p-6 text-left mb-6 shadow-sm">
            <p className="cp-mono text-xs text-[#C8A040] uppercase tracking-wider mb-4">
              Récapitulatif
            </p>
            {[
              { k: 'Référence', v: ref },
              { k: 'Véhicule', v: `${vehiculeSelectionne?.marque} ${vehiculeSelectionne?.modele}` },
              {
                k: 'Départ',
                v: formData.dateDepart
                  ? new Date(formData.dateDepart).toLocaleDateString('fr-FR')
                  : '',
              },
              {
                k: 'Retour',
                v: formData.dateRetour
                  ? new Date(formData.dateRetour).toLocaleDateString('fr-FR')
                  : '',
              },
              { k: 'Durée', v: `${nbJours} jour${nbJours > 1 ? 's' : ''}` },
              { k: 'Total TTC', v: `${prixTotal} €` },
            ].map(({ k, v }) => (
              <div
                key={k}
                className="flex justify-between py-2 border-b border-[#F8F5F0] last:border-0"
              >
                <span className="text-xs text-cp-ink/50">{k}</span>
                <span className="text-xs font-semibold text-cp-ink">{v}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-cp-ink/40 mb-8">
            Un email de confirmation a été envoyé à <strong>{formData.email}</strong>
          </p>
          <button
            onClick={() => {
              setDone(false);
              setShowForm(false);
              setSelectedId(null);
              setStep(0);
            }}
            className="text-sm text-cp-mango hover:underline"
          >
            Faire une nouvelle réservation
          </button>
        </div>
      </section>
    );
  }

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
                  min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
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
                  min={
                    dateDepart || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
                  }
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
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${categorie === c ? 'bg-cp-ink border-cp-ink text-cp-cream' : 'border-[#E5DDD3] text-cp-ink/50 hover:border-cp-mango hover:text-cp-mango'}`}
                >
                  {c}
                </button>
              ))}
              {categorie !== 'Toutes' && (
                <button
                  onClick={() => setCategorie('Toutes')}
                  className="text-xs px-3 py-1.5 rounded-full border border-[#E5DDD3] text-cp-ink/40 hover:border-cp-mango hover:text-cp-mango transition-all"
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
                    className={`absolute top-3 left-3 text-white text-[0.65rem] cp-mono px-3 py-1 rounded-full ${v.dispo ? 'bg-[#7A9B76]/90' : 'bg-[#D4A24C]/90'}`}
                  >
                    {v.dispo ? 'Disponible' : 'Stock limité'}
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
                        {v.prixJour} €
                        <span className="text-sm font-normal text-cp-ink/40">/jour</span>
                      </p>
                      <p className="text-xs text-cp-ink/35 mt-0.5">{v.prixSemaine} €/semaine</p>
                    </div>
                    <button
                      onClick={() => openReservation(v.id)}
                      className="px-4 py-2 rounded-xl bg-cp-mango/10 border border-cp-mango/20 text-cp-mango text-sm font-semibold hover:bg-cp-mango/20 hover:border-cp-mango/40 transition-all"
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

      {/* ── FORMULAIRE RÉSERVATION ─────────── */}
      {showForm && vehiculeSelectionne && (
        <section className="py-24 px-6 pt-32" style={{ backgroundColor: '#2C1A08' }}>
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Info */}
            <div className="lg:sticky lg:top-24">
              <p className="cp-mono text-[#E9C46A] text-xs tracking-widest uppercase mb-4">
                Votre réservation
              </p>
              <h2
                className="cp-title font-black text-cp-cream leading-none mb-6"
                style={{ fontSize: 'clamp(2rem,3.5vw,3rem)' }}
              >
                RÉSERVEZ
                <br />
                <em className="text-[#E9C46A] not-italic">{vehiculeSelectionne.marque}</em>
                <br />
                {vehiculeSelectionne.modele}
              </h2>
              <p className="text-cp-cream/45 text-sm leading-relaxed mb-8 max-w-sm">
                Kilométrage illimité, assurance tous risques incluse. Remise en main propre dans
                notre garage à Pointe-à-Pitre.
              </p>

              {/* Conditions */}
              {[
                { title: 'Permis B requis', desc: 'Valide depuis plus de 2 ans' },
                { title: 'Caution', desc: '500 € par empreinte bancaire' },
                { title: 'Carburant', desc: 'Rendu plein, reçu plein' },
                { title: 'Kilométrage', desc: 'Illimité — sans frais cachés' },
              ].map((c) => (
                <div key={c.title} className="flex gap-3 items-start mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[#E9C46A]/10 border border-[#E9C46A]/15 flex items-center justify-center flex-shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#E9C46A]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-cp-cream">{c.title}</p>
                    <p className="text-xs text-cp-cream/40 mt-0.5">{c.desc}</p>
                  </div>
                </div>
              ))}

              {nbJours > 0 && (
                <div className="mt-6 bg-[#1A0F06]/50 rounded-xl p-4 border border-[#E9C46A]/10">
                  <p className="cp-mono text-[0.65rem] text-[#E9C46A] uppercase tracking-widest mb-3">
                    Estimation
                  </p>
                  <div className="flex justify-between text-sm text-cp-cream/60 mb-1">
                    <span>
                      {nbJours} jour{nbJours > 1 ? 's' : ''} × {vehiculeSelectionne.prixJour} €
                    </span>
                    <span>{vehiculeSelectionne.prixJour * nbJours} €</span>
                  </div>
                  <div className="flex justify-between font-bold text-cp-cream border-t border-[#E9C46A]/10 pt-2 mt-2">
                    <span>Total TTC</span>
                    <span className="text-[#E9C46A]">{prixTotal} €</span>
                  </div>
                </div>
              )}
            </div>

            {/* Form card */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.3)]">
              {/* Header */}
              <div className="px-6 py-4 bg-cp-ink flex items-center justify-between">
                <p className="cp-title font-black text-cp-cream text-lg">
                  Formulaire de réservation
                </p>
                <div className="flex gap-1.5">
                  {([0, 1, 2] as Step[]).map((i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${i < step ? 'bg-[#E9C46A]/40' : i === step ? 'bg-[#E9C46A]' : 'bg-[#E9C46A]/15'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Progress bars */}
              <div className="flex gap-1 px-6 py-3 bg-cp-ink/5">
                {([0, 1, 2] as Step[]).map((i) => (
                  <div
                    key={i}
                    className={`flex-1 h-0.5 rounded-full transition-colors ${i < step ? 'bg-[#C8A040]/40' : i === step ? 'bg-[#C8A040]' : 'bg-[#E5DDD3]'}`}
                  />
                ))}
              </div>

              <div className="p-6">
                {/* Step 0 — Véhicule + dates */}
                {step === 0 && (
                  <div className="flex flex-col gap-4">
                    <div>
                      <p className="cp-mono text-[0.65rem] text-[#C8A040] uppercase tracking-widest mb-1">
                        Étape 1 / 3
                      </p>
                      <p className="cp-title font-black text-cp-ink text-xl">Véhicule & dates</p>
                      <p className="text-xs text-cp-ink/40 mt-1">
                        Confirmez les dates de votre location
                      </p>
                    </div>

                    <div className="bg-[#F8F5F0] rounded-xl p-4 flex gap-4 items-center">
                      <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={vehiculeSelectionne.image}
                          alt={vehiculeSelectionne.modele}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="cp-title font-black text-cp-ink">
                          {vehiculeSelectionne.marque} {vehiculeSelectionne.modele}
                        </p>
                        <p className="cp-mono text-[0.65rem] text-cp-ink/40 tracking-wide">
                          {vehiculeSelectionne.categorie} · {vehiculeSelectionne.prixJour} €/jour
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={lbl}>Départ *</label>
                        <input
                          type="date"
                          className={field}
                          min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                          value={formData.dateDepart}
                          onChange={(e) => setForm('dateDepart', e.target.value)}
                        />
                        {err('dateDepart')}
                      </div>
                      <div>
                        <label className={lbl}>Retour *</label>
                        <input
                          type="date"
                          className={field}
                          min={
                            formData.dateDepart ||
                            new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
                          }
                          value={formData.dateRetour}
                          onChange={(e) => setForm('dateRetour', e.target.value)}
                        />
                        {err('dateRetour')}
                      </div>
                    </div>

                    {nbJours > 0 && (
                      <div className="bg-[#F8F5F0] rounded-xl p-4">
                        <div className="flex justify-between text-sm text-cp-ink/60 mb-1">
                          <span>
                            {nbJours} jour{nbJours > 1 ? 's' : ''} × {vehiculeSelectionne.prixJour}{' '}
                            €
                          </span>
                          <span>{vehiculeSelectionne.prixJour * nbJours} €</span>
                        </div>
                        <div className="flex justify-between font-bold text-cp-ink border-t border-[#E5DDD3] pt-2 mt-2">
                          <span className="text-sm">Total TTC</span>
                          <span className="text-cp-mango">{prixTotal} €</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 1 — Conducteur */}
                {step === 1 && (
                  <div className="flex flex-col gap-4">
                    <div>
                      <p className="cp-mono text-[0.65rem] text-[#C8A040] uppercase tracking-widest mb-1">
                        Étape 2 / 3
                      </p>
                      <p className="cp-title font-black text-cp-ink text-xl">
                        Informations conducteur
                      </p>
                      <p className="text-xs text-cp-ink/40 mt-1">
                        Vos coordonnées et votre permis de conduire
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="prenom" className={lbl}>
                          Prénom *
                        </label>
                        <input
                          id="prenom"
                          className={field}
                          type="text"
                          autoComplete="given-name"
                          placeholder="Marie"
                          value={formData.prenom}
                          onChange={(e) => setForm('prenom', e.target.value)}
                        />
                        {err('prenom')}
                      </div>
                      <div>
                        <label htmlFor="nom" className={lbl}>
                          Nom *
                        </label>
                        <input
                          id="nom"
                          className={field}
                          type="text"
                          autoComplete="family-name"
                          placeholder="Dupont"
                          value={formData.nom}
                          onChange={(e) => setForm('nom', e.target.value)}
                        />
                        {err('nom')}
                      </div>
                    </div>
                    <div>
                      <label htmlFor="email" className={lbl}>
                        Email *
                      </label>
                      <input
                        id="email"
                        className={field}
                        type="email"
                        autoComplete="email"
                        placeholder="marie.dupont@email.com"
                        value={formData.email}
                        onChange={(e) => setForm('email', e.target.value)}
                      />
                      {err('email')}
                    </div>
                    <div>
                      <label htmlFor="tel" className={lbl}>
                        Téléphone *
                      </label>
                      <input
                        id="tel"
                        className={field}
                        type="tel"
                        autoComplete="tel"
                        placeholder="0690 00 00 00"
                        value={formData.tel}
                        onChange={(e) => setForm('tel', e.target.value)}
                      />
                      {err('tel')}
                    </div>
                    <div>
                      <label htmlFor="permis" className={lbl}>
                        N° de permis *
                      </label>
                      <input
                        id="permis"
                        className={`${field} cp-mono tracking-widest`}
                        type="text"
                        placeholder="12AA34567"
                        autoComplete="off"
                        value={formData.permis}
                        onChange={(e) => setForm('permis', e.target.value.toUpperCase())}
                      />
                      {err('permis')}
                    </div>
                  </div>
                )}

                {/* Step 2 — Recap + consentement */}
                {step === 2 && (
                  <div className="flex flex-col gap-4">
                    <div>
                      <p className="cp-mono text-[0.65rem] text-[#C8A040] uppercase tracking-widest mb-1">
                        Étape 3 / 3
                      </p>
                      <p className="cp-title font-black text-cp-ink text-xl">Récapitulatif</p>
                      <p className="text-xs text-cp-ink/40 mt-1">Vérifiez avant de confirmer</p>
                    </div>

                    <div className="bg-[#F8F5F0] rounded-xl p-4">
                      <p className="cp-mono text-[0.65rem] text-[#C8A040] uppercase tracking-widest mb-3">
                        Votre réservation
                      </p>
                      {[
                        {
                          k: 'Véhicule',
                          v: `${vehiculeSelectionne.marque} ${vehiculeSelectionne.modele}`,
                        },
                        {
                          k: 'Départ',
                          v: formData.dateDepart
                            ? new Date(formData.dateDepart).toLocaleDateString('fr-FR')
                            : '',
                        },
                        {
                          k: 'Retour',
                          v: formData.dateRetour
                            ? new Date(formData.dateRetour).toLocaleDateString('fr-FR')
                            : '',
                        },
                        { k: 'Durée', v: `${nbJours} jour${nbJours > 1 ? 's' : ''}` },
                        { k: 'Conducteur', v: `${formData.prenom} ${formData.nom}` },
                        { k: 'Total TTC', v: `${prixTotal} €` },
                      ].map(({ k, v }) => (
                        <div
                          key={k}
                          className="flex justify-between py-1.5 border-b border-[#E5DDD3]/50 last:border-0"
                        >
                          <span className="text-xs text-cp-ink/50">{k}</span>
                          <span
                            className={`text-xs font-semibold ${k === 'Total TTC' ? 'text-cp-mango' : 'text-cp-ink'}`}
                          >
                            {v}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="border border-[#E5DDD3] rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <input
                          id="consent"
                          type="checkbox"
                          checked={formData.consent}
                          onChange={(e) => setForm('consent', e.target.checked)}
                          className="w-4 h-4 accent-cp-mango cursor-pointer mt-0.5 flex-shrink-0"
                        />
                        <label
                          htmlFor="consent"
                          className="text-xs text-cp-ink/60 leading-relaxed cursor-pointer"
                        >
                          J&apos;accepte les{' '}
                          <span className="text-cp-mango">conditions générales de location</span> et
                          confirme l&apos;exactitude des informations fournies. Une caution de 500 €
                          sera prélevée à la remise du véhicule.
                        </label>
                      </div>
                      {err('consent')}
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex gap-3 mt-6">
                  {step > 0 ? (
                    <button
                      type="button"
                      onClick={() => setStep((s) => (s - 1) as Step)}
                      className="flex items-center gap-2 text-sm font-medium text-cp-ink/50 hover:text-cp-ink transition-colors"
                    >
                      <svg
                        width="14"
                        height="14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                      </svg>
                      Retour
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex items-center gap-2 text-sm font-medium text-cp-ink/50 hover:text-cp-ink transition-colors"
                    >
                      <svg
                        width="14"
                        height="14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                      </svg>
                      Catalogue
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={next}
                    className="flex-1 py-3 rounded-xl bg-cp-ink text-cp-cream text-sm font-semibold hover:bg-cp-mango transition-colors flex items-center justify-center gap-2"
                  >
                    {step === 2 ? 'Confirmer la réservation' : 'Continuer'}
                    {step < 2 && (
                      <svg
                        width="14"
                        height="14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
