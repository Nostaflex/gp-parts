/**
 * API VIN decoder — proxy gratuit vers NHTSA vPIC (US gov).
 *
 * Pourquoi ce proxy:
 *  - Évite expositions côté client de l'URL externe (CSP friendly).
 *  - Normalise la réponse (NHTSA renvoie 100+ champs, on garde 8 utiles).
 *  - Permet d'ajouter un cache court terme en future (in-memory map).
 *
 * Quota: NHTSA vPIC n'a pas de rate limit publié. Aucune clé requise.
 *
 * Limitations:
 *  - Décode marque/modèle/année/motorisation depuis le VIN (WMI universel).
 *  - Ne donne PAS la consommation ni le CO2 (nécessiterait lookup ADEME local).
 *  - Couverture mondiale via WMI homologué; meilleur sur véhicules récents.
 */
import { NextResponse } from 'next/server';

const NHTSA_BASE = 'https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues';

type NhtsaResultRow = {
  Make?: string;
  Model?: string;
  ModelYear?: string;
  BodyClass?: string;
  FuelTypePrimary?: string;
  EngineCylinders?: string;
  DisplacementL?: string;
  DriveType?: string;
  TransmissionStyle?: string;
  Doors?: string;
  Series?: string;
  Trim?: string;
  ErrorCode?: string;
  ErrorText?: string;
};

type VinDecodeResponse =
  | {
      ok: true;
      vin: string;
      marque: string | null;
      modele: string | null;
      annee: number | null;
      carrosserie: string | null;
      energie: string | null;
      cylindres: string | null;
      cylindree: string | null;
      transmission: string | null;
      portes: number | null;
      finition: string | null;
    }
  | {
      ok: false;
      error: string;
      vin?: string;
    };

// VIN = 17 caractères alphanumériques sauf I, O, Q (anti-confusion)
const VIN_REGEX = /^[A-HJ-NPR-Z0-9]{17}$/i;

function normalizeFuel(raw?: string): string | null {
  if (!raw || raw === 'Not Applicable') return null;
  // NHTSA renvoie "Gasoline" / "Diesel" / "Electric" / "Hybrid Electric" — traduire FR
  const map: Record<string, string> = {
    Gasoline: 'Essence',
    Diesel: 'Diesel',
    Electric: 'Électrique',
    'Hybrid Electric': 'Hybride',
    'Plug-in Hybrid Electric': 'Hybride rechargeable',
    'Natural Gas': 'GNV',
    Ethanol: 'Éthanol',
  };
  return map[raw] ?? raw;
}

function normalizeBody(raw?: string): string | null {
  if (!raw || raw === 'Not Applicable') return null;
  // Garde le label NHTSA tel quel (ex: "Sedan/Saloon", "Sport Utility Vehicle (SUV)/Multi-Purpose Vehicle (MPV)")
  return raw;
}

function safeInt(raw?: string): number | null {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function GET(request: Request): Promise<NextResponse<VinDecodeResponse>> {
  const url = new URL(request.url);
  const vin = (url.searchParams.get('vin') ?? '').trim().toUpperCase();

  if (!vin) {
    return NextResponse.json(
      { ok: false, error: 'VIN requis (param `?vin=...`)' },
      { status: 400 }
    );
  }
  if (!VIN_REGEX.test(vin)) {
    return NextResponse.json(
      {
        ok: false,
        vin,
        error: 'VIN invalide. 17 caractères alphanumériques (sans I, O, Q).',
      },
      { status: 400 }
    );
  }

  try {
    const nhtsaUrl = `${NHTSA_BASE}/${encodeURIComponent(vin)}?format=json`;
    const res = await fetch(nhtsaUrl, {
      // NHTSA est lent (~300-800ms). Cache 24h côté Next.
      next: { revalidate: 86400 },
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, vin, error: `NHTSA HTTP ${res.status}` },
        { status: 502 }
      );
    }
    const data = (await res.json()) as { Results?: NhtsaResultRow[] };
    const row = data.Results?.[0];
    if (!row) {
      return NextResponse.json(
        { ok: false, vin, error: 'NHTSA: aucune donnée retournée' },
        { status: 502 }
      );
    }

    // NHTSA renvoie ErrorCode "0" si OK. "1" = invalide, "5"+ = warnings non bloquants.
    // On accepte tout sauf "1" car même un warning donne souvent des infos utiles.
    if (row.ErrorCode === '1') {
      return NextResponse.json(
        {
          ok: false,
          vin,
          error: row.ErrorText ?? 'VIN non reconnu par la base NHTSA',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      vin,
      marque: row.Make || null,
      modele: row.Model || null,
      annee: safeInt(row.ModelYear),
      carrosserie: normalizeBody(row.BodyClass),
      energie: normalizeFuel(row.FuelTypePrimary),
      cylindres: row.EngineCylinders || null,
      cylindree: row.DisplacementL ? `${row.DisplacementL} L` : null,
      transmission: row.TransmissionStyle || null,
      portes: safeInt(row.Doors),
      finition: row.Trim || row.Series || null,
    });
  } catch (exc) {
    const msg = exc instanceof Error ? exc.message : String(exc);
    return NextResponse.json({ ok: false, vin, error: `Network error: ${msg}` }, { status: 502 });
  }
}
