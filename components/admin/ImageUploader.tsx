'use client';

import { useRef, useState } from 'react';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { Upload, X, Loader2 } from 'lucide-react';

import app from '@/lib/firebase';

const IOS = {
  surface: 'var(--surface)',
  bg: 'var(--bg)',
  text: 'var(--text)',
  blue: 'var(--blue)',
  textMuted: 'rgba(28, 28, 30, 0.6)',
  borderFaint: 'rgba(198, 198, 200, 0.5)',
  danger: '#FF3B30',
} as const;

const MAX_BYTES = 25 * 1024 * 1024; // cap iOS Safari (spec §9)
const ACCEPTED = ['image/webp', 'image/jpeg', 'image/png'];

const COMPRESSION = {
  maxWidthOrHeight: 2000,
  initialQuality: 0.85,
  fileType: 'image/webp' as const,
  useWebWorker: true,
};

type Slot = { url: string; uploading: boolean; progress: number; error?: string };

/**
 * Upload photos — compression navigateur (WebP ≤2000px, q0.85) puis upload
 * direct Firebase Storage resumable (spec §9). Path final déterministe
 * `{folder}/{entityId}/photo-{i}.webp` (pas d'orphelins — risque §12).
 *
 * Émet `onChange(urls)` à chaque changement. Stocke ces URLs dans le doc
 * Firestore au save du form parent. Resumable = reprise auto si Safari
 * met l'onglet en arrière-plan.
 */
export function ImageUploader({
  folder,
  entityId,
  value,
  onChange,
  max = 5,
}: {
  folder: 'vehicules' | 'motos' | 'products' | 'location';
  entityId: string;
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}) {
  const [slots, setSlots] = useState<Slot[]>(
    value.map((url) => ({ url, uploading: false, progress: 100 }))
  );
  const inputRef = useRef<HTMLInputElement>(null);

  function commit(next: Slot[]) {
    setSlots(next);
    onChange(next.filter((s) => !s.uploading && !s.error).map((s) => s.url));
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const storage = getStorage(app);
    const room = max - slots.length;
    const picked = Array.from(files).slice(0, room);

    for (const file of picked) {
      if (!ACCEPTED.includes(file.type)) {
        commit([
          ...slots,
          { url: '', uploading: false, progress: 0, error: `${file.name}: format non supporté` },
        ]);
        continue;
      }
      if (file.size > MAX_BYTES) {
        commit([
          ...slots,
          { url: '', uploading: false, progress: 0, error: `${file.name}: > 25 Mo` },
        ]);
        continue;
      }

      const slotIndex = slots.length;
      setSlots((prev) => [...prev, { url: '', uploading: true, progress: 0 }]);

      try {
        const compressed = await imageCompression(file, COMPRESSION);
        const path = `${folder}/${entityId}/photo-${slotIndex + 1}.webp`;
        const task = uploadBytesResumable(ref(storage, path), compressed, {
          contentType: 'image/webp',
        });

        await new Promise<void>((resolve, reject) => {
          task.on(
            'state_changed',
            (snap) => {
              const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
              setSlots((prev) =>
                prev.map((s, i) => (i === slotIndex ? { ...s, progress: pct } : s))
              );
            },
            reject,
            resolve
          );
        });

        const url = await getDownloadURL(task.snapshot.ref);
        setSlots((prev) => {
          const next = prev.map((s, i) =>
            i === slotIndex ? { url, uploading: false, progress: 100 } : s
          );
          onChange(next.filter((s) => !s.uploading && !s.error).map((s) => s.url));
          return next;
        });
      } catch {
        setSlots((prev) =>
          prev.map((s, i) =>
            i === slotIndex
              ? { url: '', uploading: false, progress: 0, error: `${file.name}: échec upload` }
              : s
          )
        );
      }
    }
    if (inputRef.current) inputRef.current.value = '';
  }

  function removeAt(index: number) {
    commit(slots.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {slots.map((slot, i) => (
          <div
            key={i}
            className="relative aspect-square rounded-[10px] overflow-hidden flex items-center justify-center"
            style={{ background: IOS.bg, border: `1px solid ${IOS.borderFaint}` }}
          >
            {slot.error ? (
              <span className="text-caption text-center px-2" style={{ color: IOS.danger }}>
                {slot.error}
              </span>
            ) : slot.uploading ? (
              <div className="flex flex-col items-center gap-1">
                <Loader2 size={20} className="animate-spin" style={{ color: IOS.blue }} />
                <span className="text-caption" style={{ color: IOS.textMuted }}>
                  {slot.progress}%
                </span>
              </div>
            ) : (
              <>
                {/* next/image inutilisable : URL Storage dynamique runtime */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={slot.url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  aria-label={`Supprimer la photo ${i + 1}`}
                  className="absolute top-1 right-1 w-7 h-7 flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  style={{ background: 'rgba(0, 0, 0, 0.55)', color: '#fff' }}
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
              </>
            )}
          </div>
        ))}

        {slots.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="aspect-square rounded-[10px] flex flex-col items-center justify-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]"
            style={{
              background: IOS.surface,
              border: `1px dashed ${IOS.borderFaint}`,
              color: IOS.textMuted,
            }}
          >
            <Upload size={20} strokeWidth={1.75} />
            <span className="text-caption">Ajouter</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />
      <p className="text-caption" style={{ color: IOS.textMuted }}>
        {slots.length}/{max} photos · WebP auto, 2000px max, 25 Mo/fichier
      </p>
    </div>
  );
}
