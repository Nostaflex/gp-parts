'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { publishAvis, rejectAvis, saveAvisReponse } from './actions';
import { AVIS_PRESTATION_LABEL } from '@/lib/avis';
import type { Avis, AvisStatus } from '@/lib/avis';

const STATUS_LABEL: Record<AvisStatus, string> = {
  nouveau: 'À modérer',
  publie: 'Publié',
  rejete: 'Rejeté',
};
const STATUS_COLOR: Record<AvisStatus, string> = {
  nouveau: 'var(--blue)',
  publie: 'var(--green)',
  rejete: 'var(--red)',
};

export function AvisModClient({ avis }: { avis: (Avis & { email?: string })[] }) {
  const [filter, setFilter] = useState<AvisStatus | 'all'>('nouveau');
  const visible = avis.filter((a) => filter === 'all' || a.status === filter);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 flex-wrap">
        {(['nouveau', 'publie', 'rejete', 'all'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className="h-11 px-4 rounded-[10px] text-body-sm font-medium"
            style={{
              background: filter === s ? 'var(--blue)' : 'var(--surface)',
              color: filter === s ? '#fff' : 'var(--text)',
              border: '1px solid rgba(198,198,200,0.5)',
            }}
          >
            {s === 'all' ? 'Tous' : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {visible.length === 0 && (
        <p className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
          Aucun avis dans cette catégorie.
        </p>
      )}

      {visible.map((a) => (
        <AvisRow key={a.id} a={a} />
      ))}
    </div>
  );
}

function AvisRow({ a }: { a: Avis & { email?: string } }) {
  const router = useRouter();
  const [reponse, setReponse] = useState(a.reponsePro);
  const [pending, startTransition] = useTransition();

  const act = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    if (pending) return;
    startTransition(async () => {
      const res = await fn();
      if (!res.ok && res.error) window.alert(res.error);
      router.refresh();
    });
  };

  return (
    <div
      className="rounded-[14px] p-4 flex flex-col gap-3"
      style={{ background: 'var(--surface)', border: '1px solid rgba(198,198,200,0.5)' }}
    >
      <div className="flex items-center gap-3 flex-wrap">
        <span
          className="text-caption font-semibold px-2 py-0.5 rounded-full"
          style={{ color: '#fff', background: STATUS_COLOR[a.status] }}
        >
          {STATUS_LABEL[a.status]}
        </span>
        <span className="text-body-sm font-medium" style={{ color: 'var(--text)' }}>
          {a.prenom}
        </span>
        <span aria-label={`Note ${a.note} sur 5`} style={{ color: '#E9C46A' }}>
          {'★'.repeat(a.note)}
        </span>
        <span className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
          {AVIS_PRESTATION_LABEL[a.prestation]} ·{' '}
          {a.createdAt && new Date(a.createdAt).toLocaleDateString('fr-FR')}
          {a.email ? ` · ${a.email}` : ''}
        </span>
      </div>

      {/* Le texte de l'avis est affiché tel quel — JAMAIS éditable (L121-4). */}
      <p className="text-body-sm" style={{ color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
        {a.texte}
      </p>

      <div className="flex gap-2 flex-wrap">
        {a.status !== 'publie' && (
          <button
            type="button"
            disabled={pending}
            onClick={() => act(() => publishAvis(a.id, a.updatedAt))}
            className="h-11 px-4 rounded-[10px] text-body-sm font-semibold text-white disabled:opacity-60"
            style={{ background: 'var(--green)' }}
          >
            Publier
          </button>
        )}
        {a.status !== 'rejete' && (
          <button
            type="button"
            disabled={pending}
            onClick={() => act(() => rejectAvis(a.id, a.updatedAt))}
            className="h-11 px-4 rounded-[10px] text-body-sm font-semibold disabled:opacity-60"
            style={{ color: 'var(--red)', border: '1px solid var(--border)' }}
          >
            {a.status === 'publie' ? 'Dépublier' : 'Rejeter'}
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor={`rep-${a.id}`}
          className="text-body-sm font-medium"
          style={{ color: 'var(--text)' }}
        >
          Réponse du garage (affichée sous l&apos;avis publié)
        </label>
        <textarea
          id={`rep-${a.id}`}
          value={reponse}
          onChange={(e) => setReponse(e.target.value)}
          rows={2}
          maxLength={500}
          className="rounded-[10px] p-2 text-body-sm"
          style={{ border: '1px solid rgba(198,198,200,0.6)', color: 'var(--text)' }}
        />
        <button
          type="button"
          disabled={pending || reponse === a.reponsePro}
          onClick={() => act(() => saveAvisReponse(a.id, reponse, a.updatedAt))}
          className="self-start h-11 px-4 rounded-[10px] text-body-sm font-medium disabled:opacity-40"
          style={{ color: 'var(--blue)', border: '1px solid var(--border)' }}
        >
          Enregistrer la réponse
        </button>
      </div>
    </div>
  );
}
