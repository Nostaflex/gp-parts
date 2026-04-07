import { getAdapter } from '@/lib/data';
import { AdminDashboardClient } from './AdminDashboardClient';

export default async function AdminDashboardPage() {
  const adapter = await getAdapter();
  const products = await adapter.getProducts();

  return <AdminDashboardClient products={products} />;
}
