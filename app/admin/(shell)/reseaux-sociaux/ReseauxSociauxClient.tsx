'use client';

import { useState } from 'react';
import { publishSocialPost, disconnectSocial } from '@/app/admin/reseaux-sociaux/actions';

export interface SocialItem {
  id: string;
  type: 'vehicule' | 'moto';
  label: string;
  images: string[];
  defaultCaption: string;
}

interface Props {
  connection: { igUsername: string; pageName: string } | null;
  items: SocialItem[];
  posted: Record<string, string>; // itemId -> date ISO du dernier post
}

const S = {
  bg: 'var(--bg)',
  surface: 'var(--surface)',
  text: 'var(--text)',
  blue: 'var(--blue)',
  border: 'var(--border)',
  muted: 'rgba(28,28,30,0.6)',
};

export function ReseauxSociauxClient({ connection, items, posted }: Props) {
  const [selectedId, setSelectedId] = useState<string>(items[0]?.id ?? '');
  const selected = items.find((i) => i.id === selectedId) ?? items[0];
  const [caption, setCaption] = useState<string>(selected?.defaultCaption ?? '');
  const [images, setImages] = useState<string[]>(selected?.images ?? []);
  const [toIg, setToIg] = useState(true);
  const [toFb, setToFb] = useState(true);
  const [status, setStatus] = useState<string>('');
  const [busy, setBusy] = useState(false);

  function select(id: string) {
    const it = items.find((i) => i.id === id);
    setSelectedId(id);
    setCaption(it?.defaultCaption ?? '');
    setImages(it?.images ?? []);
    setStatus('');
  }

  async function onPublish() {
    if (!selected) return;
    setBusy(true);
    setStatus('Publication en cours…');
    try {
      const r = await publishSocialPost({
        itemId: selected.id,
        itemType: selected.type,
        imageUrls: images,
        caption,
        toInstagram: toIg,
        toFacebook: toFb,
      });
      setStatus(r.ok ? '✅ Publié' : `⚠️ ${r.error ?? r.result?.errors.join(' · ')}`);
    } catch {
      setStatus('⚠️ Erreur inattendue');
    } finally {
      setBusy(false);
    }
  }

  if (!connection) {
    return (
      <div className="p-6 max-w-2xl">
        <h1 className="text-2xl font-bold mb-3" style={{ color: S.text }}>
          Réseaux sociaux
        </h1>
        <p className="text-sm mb-6" style={{ color: S.muted }}>
          Connecte ton compte Instagram Business + ta Page Facebook pour publier tes véhicules en un
          clic. La publication ne fonctionne que depuis le site en ligne (pas en local).
        </p>
        <a
          href="/api/admin/social/connect"
          className="inline-flex px-5 py-3 rounded-xl text-white font-semibold"
          style={{ background: S.blue }}
        >
          Connecter Instagram + Facebook
        </a>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: S.text }}>
            Réseaux sociaux
          </h1>
          <p className="text-sm" style={{ color: S.muted }}>
            Connecté : @{connection.igUsername} · {connection.pageName}
          </p>
        </div>
        <button
          type="button"
          onClick={() => disconnectSocial().then(() => location.reload())}
          className="text-sm underline"
          style={{ color: S.muted }}
        >
          Déconnecter
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <aside
          className="rounded-2xl p-3 border"
          style={{ background: S.surface, borderColor: S.border }}
        >
          <div className="flex flex-col gap-1 max-h-[600px] overflow-auto">
            {items.map((it) => (
              <button
                key={it.id}
                type="button"
                onClick={() => select(it.id)}
                className="text-left p-3 rounded-lg"
                style={{
                  background: selectedId === it.id ? 'rgba(0,122,255,0.1)' : 'transparent',
                  color: S.text,
                }}
              >
                <div className="text-sm font-medium">{it.label}</div>
                {posted[it.id] && (
                  <div className="text-xs mt-0.5" style={{ color: S.muted }}>
                    déjà posté le {new Date(posted[it.id]).toLocaleDateString('fr-FR')}
                  </div>
                )}
              </button>
            ))}
          </div>
        </aside>

        <section className="flex flex-col gap-4">
          <div
            className="rounded-2xl p-5 border"
            style={{ background: S.surface, borderColor: S.border }}
          >
            <p className="text-xs font-semibold uppercase mb-2" style={{ color: S.muted }}>
              Caption
            </p>
            <textarea
              aria-label="Caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={10}
              className="w-full p-3 rounded-lg text-sm"
              style={{ background: '#F5F5F7', color: S.text }}
            />
          </div>

          <div
            className="rounded-2xl p-5 border"
            style={{ background: S.surface, borderColor: S.border }}
          >
            <p className="text-xs font-semibold uppercase mb-3" style={{ color: S.muted }}>
              Photos ({images.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {selected?.images.map((src) => {
                const on = images.includes(src);
                return (
                  <button
                    key={src}
                    type="button"
                    onClick={() =>
                      setImages((cur) => (on ? cur.filter((s) => s !== src) : [...cur, src]))
                    }
                    className="w-20 h-20 rounded-lg overflow-hidden border-2"
                    style={{ borderColor: on ? S.blue : 'transparent' }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm" style={{ color: S.text }}>
              <input type="checkbox" checked={toIg} onChange={(e) => setToIg(e.target.checked)} />{' '}
              Instagram
            </label>
            <label className="flex items-center gap-2 text-sm" style={{ color: S.text }}>
              <input type="checkbox" checked={toFb} onChange={(e) => setToFb(e.target.checked)} />{' '}
              Facebook
            </label>
            <button
              type="button"
              onClick={onPublish}
              disabled={busy || images.length === 0}
              className="ml-auto px-5 py-2.5 rounded-xl text-white font-semibold disabled:opacity-50"
              style={{ background: S.blue }}
            >
              Publier
            </button>
          </div>

          {status && (
            <p className="text-sm" style={{ color: S.text }}>
              {status}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
