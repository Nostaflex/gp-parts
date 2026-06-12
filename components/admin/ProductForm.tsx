'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { FormShell, FieldError, SubmitButton } from '@/components/admin/FormShell';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { CompatibilityFields } from '@/components/admin/CompatibilityFields';
import { createProduct, updateProduct } from '@/app/admin/products/actions';

import type { Product, ProductCategory, VehicleType } from '@/lib/types';

const FIELD =
  'h-11 px-3 rounded-[10px] border bg-[var(--surface)] text-base text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue)]';
const TEXTAREA = FIELD.replace('h-11', 'py-2');
const LABEL = 'text-body-sm font-medium text-[var(--text)] mb-1 block';

const CATEGORIES: Array<{ value: ProductCategory; label: string }> = [
  { value: 'freinage', label: 'Freinage' },
  { value: 'moteur', label: 'Moteur' },
  { value: 'transmission', label: 'Transmission' },
  { value: 'eclairage', label: 'Éclairage' },
  { value: 'filtres', label: 'Filtres' },
  { value: 'suspension', label: 'Suspension' },
  { value: 'electronique', label: 'Électronique' },
  { value: 'refroidissement', label: 'Refroidissement' },
];

const VEHICLE_TYPES: Array<{ value: VehicleType; label: string }> = [
  { value: 'auto', label: 'Auto' },
  { value: 'moto', label: 'Moto' },
];

export function ProductForm({ initial }: { initial?: Product }) {
  const router = useRouter();
  const isEdit = !!initial;

  const [productId] = useState(() => initial?.slug ?? `product-${Date.now().toString(36)}`);
  const [images, setImages] = useState<string[]>(initial?.images ?? []);

  const priceEuros = initial ? (initial.price / 100).toString() : '';
  const priceOriginalEuros =
    initial?.priceOriginal !== undefined ? (initial.priceOriginal / 100).toString() : '';

  return (
    <FormShell
      action={isEdit ? updateProduct : createProduct}
      onSuccess={() => router.push('/admin/products')}
      successMessage={isEdit ? 'Produit mis à jour.' : 'Produit créé.'}
    >
      <input type="hidden" name="id" value={productId} />
      {isEdit && <input type="hidden" name="clientUpdatedAt" value={initial!.updatedAt} />}
      {images.map((url) => (
        <input key={url} type="hidden" name="images" value={url} />
      ))}

      <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <legend className={LABEL}>Identité</legend>
        <div>
          <label className={LABEL} htmlFor="name">
            Nom
          </label>
          <input id="name" name="name" defaultValue={initial?.name} className={FIELD} />
          <FieldError name="name" />
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

      <div>
        <label className={LABEL} htmlFor="shortDescription">
          Description courte
        </label>
        <textarea
          id="shortDescription"
          name="shortDescription"
          rows={2}
          defaultValue={initial?.shortDescription}
          className={TEXTAREA}
        />
        <FieldError name="shortDescription" />
      </div>

      <div>
        <label className={LABEL} htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={initial?.description}
          className={TEXTAREA}
        />
        <FieldError name="description" />
      </div>

      <fieldset className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <legend className={LABEL}>Classification</legend>
        <div>
          <label className={LABEL} htmlFor="category">
            Catégorie
          </label>
          <select
            id="category"
            name="category"
            defaultValue={initial?.category ?? 'freinage'}
            className={FIELD}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <FieldError name="category" />
        </div>
        <div>
          <label className={LABEL} htmlFor="vehicleType">
            Type de véhicule
          </label>
          <select
            id="vehicleType"
            name="vehicleType"
            defaultValue={initial?.vehicleType ?? 'auto'}
            className={FIELD}
          >
            {VEHICLE_TYPES.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
          <FieldError name="vehicleType" />
        </div>
      </fieldset>

      <fieldset className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <legend className={LABEL}>Commercial</legend>
        <div>
          <label className={LABEL} htmlFor="price">
            Prix (€)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            inputMode="decimal"
            step="0.01"
            defaultValue={priceEuros}
            className={FIELD}
          />
          <FieldError name="price" />
        </div>
        <div>
          <label className={LABEL} htmlFor="priceOriginal">
            Prix original (€)
          </label>
          <input
            id="priceOriginal"
            name="priceOriginal"
            type="number"
            inputMode="decimal"
            step="0.01"
            defaultValue={priceOriginalEuros}
            className={FIELD}
          />
          <FieldError name="priceOriginal" />
        </div>
        <div>
          <label className={LABEL} htmlFor="stock">
            Stock
          </label>
          <input
            id="stock"
            name="stock"
            type="number"
            inputMode="numeric"
            defaultValue={initial?.stock}
            className={FIELD}
          />
          <FieldError name="stock" />
        </div>
      </fieldset>

      <div>
        <label className="inline-flex items-center gap-2 text-body-sm">
          <input
            id="isPromoted"
            name="isPromoted"
            type="checkbox"
            defaultChecked={initial?.isPromoted ?? false}
            className="h-4 w-4 rounded border-[var(--border)] accent-[var(--blue)]"
          />
          <span className="font-medium text-[var(--text)]">Mis en avant</span>
        </label>
      </div>

      <fieldset className="space-y-2">
        <legend className={LABEL}>Compatibilité véhicule</legend>
        <CompatibilityFields initial={initial?.compatibility ?? []} />
      </fieldset>

      <div>
        <p className={LABEL}>Photos (5 max)</p>
        <ImageUploader
          folder="products"
          entityId={productId}
          value={images}
          onChange={setImages}
          max={5}
        />
        <FieldError name="image" />
        <FieldError name="images" />
      </div>

      <SubmitButton>{isEdit ? 'Enregistrer' : 'Créer le produit'}</SubmitButton>
    </FormShell>
  );
}
