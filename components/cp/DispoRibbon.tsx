/**
 * Ruban de coin « VENDU » / « RÉSERVÉ » pour les cartes véhicule/moto.
 *
 * Pattern des marketplaces auto (LaCentrale, AutoScout24, dealers premium) :
 * un ruban diagonal DANS LE COIN de la photo — le véhicule reste la star,
 * le statut se lit d'un coup d'œil sans barrer l'image (remplace le bandeau
 * plein centre -rotate-6, jugé lourd — retour Djemil 2026-08-04).
 *
 * - VENDU : dégradé rouge Car Performance (accent conservé), texte crème.
 * - RÉSERVÉ : dégradé gold, texte ink — la carte reste cliquable (un acheteur
 *   de secours peut encore consulter la fiche).
 */
export function DispoRibbon({ statut }: { statut: 'vendu' | 'reserve' }) {
  const vendu = statut === 'vendu';
  return (
    <div
      aria-hidden="true"
      className="absolute top-0 right-0 w-[110px] h-[110px] overflow-hidden pointer-events-none z-10"
    >
      <span
        className={`absolute block text-center cp-title font-black text-[0.68rem] tracking-[0.28em] uppercase rotate-45 top-[24px] right-[-38px] w-[160px] py-[5px] shadow-[0_2px_10px_rgba(26,15,6,0.35)] ${
          vendu ? 'text-cp-cream' : 'text-cp-ink'
        }`}
        style={{
          background: vendu
            ? 'linear-gradient(135deg, #E2493B 0%, #D92627 55%, #B81F20 100%)'
            : 'linear-gradient(135deg, #F2D48B 0%, #E9C46A 55%, #C8A040 100%)',
          // Finition « ruban cousu » : liséré clair en haut, ombre portée en bas
          borderTop: '1px solid rgba(255,255,255,0.4)',
          borderBottom: '1px solid rgba(26,15,6,0.18)',
        }}
      >
        {vendu ? 'Vendu' : 'Réservé'}
      </span>
    </div>
  );
}
