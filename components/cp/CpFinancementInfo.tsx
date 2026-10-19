import Link from 'next/link';

type Props = {
  /** Sujet du formulaire de contact (« Vente véhicule », « Vente moto »). */
  sujet: string;
  /** Marque + modèle, repris dans le message pré-rempli. */
  designation: string;
  /** Référence de l'annonce, reprise dans le message pré-rempli. */
  reference: string;
};

/**
 * Bloc « financement » SANS chiffre (audit du 12/10/2026, F6) : un taux ou une
 * mensualité affichés sont une publicité de crédit (C. conso L312-5 à L312-8)
 * et supposent un statut d'intermédiaire immatriculé (ORIAS). Tant qu'aucun
 * partenaire financier n'est nommé, le site ne promet qu'un dossier.
 */
export function CpFinancementInfo({ sujet, designation, reference }: Props) {
  const href = `/contact?sujet=${encodeURIComponent(sujet)}&vehicule=${encodeURIComponent(designation)}&ref=${encodeURIComponent(reference)}&financement=1`;
  return (
    <div className="bg-white rounded-2xl border border-[#E5DDD3] p-6 md:p-8 max-w-2xl mx-auto">
      <p className="cp-title font-black text-cp-ink text-2xl mb-3">Financement sur dossier</p>
      <ul className="text-sm text-cp-ink/70 leading-relaxed flex flex-col gap-2 mb-6">
        <li>
          Crédit classique, LOA ou LLD : nous montons le dossier avec nos partenaires financiers.
        </li>
        <li>
          Vous recevez une offre écrite, avec toutes les mentions légales, avant tout engagement.
        </li>
        <li>Reprise de votre véhicule actuel possible, sur estimation gratuite.</li>
      </ul>
      <Link
        href={href}
        className="inline-flex justify-center items-center bg-cp-ink text-cp-cream text-sm font-semibold px-6 py-3.5 rounded-xl hover:bg-cp-red transition-colors"
      >
        Demander un dossier de financement →
      </Link>
      <p className="text-[0.7rem] text-cp-ink/40 mt-4 leading-relaxed">
        Un crédit vous engage et doit être remboursé. Vérifiez vos capacités de remboursement avant
        de vous engager.
      </p>
    </div>
  );
}
