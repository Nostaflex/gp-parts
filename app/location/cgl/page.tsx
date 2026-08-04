import type { Metadata } from 'next';
import Link from 'next/link';
import { CpHeader } from '@/components/cp/CpHeader';
import { CpFooter } from '@/components/cp/CpFooter';
import { getLocationSettings } from '@/lib/server/location-settings';
import { formatPrice } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Conditions générales de location',
  alternates: { canonical: '/location/cgl' },
  description:
    'Conditions générales de location courte durée des véhicules Car Performance en Guadeloupe.',
};

export const dynamic = 'force-dynamic';

/** CGL courte durée — clauses essentielles (base Victoris/ANCT).
 * ⚠️ Draft opérationnel : à faire valider par un avocat avant montée en charge. */
export default async function CglPage() {
  const s = await getLocationSettings();
  return (
    <>
      <CpHeader darkSectionIds={[]} />
      <div style={{ backgroundColor: '#F8F5F0', minHeight: '60vh' }} className="pt-28 pb-16 px-6">
        <article className="max-w-3xl mx-auto">
          <p className="cp-mono text-cp-mango text-xs tracking-widest uppercase mb-3">
            Location de véhicules
          </p>
          <h1 className="cp-title font-black text-cp-ink text-4xl mb-8">
            Conditions générales de location
          </h1>

          <div className="flex flex-col gap-6 text-sm text-cp-ink/75 leading-relaxed">
            <section>
              <h2 className="font-bold text-cp-ink text-base mb-2">1 · Le loueur</h2>
              <p>
                Car Performance Guadeloupe — coordonnées et SIRET indiqués sur le contrat de
                location remis à la prise du véhicule et sur la facture.
              </p>
            </section>
            <section>
              <h2 className="font-bold text-cp-ink text-base mb-2">2 · Conditions du conducteur</h2>
              <p>
                Le conducteur principal doit être âgé d&apos;au moins {s.ageMinimum} ans à la date
                de départ et être titulaire d&apos;un permis B en cours de validité depuis au moins{' '}
                {s.permisAncienneteMinAnnees} an{s.permisAncienneteMinAnnees > 1 ? 's' : ''}. Le
                permis original et une pièce d&apos;identité sont vérifiés à la remise des clés.
                Seuls les conducteurs déclarés au contrat sont autorisés à conduire le véhicule.
              </p>
            </section>
            <section>
              <h2 className="font-bold text-cp-ink text-base mb-2">3 · Réservation et prix</h2>
              <p>
                Le prix total TTC est affiché avant la confirmation de la réservation. Il est
                calculé au jour de location. La réservation en ligne est confirmée par nos équipes
                (téléphone ou email) avant d&apos;être définitive. Aucun paiement n&apos;est exigé
                en ligne.
              </p>
            </section>
            <section>
              <h2 className="font-bold text-cp-ink text-base mb-2">4 · Caution</h2>
              <p>
                Une caution est demandée à la remise des clés sous forme d&apos;empreinte de carte
                bancaire au nom du conducteur principal. Son montant est indiqué lors de la
                réservation (à titre indicatif :{' '}
                {formatPrice(s.cautionsParCategorieEnCents.Citadine)} pour une citadine,{' '}
                {formatPrice(s.cautionsParCategorieEnCents.SUV)} pour un SUV). Elle est libérée à la
                restitution du véhicule dans l&apos;état de départ, sous réserve du délai bancaire.
              </p>
            </section>
            <section>
              <h2 className="font-bold text-cp-ink text-base mb-2">5 · État des lieux</h2>
              <p>
                Un état des lieux contradictoire (kilométrage, niveau de carburant, état de la
                carrosserie et de l&apos;habitacle) est établi et signé à la prise et à la
                restitution du véhicule.
              </p>
            </section>
            <section>
              <h2 className="font-bold text-cp-ink text-base mb-2">6 · Utilisation du véhicule</h2>
              <p>
                Le locataire s&apos;engage à utiliser le véhicule en bon père de famille,
                conformément au code de la route et à sa destination normale, à ne pas le
                sous-louer, ne pas transporter de personnes ou marchandises au-delà des capacités
                autorisées, et à ne pas quitter le territoire de la Guadeloupe sans accord écrit.
              </p>
            </section>
            <section>
              <h2 className="font-bold text-cp-ink text-base mb-2">7 · Assurance et franchise</h2>
              <p>
                Le véhicule est assuré en responsabilité civile. Une franchise reste à la charge du
                locataire en cas de sinistre ; son montant figure au contrat de location. Les
                amendes et infractions commises pendant la location sont à la charge du locataire
                (l&apos;identité du conducteur est communiquée aux autorités en cas
                d&apos;infraction, conformément à la loi).
              </p>
            </section>
            <section>
              <h2 className="font-bold text-cp-ink text-base mb-2">8 · Carburant et restitution</h2>
              <p>
                Le véhicule est remis avec un niveau de carburant relevé à l&apos;état des lieux et
                doit être restitué au même niveau, au lieu et à la date convenus. Tout retard non
                convenu peut être facturé.
              </p>
            </section>
            <section>
              <h2 className="font-bold text-cp-ink text-base mb-2">9 · Données personnelles</h2>
              <p>
                Les données collectées servent exclusivement au traitement de la réservation, à
                l&apos;exécution du contrat et au respect de nos obligations légales. Elles sont
                conservées 12 mois puis supprimées, et ne sont jamais transmises à des tiers à des
                fins commerciales. Aucune copie du permis de conduire n&apos;est stockée en ligne.
                Voir notre{' '}
                <Link href="/confidentialite" className="text-cp-mango underline">
                  politique de confidentialité
                </Link>
                .
              </p>
            </section>
            <section>
              <h2 className="font-bold text-cp-ink text-base mb-2">10 · Longue durée</h2>
              <p>
                Les locations de {30} jours et plus font l&apos;objet d&apos;un devis personnalisé
                et d&apos;un contrat spécifique précisant la durée, le montant des loyers, les
                conditions de résiliation et les frais éventuels de fin de contrat.
              </p>
            </section>
          </div>

          <p className="mt-10 text-xs text-cp-ink/40">
            Version du 31 juillet 2026. Pour toute question :{' '}
            <Link href="/contact" className="text-cp-mango underline">
              contactez-nous
            </Link>
            .
          </p>
        </article>
      </div>
      <CpFooter />
    </>
  );
}
