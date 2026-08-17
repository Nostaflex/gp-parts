import { cn } from '@/lib/utils';

type CpBulleProps = {
  /** Nom de la mascotte (Splash, Max). */
  nom: string;
  /** Rôle officiel — « L'expert de l'entretien auto » / « L'expert de la mobilité ». */
  role: string;
  /** Réplique SANS guillemets — la bulle ajoute « … » elle-même. */
  replique: string;
  className?: string;
};

/**
 * Bulle de dialogue mascotte (handoff design 2026-08-17, maquette cp-v4 `.bub`).
 * TOUJOURS placée au-dessus de la mascotte, jamais superposée au visage :
 * la pointe triangulaire (::after, 22×12) vise la tête. Le positionnement
 * (largeur max, marges) appartient à l'appelant via className.
 */
export function CpBulle({ nom, role, replique, className }: CpBulleProps) {
  return (
    <div
      className={cn(
        'relative z-[3] rounded-2xl bg-white px-[15px] py-[13px] text-cp-ink',
        'shadow-[0_18px_34px_-18px_rgba(26,15,6,.5)]',
        // Pointe triangulaire centrée, 22×12 px, vers le bas.
        'after:absolute after:-bottom-[11px] after:left-1/2 after:-ml-[11px]',
        'after:h-0 after:w-0 after:border-l-[11px] after:border-r-[11px] after:border-t-[12px]',
        "after:border-l-transparent after:border-r-transparent after:border-t-white after:content-['']",
        className
      )}
    >
      <b className="block font-title text-[.95rem] font-black uppercase leading-none">{nom}</b>
      <span className="mt-[5px] block font-mono text-[.66rem] uppercase tracking-[.1em] text-cp-red-d">
        {role}
      </span>
      <p className="mt-[7px] text-[.78rem] italic leading-[1.45]">{`« ${replique} »`}</p>
    </div>
  );
}
