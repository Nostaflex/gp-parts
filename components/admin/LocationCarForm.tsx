'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { FormShell, FieldError, SubmitButton } from '@/components/admin/FormShell';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { createLocationCar, updateLocationCar } from '@/app/admin/location/actions';

import type { LocationCar } from '@/lib/location-cars';

const FIELD =
  'h-11 px-3 rounded-[10px] border bg-[var(--surface)] text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]';
const LABEL = 'text-body-sm font-medium text-[var(--text)] mb-1 block';

// centimes → euros pour pré-remplir le champ (édition)
const toEuros = (cents?: number) => (cents != null ? cents / 100 : undefined);

export function LocationCarForm({ initial }: { initial?: LocationCar }) {
  const router = useRouter();
  const isEdit = !!initial;

  const [carId] = useState(() => initial?.id ?? `location-${Date.now().toString(36)}`);
  const [images, setImages] = useState<string[]>(initial?.image ? [initial.image] : []);

  return (
    <FormShell
      action={isEdit ? updateLocationCar : createLocationCar}
      onSuccess={() => router.push('/admin/location')}
      successMessage={isEdit ? 'Voiture mise à jour.' : 'Voiture créée.'}
    >
      <input type="hidden" name="id" value={carId} />
      {isEdit && <input type="hidden" name="clientUpdatedAt" value={initial!.updatedAt} />}
      {images.map((url) => (
        <input key={url} type="hidden" name="images" value={url} />
      ))}

      <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <legend className={LABEL}>Identité</legend>
        <div>
          <label className={LABEL} htmlFor="marque">
            Marque
          </label>
          <input id="marque" name="marque" defaultValue={initial?.marque} className={FIELD} />
          <FieldError name="marque" />
        </div>
        <div>
          <label className={LABEL} htmlFor="modele">
            Modèle
          </label>
          <input id="modele" name="modele" defaultValue={initial?.modele} className={FIELD} />
          <FieldError name="modele" />
        </div>
        <div>
          <label className={LABEL} htmlFor="reference">
            Référence
          </label>
          <input
            id="reference"
            name="reference"
            defaultValue={initial?.reference}
            className={FIELD}
          />
          <FieldError name="reference" />
        </div>
        <div>
          <label className={LABEL} htmlFor="categorie">
            Catégorie
          </label>
          <select
            id="categorie"
            name="categorie"
            defaultValue={initial?.categorie ?? 'Citadine'}
            className={FIELD}
          >
            <option value="Citadine">Citadine</option>
            <option value="Berline">Berline</option>
            <option value="SUV">SUV</option>
            <option value="Utilitaire">Utilitaire</option>
          </select>
          <FieldError name="categorie" />
        </div>
      </fieldset>

      <fieldset className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <legend className={LABEL}>Caractéristiques</legend>
        <div>
          <label className={LABEL} htmlFor="places">
            Places
          </label>
          <input
            id="places"
            name="places"
            type="number"
            defaultValue={initial?.places ?? 5}
            className={FIELD}
          />
          <FieldError name="places" />
        </div>
        <div>
          <label className={LABEL} htmlFor="transmission">
            Transmission
          </label>
          <select
            id="transmission"
            name="transmission"
            defaultValue={initial?.transmission ?? 'Auto'}
            className={FIELD}
          >
            <option value="Auto">Auto</option>
            <option value="Manuelle">Manuelle</option>
          </select>
          <FieldError name="transmission" />
        </div>
        <div>
          <label className={LABEL} htmlFor="carburant">
            Carburant
          </label>
          <select
            id="carburant"
            name="carburant"
            defaultValue={initial?.carburant ?? 'Essence'}
            className={FIELD}
          >
            <option value="Essence">Essence</option>
            <option value="Diesel">Diesel</option>
            <option value="Hybride">Hybride</option>
          </select>
          <FieldError name="carburant" />
        </div>
      </fieldset>

      <fieldset className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <legend className={LABEL}>Commercial</legend>
        <div>
          <label className={LABEL} htmlFor="prixJour">
            Prix / jour (€)
          </label>
          <input
            id="prixJour"
            name="prixJour"
            type="number"
            step="0.01"
            defaultValue={toEuros(initial?.prixJourEnCents)}
            className={FIELD}
          />
          <FieldError name="prixJourEnCents" />
        </div>
        <div>
          <label className={LABEL} htmlFor="prixSemaine">
            Prix / semaine (€)
          </label>
          <input
            id="prixSemaine"
            name="prixSemaine"
            type="number"
            step="0.01"
            defaultValue={toEuros(initial?.prixSemaineEnCents)}
            className={FIELD}
          />
          <FieldError name="prixSemaineEnCents" />
        </div>
        <div>
          <label className={LABEL} htmlFor="disponible">
            Disponible
          </label>
          <select
            id="disponible"
            name="disponible"
            defaultValue={initial ? String(initial.disponible) : 'true'}
            className={FIELD}
          >
            <option value="true">Oui</option>
            <option value="false">Non</option>
          </select>
          <FieldError name="disponible" />
        </div>
      </fieldset>

      <div>
        <p className={LABEL}>Photo</p>
        <ImageUploader
          folder="location"
          entityId={carId}
          value={images}
          onChange={setImages}
          max={1}
        />
        <FieldError name="image" />
      </div>

      <SubmitButton>{isEdit ? 'Enregistrer' : 'Créer la voiture'}</SubmitButton>
    </FormShell>
  );
}
