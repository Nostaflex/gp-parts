import { Resend } from 'resend';

// Singleton — instancié une seule fois côté serveur
let resendInstance: Resend | null = null;

export function getResend(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error('RESEND_API_KEY manquante');
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

export const EMAIL_FROM = 'Car Performance <commandes@carperformance.gp>';

/**
 * Adresse du gérant (Stephane) notifiée à chaque nouvelle commande.
 * Configurée via RESEND_ADMIN_EMAIL (cf. .env.example). Si absente, la
 * notification interne est silencieusement ignorée (le checkout ne casse pas).
 */
export const EMAIL_ADMIN = process.env.RESEND_ADMIN_EMAIL;
