'use client';

/**
 * Admin — Posts sociaux (Instagram / Facebook / WhatsApp).
 *
 * Réalité 2026 : publier automatiquement sur Instagram/Facebook exige la
 * Meta Business API (app review, tokens à maintenir) — hors v1. La voie
 * gratuite : légende générée par réseau + visuel composé (canvas), puis
 *  - mobile : partage natif (Web Share API, fichier + texte) vers le réseau,
 *  - WhatsApp : lien wa.me pré-rempli,
 *  - Facebook : boîte de partage (sharer) avec l'URL de la fiche,
 *  - Instagram : copier la légende + partager/télécharger le visuel.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Vehicule } from '@/lib/vehicules';
import type { Moto } from '@/lib/motos';
import type { SocialSettings } from '@/lib/social-settings';
import type { SocialItem, SocialNetwork } from '@/lib/social-posts';
import { generateSocialPost, NETWORK_LABELS } from '@/lib/social-posts';
import { SocialSettingsForm } from '@/components/admin/SocialSettingsForm';

const IOS = {
  bg: 'var(--bg)',
  surface: 'var(--surface)',
  text: 'var(--text)',
  blue: 'var(--blue)',
  border: 'var(--border)',
  textMuted: 'rgba(28, 28, 30, 0.6)',
  textSubtle: 'rgba(28, 28, 30, 0.5)',
  success: '#34C759',
  danger: '#FF3B30',
};

const NETWORKS: SocialNetwork[] = ['instagram', 'facebook', 'whatsapp'];
const CANVAS_SIZE = 1080;

function asItems(vehicules: Vehicule[], motos: Moto[]): SocialItem[] {
  return [
    ...vehicules.map((v): SocialItem => ({ kind: 'vehicule', data: v })),
    ...motos.map((m): SocialItem => ({ kind: 'moto', data: m })),
  ];
}

/** Dessine la photo en cover (recadrage centré) sur tout le canvas. */
function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, size: number) {
  const scale = Math.max(size / img.width, size / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
}

function drawOverlay(ctx: CanvasRenderingContext2D, item: SocialItem, size: number) {
  const d = item.data;

  // Bandeau dégradé bas — texte lisible quelle que soit la photo.
  const grad = ctx.createLinearGradient(0, size * 0.55, 0, size);
  grad.addColorStop(0, 'rgba(13, 9, 5, 0)');
  grad.addColorStop(1, 'rgba(13, 9, 5, 0.92)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, size * 0.55, size, size * 0.45);

  // Marque site en haut à gauche.
  ctx.fillStyle = 'rgba(248, 237, 216, 0.95)';
  ctx.font = '600 34px system-ui, sans-serif';
  ctx.fillText('CAR PERFORMANCE · GUADELOUPE', 48, 78);

  // Badge NEUF éventuel.
  if (d.type === 'neuf') {
    ctx.fillStyle = '#C8392E';
    ctx.beginPath();
    ctx.roundRect(size - 220, 40, 172, 60, 30);
    ctx.fill();
    ctx.fillStyle = '#F8EDD8';
    ctx.font = '700 34px system-ui, sans-serif';
    ctx.fillText('NEUF', size - 178, 82);
  }

  // Titre + specs en bas.
  ctx.fillStyle = '#F8EDD8';
  ctx.font = '800 64px system-ui, sans-serif';
  ctx.fillText(`${d.marque} ${d.modele}`, 48, size - 150, size - 96);
  ctx.font = '400 38px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(248, 237, 216, 0.75)';
  const kmPart = d.km > 0 ? ` · ${d.km.toLocaleString('fr-FR')} km` : '';
  ctx.fillText(`${d.annee}${kmPart}`, 48, size - 90);

  // Prix — pastille rouge.
  const prixTxt = `${d.prix.toLocaleString('fr-FR')} €`;
  ctx.font = '800 52px system-ui, sans-serif';
  const w = ctx.measureText(prixTxt).width + 64;
  ctx.fillStyle = '#C8392E';
  ctx.beginPath();
  ctx.roundRect(size - w - 48, size - 148, w, 88, 44);
  ctx.fill();
  ctx.fillStyle = '#F8EDD8';
  ctx.fillText(prixTxt, size - w - 16, size - 88);
}

type Props = { vehicules: Vehicule[]; motos: Moto[]; settings: SocialSettings };

export function SocialPostsClient({ vehicules, motos, settings }: Props) {
  const items = useMemo(() => asItems(vehicules, motos), [vehicules, motos]);
  const [selectedId, setSelectedId] = useState<string>(items[0]?.data.id ?? '');
  const [network, setNetwork] = useState<SocialNetwork>('instagram');
  const [copied, setCopied] = useState(false);
  const [canvasError, setCanvasError] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const selected = items.find((i) => i.data.id === selectedId) ?? items[0];
  const post = useMemo(
    () => (selected ? generateSocialPost(selected, network, settings) : null),
    [selected, network, settings]
  );

  // Compose le visuel à chaque changement d'annonce.
  useEffect(() => {
    if (!selected || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setCanvasError(null);

    const img = new window.Image();
    // Autorise l'export du canvas si la photo vient d'un autre domaine
    // (Unsplash, Firebase Storage) — sinon canvas « tainted » = export mort.
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      drawCover(ctx, img, CANVAS_SIZE);
      drawOverlay(ctx, selected, CANVAS_SIZE);
    };
    img.onerror = () => {
      setCanvasError(
        'Photo introuvable ou bloquée (CORS) — visuel indisponible, la légende reste utilisable.'
      );
    };
    img.src = selected.data.image;
  }, [selected]);

  const copyCaption = async () => {
    if (!post) return;
    await navigator.clipboard.writeText(post.caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canvasBlob = () =>
    new Promise<Blob | null>((resolve) => canvasRef.current?.toBlob(resolve, 'image/png'));

  const downloadVisual = async () => {
    setShareError(null);
    try {
      const blob = await canvasBlob();
      if (!blob || !selected) throw new Error('export canvas vide');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `post-${selected.data.id}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setShareError('Export du visuel impossible (photo bloquée ?). Utilisez la photo originale.');
    }
  };

  // Partage natif mobile : visuel + légende vers l'app choisie (Instagram,
  // Facebook, WhatsApp…). Sur desktop sans Web Share : message explicite.
  const shareNative = async () => {
    setShareError(null);
    if (!post) return;
    try {
      const blob = await canvasBlob();
      if (!blob) throw new Error('export canvas vide');
      const file = new File([blob], `post-${selected?.data.id ?? 'annonce'}.png`, {
        type: 'image/png',
      });
      if (navigator.canShare?.({ files: [file] })) {
        // Instagram ignore le texte partagé : la légende se colle depuis le
        // presse-papiers — on la copie d'office avant d'ouvrir le partage.
        await navigator.clipboard.writeText(post.caption);
        await navigator.share({ files: [file], text: post.caption });
      } else {
        setShareError(
          'Partage natif indisponible sur cet appareil — téléchargez le visuel et copiez la légende.'
        );
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setShareError('Partage impossible — téléchargez le visuel et copiez la légende.');
      }
    }
  };

  const waHref = post?.url ? `https://wa.me/?text=${encodeURIComponent(post.caption)}` : undefined;
  const fbHref = post?.url
    ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(post.url)}`
    : undefined;

  return (
    <div>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold" style={{ color: IOS.text }}>
            Posts sociaux
          </h1>
          <p className="text-sm mt-2 max-w-3xl" style={{ color: IOS.textMuted }}>
            Prépare un post par réseau pour une annonce : légende adaptée (hashtags Instagram, lien
            Facebook, message WhatsApp) + visuel prêt à publier. Sur téléphone,
            «&nbsp;Partager&nbsp;» ouvre directement Instagram, Facebook ou WhatsApp.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Sidebar — sélecteur d'annonce */}
          <aside>
            <div
              className="rounded-2xl p-4 border"
              style={{ background: IOS.surface, borderColor: IOS.border }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: IOS.textSubtle }}
              >
                Choisir une annonce
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

          {/* Main — réseau, visuel, légende, config */}
          <div className="flex flex-col gap-4">
            {/* Segmented control réseau */}
            <div
              className="rounded-2xl p-2 border grid grid-cols-3 gap-1"
              style={{ background: IOS.surface, borderColor: IOS.border }}
            >
              {NETWORKS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNetwork(n)}
                  className="py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  style={{
                    background: network === n ? IOS.blue : 'transparent',
                    color: network === n ? '#fff' : IOS.text,
                  }}
                >
                  {NETWORK_LABELS[n]}
                </button>
              ))}
            </div>

            {/* Visuel */}
            <div
              className="rounded-2xl p-6 border"
              style={{ background: IOS.surface, borderColor: IOS.border }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <p
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: IOS.textSubtle }}
                >
                  Visuel 1080×1080
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={downloadVisual}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border"
                    style={{ color: IOS.blue, borderColor: IOS.border }}
                  >
                    Télécharger
                  </button>
                  <button
                    type="button"
                    onClick={shareNative}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                    style={{ background: IOS.blue }}
                  >
                    Partager…
                  </button>
                </div>
              </div>
              <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                className="w-full max-w-[420px] rounded-xl border"
                style={{ borderColor: IOS.border }}
              />
              {canvasError && (
                <p className="text-xs mt-2" style={{ color: IOS.danger }}>
                  ⚠️ {canvasError}
                </p>
              )}
              {shareError && (
                <p className="text-xs mt-2" style={{ color: IOS.danger }}>
                  ⚠️ {shareError}
                </p>
              )}
            </div>

            {/* Légende */}
            <div
              className="rounded-2xl p-6 border"
              style={{ background: IOS.surface, borderColor: IOS.border }}
            >
              <div className="flex items-center justify-between mb-3">
                <p
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: IOS.textSubtle }}
                >
                  Légende {NETWORK_LABELS[network]} ({post?.charCount ?? 0} chars
                  {network === 'instagram' ? ` · ${post?.hashtagCount ?? 0} hashtags` : ''})
                </p>
                <button
                  type="button"
                  onClick={copyCaption}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                  style={{ background: copied ? IOS.success : IOS.blue }}
                >
                  {copied ? '✓ Copié' : 'Copier'}
                </button>
              </div>
              <pre
                className="text-sm whitespace-pre-wrap font-sans p-4 rounded-lg max-h-[360px] overflow-auto"
                style={{ background: '#F5F5F7', color: IOS.text, lineHeight: 1.7 }}
              >
                {post?.caption ?? '—'}
              </pre>
              {post?.warnings.map((w) => (
                <p key={w} className="text-xs mt-2" style={{ color: IOS.danger }}>
                  ⚠️ {w}
                </p>
              ))}

              {/* Actions spécifiques au réseau */}
              <div className="flex flex-wrap gap-2 mt-4">
                {network === 'whatsapp' && waHref && (
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                    style={{ background: '#25D366' }}
                  >
                    Ouvrir WhatsApp pré-rempli
                  </a>
                )}
                {network === 'facebook' && fbHref && (
                  <a
                    href={fbHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                    style={{ background: '#1877F2' }}
                  >
                    Partager la fiche sur Facebook
                  </a>
                )}
                {network === 'instagram' && (
                  <p className="text-xs" style={{ color: IOS.textMuted }}>
                    Instagram n&apos;accepte pas de post pré-rempli depuis le web : copiez la
                    légende, puis «&nbsp;Partager…&nbsp;» (ou téléchargez le visuel) et collez la
                    légende dans l&apos;app.
                  </p>
                )}
              </div>
            </div>

            {/* Config réseaux */}
            <div className="pt-2">
              <h2 className="text-lg font-bold mb-1" style={{ color: IOS.text }}>
                Réglages des posts
              </h2>
              <p className="text-sm mb-3" style={{ color: IOS.textMuted }}>
                Hashtags Instagram et signature ajoutés automatiquement à chaque post. Les liens des
                comptes (Facebook, Instagram) se gèrent dans Paramètres → Coordonnées.
              </p>
              <SocialSettingsForm initial={settings} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
