import type { Metadata } from 'next';
import { requireAdminPage } from '@/lib/admin/auth';
import { EstimationClient } from './EstimationClient';

export const metadata: Metadata = {
  title: 'Estimation reprise — Admin',
  robots: { index: false, follow: false },
};

export default async function EstimationPage() {
  await requireAdminPage();
  return <EstimationClient />;
}
