import type { Metadata } from 'next';
import { EstimationClient } from './EstimationClient';

export const metadata: Metadata = {
  title: 'Estimation reprise — Admin',
  robots: { index: false, follow: false },
};

export default function EstimationPage() {
  return <EstimationClient />;
}
