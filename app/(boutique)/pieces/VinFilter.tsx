'use client';

import { useState } from 'react';
import { ScanLine, X, Loader2 } from 'lucide-react';
import type { DecodedVehicle } from '@/lib/vin-compat';

type Props = {
  /** Appelé quand un véhicule est décodé (ou null si réinitialisé). */
  onVehicle: (v: DecodedVehicle | null) => void;
};

type ApiOk = {
  ok: true;
  vin: string;
  marque: string | null;
  modele: string | null;
  annee: number | null;
  carrosserie: string | null;
  energie: string | null;
};
type ApiErr = { ok: false; error: string };

// VIN = 17 caractères, sans I/O/Q.
const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/;

/**
 * Filtre par VIN — décode le VIN (proxy /api/vehicule/decode-vin) puis remonte
 * le véhicule au catalogue qui filtre `compatibility`. Rendu uniquement quand
 * le flag VIN_FILTER_ENABLED est actif (cf CatalogueClient).
 */
export function VinFilter({ onVehicle }: Props) {
  const [vin, setVin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decoded, setDecoded] = useState<ApiOk | null>(null);

  const clean = vin.toUpperCase().replace(/\s/g, '');
  const valid = VIN_RE.test(clean);

  async function decode() {
    if (!valid || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/vehicule/decode-vin?vin=${encodeURIComponent(clean)}`);
      const data = (await res.json()) as ApiOk | ApiErr;
      if (!data.ok) {
        setError(data.error);
        setDecoded(null);
        onVehicle(null);
        return;
      }
      if (!data.marque) {
        setError('VIN décodé mais marque introuvable — affinez avec la recherche texte.');
        setDecoded(null);
        onVehicle(null);
        return;
      }
      setDecoded(data);
      onVehicle({ marque: data.marque, modele: data.modele, annee: data.annee });
    } catch {
      setError('Service de décodage indisponible. Réessayez plus tard.');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setVin('');
    setDecoded(null);
    setError(null);
    onVehicle(null);
  }

  return (
    <div className="mb-6 rounded-2xl border border-[#E5DDD3] bg-white p-4">
      <div className="flex items-center gap-2 mb-2">
        <ScanLine size={16} className="text-cp-mango" aria-hidden="true" />
        <p className="text-sm font-semibold text-cp-ink">Trouver mes pièces par VIN</p>
        <span className="cp-mono text-[0.6rem] uppercase tracking-wider text-cp-ink/35 bg-[#F8F5F0] px-2 py-0.5 rounded-full">
          Bêta
        </span>
      </div>

      {decoded ? (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-[#F8F5F0] px-4 py-3">
          <p className="text-sm text-cp-ink">
            Pièces compatibles avec{' '}
            <strong>
              {[decoded.marque, decoded.modele, decoded.annee].filter(Boolean).join(' ')}
            </strong>
          </p>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1 text-xs font-semibold text-cp-ink/50 hover:text-cp-red transition-colors"
          >
            <X size={14} /> Effacer
          </button>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <label htmlFor="vin" className="sr-only">
              Numéro VIN (17 caractères)
            </label>
            <input
              id="vin"
              value={vin}
              onChange={(e) => {
                setVin(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => e.key === 'Enter' && decode()}
              maxLength={20}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              placeholder="VF3XXXXXXXXXXXXXX"
              aria-describedby="vin-help"
              className="flex-1 min-w-0 rounded-xl border border-[#E5DDD3] bg-white px-4 py-2.5 text-base uppercase tracking-wider text-cp-ink placeholder:text-cp-ink/25 outline-none transition-all focus:border-cp-mango focus:ring-2 focus:ring-cp-mango/10"
            />
            <button
              type="button"
              onClick={decode}
              disabled={!valid || loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-cp-ink px-5 py-2.5 text-sm font-semibold text-cp-cream transition-colors hover:bg-cp-red disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Trouver'}
            </button>
          </div>
          <p id="vin-help" className="mt-2 text-xs text-cp-ink/40">
            Le VIN (17 caractères) est sur la carte grise (repère E) ou le pare-brise.
          </p>
        </>
      )}

      {error && (
        <p role="alert" className="mt-2 text-xs text-cp-red">
          {error}
        </p>
      )}
    </div>
  );
}
