import type { Metadata } from 'next';
import { requireAdminPage } from '@/lib/admin/auth';
import { OrdersClient } from './OrdersClient';

export const metadata: Metadata = {
  title: 'Commandes — Admin GP Parts',
};

export default async function CommandesPage() {
  await requireAdminPage();
  return <OrdersClient />;
}
