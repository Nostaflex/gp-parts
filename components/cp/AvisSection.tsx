import Link from 'next/link';
import { CpReveal } from '@/components/cp/CpReveal';
import { getCachedAvisPublies } from '@/lib/data/avis-cache';
import { noteMoyenne, AVIS_PRESTATION_LABEL } from '@/lib/avis';

/**
 * Section « Avis clients » de la home — UNIQUEMENT des avis réels, déposés
 * sur /avis et publiés après modération au BO. Remplace les témoignages
 * fictifs (retirés 2026-08-13 — art. L121-4 C. conso). La mention de
 * transparence et la date de chaque avis sont des obligations L111-7-2.
 */
export async function AvisSection({ visible }: { visible: boolean }) {
  if (!visible) return null;
  const avis = await getCachedAvisPublies();
  const moyenne = noteMoyenne(avis);

  return (
    <>
      <section id="avis" className="py-24 px-6" style={{ backgroundColor: '#1A1208' }}>
        <div className="max-w-7xl mx-auto">
          <CpReveal>
            <h2
              className="cp-title text-cp-cream font-black leading-none mb-4"
              style={{ fontSize: 'clamp(2rem, 4vw, 4rem)' }}
            >
              AVIS CLIENTS
            </h2>
            {moyenne != null && (
              <p className="text-cp-cream/70 text-sm mb-2">
                <span className="text-cp-gold" aria-hidden="true">
                  {'★'.repeat(Math.round(moyenne))}
                </span>{' '}
                {moyenne.toLocaleString('fr-FR')} / 5 sur {avis.length} avis
              </p>
            )}
            <p className="text-cp-cream/40 text-xs mb-12 max-w-2xl">
              Avis déposés sur ce site par des clients, vérifiés et modérés par nos soins avant
              publication, sans contrepartie. Affichés du plus récent au plus ancien.
            </p>
          </CpReveal>

          {avis.length === 0 ? (
            <CpReveal>
              <div className="rounded-2xl p-8 border border-white/10 bg-white/5 max-w-xl">
                <p className="text-cp-cream/80 text-sm leading-relaxed mb-4">
                  Vous êtes passé chez nous ? Votre retour compte — il sera lu et publié après
                  modération.
                </p>
                <Link
                  href="/avis"
                  className="inline-block bg-cp-red text-cp-cream text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-cp-mango transition-colors"
                >
                  Laisser le premier avis
                </Link>
              </div>
            </CpReveal>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {avis.slice(0, 6).map((a, i) => (
                  <CpReveal key={a.id} delay={(i % 3) as 0 | 1 | 2}>
                    <div className="rounded-2xl p-6 border border-white/10 bg-white/5">
                      <p
                        className="text-cp-gold mb-3 text-sm tracking-widest"
                        aria-label={`Note : ${a.note} sur 5`}
                      >
                        {'★'.repeat(a.note)}
                        <span className="text-cp-cream/20">{'★'.repeat(5 - a.note)}</span>
                      </p>
                      <p className="text-cp-cream/80 text-sm leading-relaxed mb-4">{a.texte}</p>
                      {a.reponsePro && (
                        <p className="text-cp-cream/50 text-xs leading-relaxed mb-4 border-l-2 border-cp-gold/40 pl-3">
                          Réponse du garage : {a.reponsePro}
                        </p>
                      )}
                      <p className="text-cp-cream font-semibold text-sm">{a.prenom}</p>
                      <p className="text-cp-cream/40 text-xs">
                        {AVIS_PRESTATION_LABEL[a.prestation]}
                        {a.publishedAt &&
                          ` · ${new Date(a.publishedAt).toLocaleDateString('fr-FR', {
                            month: 'long',
                            year: 'numeric',
                          })}`}
                      </p>
                    </div>
                  </CpReveal>
                ))}
              </div>
              <CpReveal>
                <Link
                  href="/avis"
                  className="inline-block mt-10 text-cp-cream/60 text-sm underline underline-offset-4 hover:text-cp-mango transition-colors"
                >
                  Laisser un avis
                </Link>
              </CpReveal>
            </>
          )}
        </div>
      </section>
    </>
  );
}
