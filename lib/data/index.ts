import type { DataAdapter } from './types';
import { StaticAdapter } from './static';

/**
 * Singleton instance of the current data adapter
 * Currently returns StaticAdapter for in-memory data
 * Will be swapped to FirestoreAdapter in future migrations
 */
let adapterInstance: DataAdapter | null = null;

/**
 * Get the current DataAdapter instance (singleton pattern)
 * @returns The configured DataAdapter
 */
export function getAdapter(): DataAdapter {
  if (!adapterInstance) {
    adapterInstance = new StaticAdapter();
  }
  return adapterInstance;
}

/**
 * (Internal) Set a custom adapter instance
 * Useful for testing or switching implementations
 */
export function setAdapter(adapter: DataAdapter): void {
  adapterInstance = adapter;
}

// Re-export types for convenience
export type { DataAdapter, ProductFilters } from './types';
export { StaticAdapter } from './static';
