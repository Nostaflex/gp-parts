'use client';

/**
 * Admin — Export Leboncoin formaté.
 *
 * #14 Stephane: poster une annonce sur Leboncoin depuis l'admin.
 *
 * Réalité 2026 (cf. research):
 *  - Pas d'API publique gratuite Leboncoin
 *  - Pas de deep link `?title=X` pour pré-remplir le formulaire
 *  - Scraping/automation = DataDome + amende 50K€ + ban IP
 *  - Multidiffuseur Ubiflow (41€/mois) = la seule voie automatisée légale payante
 *
 * Solution no-cost: générer texte formaté optimisé pour la catégorie Véhicules
 * de Leboncoin (titre 70 chars, description structurée, mots-clés).
 * Stephane copie-colle dans Leboncoin (15-30s vs 5min de saisie complète).
 */

import { useState, useMemo } from 'react';
import { VEHICULES, type Vehicule } from '@/lib/vehicules';
import { MOTOS, type Moto } from '@/lib/motos';

const IOS = {
  bg: 'var(--bg)',
  surface: 'var(--surface)',
  text: 'var(--text)',
  blue: 'var(--blue)',
  border: 'var(--border)',
  textMuted: 'rgba(28, 28, 30, 0.6)',
  textSubtle: 'rgba(28, 28, 30, 0.5)',
  success: '#34C759',
};

const LBC_DEPOSER_URL = 'https://www.leboncoin.fr/deposer-une-annonce';
const TITRE_MAX_CHARS = 70;

type Item = { kind: 'vehicule'; data: Vehicule } | { kind: 'moto'; data: Moto };

function asItems(): Item[] {
  return [
    ...VEHICULES.map((v): Item => ({ kind: 'vehicule', data: v })),
    ...MOTOS.map((m): Item => ({ kind: 'moto', data: m })),
  ];
}

export function LeboncoinExportClient() {
  const items = useMemo(asItems, []);
  const [selectedId, setSelectedId] = useState<string>(items[0]?.data.id ?? '');
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [copiedDesc, setCopiedDesc] = useState(false);

  const selected = items.find((i) => i.data.id === selectedId) ?? items[0];

  const { titre, description } = selected
    ? generateAnnonce(selected)
    : { titre: '', description: '' };

  const copyTitle = async () => {
    await navigator.clipboard.writeText(titre);
    setCopiedTitle(true);
    setTimeout(() => setCopiedTitle(false), 2000);
  };

  const copyDescription = async () => {
    await navigator.clipboard.writeText(description);
    setCopiedDesc(true);
    setTimeout(() => setCopiedDesc(false), 2000);
  };

  return (
    <div>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold" style={{ color: IOS.text }}>
            Export Leboncoin
          </h1>
          <p className="text-sm mt-2 max-w-3xl" style={{ color: IOS.textMuted }}>
            Prépare une annonce optimisée pour Leboncoin Véhicules. Copie titre + description,
            clique &quot;Ouvrir Leboncoin&quot;, colle dans le formulaire. Compte ~30s contre 5 min
            de saisie manuelle.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Sidebar — sélecteur */}
          <aside>
            <div
              className="rounded-2xl p-4 border"
              style={{ background: IOS.surface, borderColor: IOS.border }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: IOS.textSubtle }}
              >
                Choisir un véhicule
              </p>
              <div className="flex flex-col gap-1 max-h-[600px] overflow-auto">
                {items.map((it) => (
                  <button
                    key={it.data.id}
                    type="button"
                    onClick={() => setSelectedId(it.data.id)}
                    className="text-left p-3 rounded-lg transition-colors"
                    style={{
                      background:
                        selectedId === it.data.id ? 'rgba(0, 122, 255, 0.1)' : 'transparent',
                      color: IOS.text,
                    }}
                  >
                    <div className="text-xs uppercase tracking-wide font-semibold opacity-50">
                      {it.kind === 'moto' ? '🏍️ Moto' : '🚗 Véhicule'} ·{' '}
                      {it.data.type === 'neuf' ? 'Neuf' : 'Occasion'}
                    </div>
                    <div className="text-sm font-medium mt-1">
                      {it.data.marque} {it.data.modele}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: IOS.textSubtle }}>
                      {it.data.annee} · {it.data.prix.toLocaleString('fr-FR')} €
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main — preview */}
          <div className="flex flex-col gap-4">
            {/* Titre */}
            <div
              className="rounded-2xl p-6 border"
              style={{ background: IOS.surface, borderColor: IOS.border }}
            >
              <div className="flex items-center justify-between mb-3">
                <p
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: IOS.textSubtle }}
                >
                  Titre annonce ({titre.length}/{TITRE_MAX_CHARS})
                </p>
                <button
                  type="button"
                  onClick={copyTitle}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                  style={{ background: copiedTitle ? IOS.success : IOS.blue }}
                >
                  {copiedTitle ? '✓ Copié' : 'Copier'}
                </button>
              </div>
              <p
                className="text-base font-medium p-3 rounded-lg"
                style={{ background: '#F5F5F7', color: IOS.text }}
              >
                {titre || '—'}
              </p>
              {titre.length > TITRE_MAX_CHARS && (
                <p className="text-xs mt-2" style={{ color: '#FF3B30' }}>
                  ⚠️ Titre trop long pour Leboncoin (max {TITRE_MAX_CHARS} chars). Sera tronqué.
                </p>
              )}
            </div>

            {/* Description */}
            <div
              className="rounded-2xl p-6 border"
              style={{ background: IOS.surface, borderColor: IOS.border }}
            >
              <div className="flex items-center justify-between mb-3">
                <p
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: IOS.textSubtle }}
                >
                  Description annonce ({description.length} chars)
                </p>
                <button
                  type="button"
                  onClick={copyDescription}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                  style={{ background: copiedDesc ? IOS.success : IOS.blue }}
                >
                  {copiedDesc ? '✓ Copié' : 'Copier'}
                </button>
              </div>
              <pre
                className="text-sm whitespace-pre-wrap font-sans p-4 rounded-lg max-h-[400px] overflow-auto"
                style={{ background: '#F5F5F7', color: IOS.text, lineHeight: 1.7 }}
              >
                {description}
              </pre>
            </div>

            {/* Métadonnées + CTA */}
            <div
              className="rounded-2xl p-6 border"
              style={{ background: IOS.surface, borderColor: IOS.border }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-4"
                style={{ color: IOS.textSubtle }}
              >
                Métadonnées Leboncoin
              </p>
              <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-6">
                <Meta label="Catégorie" value={selected?.kind === 'moto' ? 'Motos' : 'Voitures'} />
                <Meta
                  label="Prix"
                  value={`${selected?.data.prix.toLocaleString('fr-FR') ?? '—'} €`}
                />
                <Meta label="Lieu" value="Pointe-à-Pitre (971)" />
                {selected && selected.kind === 'vehicule' && (
                  <>
                    <Meta label="Année" value={String(selected.data.annee)} />
                    <Meta
                      label="Kilométrage"
                      value={`${selected.data.km.toLocaleString('fr-FR')} km`}
                    />
                    <Meta label="Énergie" value={selected.data.energie} />
                  </>
                )}
                {selected && selected.kind === 'moto' && (
                  <>
                    <Meta label="Année" value={String(selected.data.annee)} />
                    <Meta
                      label="Kilométrage"
                      value={`${selected.data.km.toLocaleString('fr-FR')} km`}
                    />
                    <Meta
                      label="Cylindrée"
                      value={selected.data.caracteristiques.cylindree ?? '—'}
                    />
                  </>
                )}
              </dl>

              <a
                href={LBC_DEPOSER_URL}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex justify-center items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: '#EC5A13' /* orange Leboncoin */ }}
              >
                Ouvrir Leboncoin (nouvelle fenêtre) →
              </a>
              <p className="text-[0.7rem] mt-3 italic" style={{ color: IOS.textSubtle }}>
                ⚠️ Leboncoin n&apos;a pas d&apos;API publique gratuite. Tu dois copier-coller le
                titre et la description dans le formulaire Leboncoin manuellement (15-30s).
                Catégorie Véhicules → Voitures / Motos.
              </p>
            </div>

            {/* Note Ubiflow */}
            <div
              className="rounded-2xl p-4 border"
              style={{
                background: 'rgba(255, 149, 0, 0.05)',
                borderColor: 'rgba(255, 149, 0, 0.2)',
              }}
            >
              <p className="text-xs font-medium" style={{ color: '#FF9500' }}>
                💡 Astuce automation
              </p>
              <p className="text-xs mt-1" style={{ color: IOS.textMuted }}>
                Si le volume monte (3+ ventes/mois), un service multidiffuseur (
                <a
                  href="https://www.ubiflow.net/tarifs-automobile"
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                  style={{ color: IOS.blue }}
                >
                  Ubiflow ~41€ HT/mois
                </a>
                ) publie automatiquement vers Leboncoin + La Centrale + ParuVendu + 80 médias.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider" style={{ color: IOS.textSubtle }}>
        {label}
      </dt>
      <dd className="font-medium mt-0.5" style={{ color: IOS.text }}>
        {value}
      </dd>
    </div>
  );
}

function generateAnnonce(item: Item): { titre: string; description: string } {
  const d = item.data;
  const isVehicule = item.kind === 'vehicule';
  const v = isVehicule ? (d as Vehicule) : null;
  const m = !isVehicule ? (d as Moto) : null;

  // Titre optimisé Leboncoin (mots-clés début, marque + modèle + année + km)
  // Format: "MARQUE MODELE ANNÉE - XX XXX km - ÉTAT" max 70 chars
  const titreParts: string[] = [`${d.marque} ${d.modele}`, String(d.annee)];
  if (d.km > 0) titreParts.push(`${d.km.toLocaleString('fr-FR')} km`);
  if (d.type === 'neuf') titreParts.push('NEUF');
  const titre = titreParts.join(' · ');

  // Description structurée pour la lisibilité Leboncoin
  const lines: string[] = [];
  lines.push(`🚗 ${d.marque} ${d.modele} ${d.annee}`);
  if (d.type === 'neuf') lines.push('✨ NEUVE — à immatriculer');
  lines.push('');

  if (v) {
    lines.push('CARACTÉRISTIQUES');
    lines.push(`• Kilométrage : ${v.km.toLocaleString('fr-FR')} km`);
    lines.push(`• Énergie : ${v.energie}`);
    lines.push(`• Boîte : ${v.transmission}`);
    lines.push(`• Places : ${v.places}`);
    if (v.caracteristiques.puissance) lines.push(`• Puissance : ${v.caracteristiques.puissance}`);
    if (v.caracteristiques.cylindree) lines.push(`• Cylindrée : ${v.caracteristiques.cylindree}`);
    if (v.caracteristiques.couleur) lines.push(`• Couleur : ${v.caracteristiques.couleur}`);
    if (v.caracteristiques.carrosserie) {
      lines.push(`• Carrosserie : ${v.caracteristiques.carrosserie}`);
    }
    if (v.caracteristiques.critAir) lines.push(`• ${v.caracteristiques.critAir}`);
    if (v.caracteristiques.proprietaires !== undefined) {
      lines.push(`• Propriétaire(s) : ${v.caracteristiques.proprietaires}`);
    }
  }
  if (m) {
    lines.push('CARACTÉRISTIQUES');
    lines.push(`• Kilométrage : ${m.km.toLocaleString('fr-FR')} km`);
    lines.push(`• Catégorie : ${m.categorie}`);
    lines.push(`• Énergie : ${m.energie}`);
    if (m.caracteristiques.cylindree) lines.push(`• Cylindrée : ${m.caracteristiques.cylindree}`);
    if (m.caracteristiques.puissance) lines.push(`• Puissance : ${m.caracteristiques.puissance}`);
    if (m.caracteristiques.poids) lines.push(`• Poids : ${m.caracteristiques.poids}`);
    if (m.caracteristiques.permis) lines.push(`• Permis : ${m.caracteristiques.permis}`);
    if (m.caracteristiques.couleur) lines.push(`• Couleur : ${m.caracteristiques.couleur}`);
  }

  if (d.options.length > 0) {
    lines.push('', 'ÉQUIPEMENTS', ...d.options.map((o) => `• ${o}`));
  }

  if (d.description) {
    lines.push('', 'DESCRIPTION', d.description);
  }

  lines.push('', 'CONDITIONS');
  if (d.type === 'neuf') {
    lines.push('• Véhicule neuf à immatriculer');
    lines.push(`• Garantie : ${d.caracteristiques.garantie ?? 'Constructeur'}`);
  } else {
    lines.push(`• ${d.caracteristiques.garantie ?? 'Garantie 12 mois Car Performance'}`);
    lines.push('• Contrôlé par nos techniciens');
  }
  lines.push('• Financement sur mesure disponible (TAEG 4,99%)');
  lines.push('• Reprise possible — estimation gratuite');
  lines.push('• Disponible à Pointe-à-Pitre, Guadeloupe (971)');
  lines.push('');
  lines.push("📞 Contactez-nous pour un essai ou plus d'infos");
  lines.push(`Réf. ${d.reference}`);

  return { titre, description: lines.join('\n') };
}
