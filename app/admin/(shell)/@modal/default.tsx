/**
 * Slot Parallel Route `@modal` — état par défaut (inerte).
 *
 * Phase 2 : infrastructure posée, slot inerte (aucune route interceptée).
 * Phase 6 : `@modal/(.)demandes/[id]/page.tsx` interceptera
 * `/admin/demandes/[id]` pour afficher le <Drawer> sans quitter la liste.
 * Tant qu'aucune route ne matche le slot, Next rend ce default → null.
 */
export default function ModalSlotDefault() {
  return null;
}
