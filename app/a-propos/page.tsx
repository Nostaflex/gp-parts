import type { Metadata } from 'next';
import { CpHeader } from '@/components/cp/CpHeader';
import { CpBridge } from '@/components/cp/CpBridge';
import { CpFooter } from '@/components/cp/CpFooter';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'À propos',
  description:
    "Car Performance Guadeloupe depuis 2010. Garage de confiance à Pointe-à-Pitre, 15 ans d'expertise automobile, équipe locale passionnée.",
};

const VALEURS = [
  {
    num: '01',
    titre: 'Transparence',
    texte:
      'Devis détaillé avant toute intervention. Pas de surprise, pas de frais cachés. Vous savez exactement ce qui est fait et pourquoi.',
    iconPath: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    accent: 'text-cp-mango',
    bg: 'bg-cp-mango/15',
  },
  {
    num: '02',
    titre: 'Excellence',
    texte:
      "Techniciens formés, outillage récent, pièces de qualité. On ne rend pas un véhicule tant qu'on n'est pas satisfait du résultat.",
    iconPath: 'M20 6L9 17l-5-5',
    accent: 'text-cp-vert-l',
    bg: 'bg-cp-vert-l/12',
  },
  {
    num: '03',
    titre: 'Proximité',
    texte:
      "On est d'ici. On comprend les réalités du marché antillais — les routes, le climat, les contraintes locales. On vous parle vrai.",
    iconPath:
      'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 7a4 4 0 108 0 4 4 0 00-8 0z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75',
    accent: 'text-cp-gold',
    bg: 'bg-cp-gold/12',
  },
];

const EQUIPE = [
  {
    prenom: 'Stéphane',
    nom: 'M.',
    role: 'Fondateur & Directeur',
    depuis: '2010',
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80&fit=crop&crop=face',
  },
  {
    prenom: 'Christelle',
    nom: 'B.',
    role: 'Responsable accueil & RDV',
    depuis: '2013',
    image:
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80&fit=crop&crop=face',
  },
  {
    prenom: 'Jérôme',
    nom: 'L.',
    role: 'Chef mécanicien',
    depuis: '2011',
    image:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80&fit=crop&crop=face',
  },
  {
    prenom: 'Nadège',
    nom: 'C.',
    role: 'Technicienne carrosserie',
    depuis: '2017',
    image:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80&fit=crop&crop=face',
  },
];

const ENGAGEMENTS = [
  {
    titre: 'Formation continue',
    texte: 'Nos techniciens se forment chaque année aux dernières technologies véhicule.',
  },
  {
    titre: 'Stock local',
    texte: '500+ références en stock permanent pour réduire les délais de réparation.',
  },
  {
    titre: 'Garantie pièces',
    texte: 'Toutes les pièces montées sont garanties 12 mois ou 20 000 km.',
  },
  {
    titre: 'Devis gratuit',
    texte: 'Estimation transparente avant toute intervention, sans engagement.',
  },
];

export default function AProposPage() {
  return (
    <>
      <CpHeader darkSectionIds={['ap-valeurs', 'ap-equipe', 'ap-cta']} />

      {/* ── HERO cream ───────────────────────── */}
      <section
        className="relative pt-28 pb-0 px-6 overflow-hidden"
        style={{ backgroundColor: '#F4EDE0' }}
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center pb-16">
          <div>
            <nav
              aria-label="Fil d'Ariane"
              className="flex items-center gap-2 text-xs text-cp-ink/30 mb-8"
            >
              <Link href="/" className="hover:text-cp-mango transition-colors">
                Accueil
              </Link>
              <svg
                width="10"
                height="10"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
              <span className="text-cp-ink/60">À propos</span>
            </nav>
            <p className="cp-mono text-cp-mango text-xs tracking-widest uppercase mb-5">
              Notre histoire · Depuis 2010
            </p>
            <h1
              className="cp-title font-black text-cp-ink leading-none mb-6"
              style={{ fontSize: 'clamp(2.5rem,6vw,6rem)' }}
            >
              LA PASSION
              <br />
              AUTO AU
              <br />
              <em className="text-cp-mango not-italic">CŒUR DES</em>
              <br />
              <em className="text-cp-mango not-italic">ANTILLES</em>
            </h1>
            <p className="text-cp-ink/55 text-base leading-relaxed max-w-md mb-8">
              Né en Guadeloupe, pensé pour les Guadeloupéens. Car Performance, c&apos;est 15 ans de
              savoir-faire mécanique et une équipe qui aime vraiment les voitures.
            </p>
            <div className="flex items-center gap-3">
              <span className="cp-title font-black text-cp-ink text-4xl">2010</span>
              <span className="text-cp-ink/40 text-sm">
                Année de fondation
                <br />à Pointe-à-Pitre
              </span>
            </div>
          </div>

          {/* Photo hero */}
          <div className="relative hidden md:block">
            <div className="rounded-2xl overflow-hidden aspect-[4/5] relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=800&q=75"
                alt="Équipe Car Performance Guadeloupe dans l'atelier"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-cp-ink/30 to-transparent" />
            </div>
            {/* Badge */}
            <div className="absolute bottom-6 left-6 bg-cp-ink/90 backdrop-blur-sm rounded-xl px-5 py-4 border border-cp-cream/10">
              <p className="cp-title font-black text-cp-mango text-3xl leading-none">15</p>
              <p className="text-xs text-cp-cream font-semibold mt-1">Années d&apos;expertise</p>
              <p className="text-[0.65rem] text-cp-cream/40 mt-0.5">au service des Guadeloupéens</p>
            </div>
            {/* Tag */}
            <div className="absolute top-6 right-6 cp-mono text-xs text-cp-ink/50 bg-cp-cream/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
              971 🏝
            </div>
          </div>
        </div>
      </section>

      <CpBridge fromColor="#F4EDE0" toColor="#0D0905" />

      {/* ── VALEURS cinema ───────────────────── */}
      <section id="ap-valeurs" className="py-24 px-6" style={{ backgroundColor: '#0D0905' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="cp-mono text-cp-mango text-xs tracking-widest uppercase mb-4">
              Ce qui nous anime
            </p>
            <h2
              className="cp-title font-black text-cp-cream leading-none mb-4"
              style={{ fontSize: 'clamp(2.5rem,5vw,5rem)' }}
            >
              NOS VALEURS
            </h2>
            <p className="text-cp-cream/45 text-base max-w-md mx-auto">
              Trois piliers qui guident chaque intervention, chaque conseil, chaque relation client.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-cp-cream/8 border border-cp-cream/8 rounded-2xl overflow-hidden">
            {VALEURS.map((v) => (
              <div key={v.num} className="p-8 hover:bg-cp-cream/5 transition-colors">
                <span className="cp-mono text-[0.65rem] text-cp-cream/20 tracking-widest block mb-4">
                  {v.num}
                </span>
                <div
                  className={`w-10 h-10 rounded-xl ${v.bg} flex items-center justify-center mb-4`}
                >
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    viewBox="0 0 24 24"
                    className={v.accent}
                  >
                    <path d={v.iconPath} />
                  </svg>
                </div>
                <h3 className="cp-title font-black text-cp-cream text-2xl mb-3">{v.titre}</h3>
                <p className="text-cp-cream/45 text-sm leading-relaxed">{v.texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CpBridge fromColor="#0D0905" toColor="#F4EDE0" />

      {/* ── HISTOIRE cream ───────────────────── */}
      <section className="py-24 px-6" style={{ backgroundColor: '#F4EDE0' }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="cp-mono text-cp-mango text-xs tracking-widest uppercase mb-4">
              Notre parcours
            </p>
            <h2
              className="cp-title font-black text-cp-ink leading-none mb-6"
              style={{ fontSize: 'clamp(2rem,4vw,4rem)' }}
            >
              15 ANS À<br />
              VOS CÔTÉS
            </h2>
            <p className="text-cp-ink/55 text-base leading-relaxed mb-6">
              Fondé en 2010 par Stéphane dans un petit atelier de Jarry, Car Performance est devenu
              en 15 ans le garage de référence en Guadeloupe. Ce qui n&apos;a pas changé : la
              passion du travail bien fait et l&apos;envie de rendre service.
            </p>
            <p className="text-cp-ink/55 text-base leading-relaxed mb-8">
              Aujourd&apos;hui, notre équipe de 8 techniciens prend en charge toutes les marques —
              de la vidange express à la rénovation complète — dans un atelier de 400 m² équipé des
              derniers outils diagnostiques.
            </p>

            {/* Timeline */}
            <div className="flex flex-col gap-4">
              {[
                { annee: '2010', fait: "Ouverture de l'atelier à Jarry, 2 mécaniciens" },
                { annee: '2014', fait: 'Certification expertise automobile' },
                { annee: '2018', fait: 'Extension 400 m² + service carrosserie' },
                { annee: '2022', fait: 'Lancement de la boutique pièces en ligne' },
                { annee: '2025', fait: '15 ans · 8 techniciens · 500+ pièces en stock' },
              ].map((t) => (
                <div key={t.annee} className="flex gap-4 items-start">
                  <span className="cp-mono font-bold text-cp-mango text-sm flex-shrink-0 w-12">
                    {t.annee}
                  </span>
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className="w-px h-full bg-[#E5DDD3] flex-shrink-0 mt-2"
                      style={{ minHeight: '16px' }}
                    />
                    <p className="text-cp-ink/60 text-sm">{t.fait}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Photos stack */}
          <div className="relative h-[480px] hidden lg:block">
            <div className="absolute top-0 right-0 w-3/4 h-72 rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(26,15,6,0.12)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=600&q=80&fit=crop"
                alt="Atelier Car Performance"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute bottom-0 left-0 w-2/3 h-56 rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(26,15,6,0.12)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&q=80&fit=crop"
                alt="Mécanicien Car Performance"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Quote */}
            <div className="absolute bottom-40 right-4 bg-cp-ink rounded-xl px-4 py-3 max-w-[180px]">
              <p className="text-cp-cream/70 text-xs italic leading-relaxed">
                &ldquo;On fait ça avec le cœur, depuis le premier jour.&rdquo;
              </p>
              <p className="text-cp-mango text-[0.65rem] font-semibold mt-2">
                — Stéphane, fondateur
              </p>
            </div>
          </div>
        </div>
      </section>

      <CpBridge fromColor="#F4EDE0" toColor="#0D0905" />

      {/* ── ÉQUIPE cinema ────────────────────── */}
      <section id="ap-equipe" className="py-24 px-6" style={{ backgroundColor: '#0D0905' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="cp-mono text-cp-mango text-xs tracking-widest uppercase mb-4">
              Les gens derrière le garage
            </p>
            <h2
              className="cp-title font-black text-cp-cream leading-none"
              style={{ fontSize: 'clamp(2.5rem,5vw,5rem)' }}
            >
              NOTRE ÉQUIPE
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {EQUIPE.map((m) => (
              <div key={m.prenom} className="group">
                <div className="aspect-square rounded-2xl overflow-hidden mb-4 bg-cp-cream/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.image}
                    alt={`${m.prenom} ${m.nom}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <p className="cp-title font-black text-cp-cream text-lg leading-tight">
                  {m.prenom} {m.nom}
                </p>
                <p className="text-cp-cream/45 text-xs mt-1">{m.role}</p>
                <p className="cp-mono text-[0.6rem] text-cp-mango/60 mt-0.5">Depuis {m.depuis}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CpBridge fromColor="#0D0905" toColor="#F8F5F0" />

      {/* ── ENGAGEMENTS craft ────────────────── */}
      <section className="py-24 px-6" style={{ backgroundColor: '#F8F5F0' }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="cp-mono text-cp-mango text-xs tracking-widest uppercase mb-4">
              Ce qui nous engage
            </p>
            <h2
              className="cp-title font-black text-cp-ink leading-none mb-6"
              style={{ fontSize: 'clamp(2rem,4vw,4rem)' }}
            >
              NOS
              <br />
              ENGAGEMENTS
            </h2>
            <p className="text-cp-ink/55 text-base leading-relaxed max-w-md">
              Des promesses concrètes, pas des slogans. Voici ce sur quoi vous pouvez compter à
              chaque visite.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {ENGAGEMENTS.map((e) => (
              <div key={e.titre} className="bg-white rounded-xl p-5 border border-[#E5DDD3]">
                <div className="w-2 h-2 rounded-full bg-cp-mango mb-3" />
                <p className="font-semibold text-cp-ink text-sm mb-1">{e.titre}</p>
                <p className="text-cp-ink/50 text-xs leading-relaxed">{e.texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CpBridge fromColor="#F8F5F0" toColor="#0D0905" />

      {/* ── CTA cinema ───────────────────────── */}
      <section
        id="ap-cta"
        className="py-24 px-6 text-center"
        style={{ backgroundColor: '#0D0905' }}
      >
        <div className="max-w-2xl mx-auto">
          <p className="cp-mono text-cp-mango text-xs tracking-widest uppercase mb-4">
            Prêt à nous confier votre véhicule ?
          </p>
          <h2
            className="cp-title font-black text-cp-cream leading-none mb-6"
            style={{ fontSize: 'clamp(2.5rem,5vw,5rem)' }}
          >
            PRENEZ
            <br />
            <span className="text-cp-mango">RENDEZ-VOUS</span>
          </h2>
          <p className="text-cp-cream/45 text-base leading-relaxed mb-10">
            Réparation, expertise, location ou achat — notre équipe est disponible du lundi au
            samedi.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/reparation"
              className="inline-flex items-center gap-2 bg-cp-mango text-white font-semibold text-sm px-6 py-3 rounded-full hover:bg-cp-mango/90 transition-colors"
            >
              Prendre RDV
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
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 border border-cp-cream/20 text-cp-cream font-semibold text-sm px-6 py-3 rounded-full hover:bg-cp-cream/8 transition-colors"
            >
              Nous écrire
            </Link>
          </div>
        </div>
      </section>

      <CpBridge fromColor="#0D0905" toColor="#1A0F06" />
      <CpFooter />
    </>
  );
}
