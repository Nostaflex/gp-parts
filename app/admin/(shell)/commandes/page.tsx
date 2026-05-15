import type { Metadata } from 'next';
import { OrdersClient } from './OrdersClient';

export const metadata: Metadata = {
  title: 'Commandes — Admin GP Parts',
};

export default function CommandesPage() {
  return <OrdersClient />;
}
