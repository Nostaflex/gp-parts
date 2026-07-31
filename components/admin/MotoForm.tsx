'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { FormShell, FieldError, SubmitButton } from '@/components/admin/FormShell';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { createMoto, updateMoto } from '@/app/admin/motos/actions';

import type { Moto } from '@/lib/motos';

const FIELD =
  'h-11 px-3 rounded-[10px] border bg-[var(--surface)] text-base text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]';
const TEXTAREA = FIELD.replace('h-11', 'py-2');
const LABEL = 'text-body-sm font-medium text-[var(--text)] mb-1 block';

export function MotoForm({ initial }: { initial?: Moto }) {
  const router = useRouter();
  const isEdit = !!initial;

  const [motoId] = useState(() => initial?.id ?? `moto-${Date.now().toString(36)}`);
  const [images, setImages] = useState<string[]>(initial?.images ?? []);

  return (
    <FormShell
      action={isEdit ? updateMoto : createMoto}
      onSuccess={() => router.push('/admin/motos')}
      successMessage={isEdit ? 'Moto mise à jour.' : 'Moto créée.'}
    >
      <input type="hidden" name="id" value={motoId} />
      {isEdit && <input type="hidden" name="updatedAt" value={initial!.updatedAt} />}
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
          <label className={LABEL} htmlFor="type">
            Type
          </label>
          <select
            id="type"
            name="type"
            defaultValue={initial?.type ?? 'occasion'}
            className={FIELD}
          >
            <option value="occasion">Occasion</option>
            <option value="neuf">Neuf</option>
          </select>
          <FieldError name="type" />
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
      </fieldset>

      <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <legend className={LABEL}>Caractéristiques techniques</legend>
        <div>
          <label className={LABEL} htmlFor="annee">
            Année
          </label>
          <input
            id="annee"
            name="annee"
            type="number"
            inputMode="numeric"
            defaultValue={initial?.annee}
            className={FIELD}
          />
          <FieldError name="annee" />
        </div>
        <div>
          <label className={LABEL} htmlFor="km">
            Kilométrage
          </label>
          <input
            id="km"
            name="km"
            type="number"
            inputMode="numeric"
            defaultValue={initial?.km}
            className={FIELD}
          />
          <FieldError name="km" />
        </div>
        <div>
          <label className={LABEL} htmlFor="categorie">
            Catégorie
          </label>
          <select
            id="categorie"
            name="categorie"
            defaultValue={initial?.categorie ?? 'Roadster'}
            className={FIELD}
          >
            <option>Roadster</option>
            <option>Sport</option>
            <option>Trail</option>
            <option>Scooter</option>
            <option>Custom</option>
            <option>Routière</option>
          </select>
          <FieldError name="categorie" />
        </div>
        <div>
          <label className={LABEL} htmlFor="energie">
            Énergie
          </label>
          <select
            id="energie"
            name="energie"
            defaultValue={initial?.energie ?? 'Essence'}
            className={FIELD}
          >
            <option>Essence</option>
            <option>Électrique</option>
          </select>
          <FieldError name="energie" />
        </div>
      </fieldset>

      <fieldset className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <legend className={LABEL}>Commercial</legend>
        <div>
          <label className={LABEL} htmlFor="prix">
            Prix (€)
          </label>
          <input
            id="prix"
            name="prix"
            type="number"
            inputMode="numeric"
            defaultValue={initial?.prix}
            className={FIELD}
          />
          <FieldError name="prix" />
        </div>
        <div>
          <label className={LABEL} htmlFor="mensualite">
            Mensualité (€)
          </label>
          <input
            id="mensualite"
            name="mensualite"
            type="number"
            inputMode="numeric"
            defaultValue={initial?.mensualite}
            className={FIELD}
          />
          <FieldError name="mensualite" />
        </div>
        <div>
          <label className={LABEL} htmlFor="disponibilite">
            Disponibilité
          </label>
          <select
            id="disponibilite"
            name="disponibilite"
            defaultValue={initial?.disponibilite ?? 'disponible'}
            className={FIELD}
          >
            <option value="disponible">Disponible</option>
            <option value="reserve">Réservé</option>
            <option value="vendu">Vendu</option>
          </select>
          <FieldError name="disponibilite" />
        </div>
      </fieldset>

      <div>
        <label className={LABEL} htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={initial?.description}
          className={TEXTAREA}
        />
        <FieldError name="description" />
      </div>
      <div>
        <label className={LABEL} htmlFor="options">
          Options (une par ligne)
        </label>
        <textarea
          id="options"
          name="options"
          rows={3}
          defaultValue={initial?.options?.join('\n')}
          className={TEXTAREA}
        />
      </div>

      <fieldset className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <legend className={LABEL}>Détails</legend>
        <input
          name="car_puissance"
          aria-label="Puissance"
          placeholder="Puissance"
          defaultValue={initial?.caracteristiques.puissance}
          className={FIELD}
        />
        <input
          name="car_cylindree"
          aria-label="Cylindrée"
          placeholder="Cylindrée"
          defaultValue={initial?.caracteristiques.cylindree}
          className={FIELD}
        />
        <input
          name="car_couleur"
          aria-label="Couleur"
          placeholder="Couleur"
          defaultValue={initial?.caracteristiques.couleur}
          className={FIELD}
        />
        <input
          name="car_consommation"
          aria-label="Consommation"
          placeholder="Consommation"
          defaultValue={initial?.caracteristiques.consommation}
          className={FIELD}
        />
        <input
          name="car_poids"
          aria-label="Poids"
          placeholder="Poids"
          defaultValue={initial?.caracteristiques.poids}
          className={FIELD}
        />
        <select
          name="car_permis"
          aria-label="Permis"
          defaultValue={initial?.caracteristiques.permis ?? ''}
          className={FIELD}
        >
          <option value="">Permis (optionnel)</option>
          <option value="A1">A1</option>
          <option value="A2">A2</option>
          <option value="A">A</option>
          <option value="AM">AM</option>
        </select>
        <input
          name="car_premiere_circulation"
          aria-label="Première circulation"
          placeholder="Première circulation"
          defaultValue={initial?.caracteristiques.premiereCirculation}
          className={FIELD}
        />
        <input
          name="car_garantie"
          aria-label="Garantie"
          placeholder="Garantie"
          defaultValue={initial?.caracteristiques.garantie}
          className={FIELD}
        />
        <input
          name="car_proprietaires"
          type="number"
          inputMode="numeric"
          aria-label="Nombre de propriétaires"
          placeholder="Propriétaires"
          defaultValue={initial?.caracteristiques.proprietaires}
          className={FIELD}
        />
      </fieldset>

      <div>
        <p className={LABEL}>Photos (5 max)</p>
        <ImageUploader
          folder="motos"
          entityId={motoId}
          value={images}
          onChange={setImages}
          max={5}
        />
        <FieldError name="image" />
        <FieldError name="images" />
      </div>

      <SubmitButton>{isEdit ? 'Enregistrer' : 'Créer la moto'}</SubmitButton>
    </FormShell>
  );
}
