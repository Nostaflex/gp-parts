import type { DataAdapter } from './types';
import { StaticAdapter } from './static';

/**
 * Singleton instance of the current data adapter.
 *
 * Stratégie de sélection :
 * - NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true → FirebaseAdapter (émulateur local)
 * - NEXT_PUBLIC_FIREBASE_PROJECT_ID défini → FirebaseAdapter (cloud)
 * - Sinon → StaticAdapter (données en mémoire, défaut)
 *
 * Le switch est transparent : tous les composants appellent getAdapter()
 * et ne savent pas si les données viennent du JSON statique ou de Firestore.
 */
let adapterInstance: DataAdapter | null = null;

/**
 * Get the current DataAdapter instance (singleton pattern)
 */
export function getAdapter(): DataAdapter {
  if (!adapterInstance) {
    const useFirebase =
      process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' ||
      (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== 'demo-gp-parts');

    if (useFirebase) {
      // Import dynamique pour ne pas charger Firebase si on ne l'utilise pas
      // eslint-disable-next-line
      const { FirebaseAdapter } = require('./firebase');
      adapterInstance = new FirebaseAdapter();
    } else {
      adapterInstance = new StaticAdapter();
    }
  }
  // adapterInstance is guaranteed non-null after the if block above
  return adapterInstance!;
}

/**
 * (Internal) Set a custom adapter instance.
 * Useful for testing or switching implementations at runtime.
 */
export function setAdapter(adapter: DataAdapter): void {
  adapterInstance = adapter;
}

/**
 * Reset the adapter singleton (useful for tests).
 */
export function resetAdapter(): void {
  adapterInstance = null;
}

// Re-export types for convenience
export type { DataAdapter, ProductFilters } from './types';
export { StaticAdapter } from './static';
export { FirebaseAdapter } from './firebase';
