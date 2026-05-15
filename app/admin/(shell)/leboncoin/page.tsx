import type { Metadata } from 'next';
import { LeboncoinExportClient } from './LeboncoinExportClient';

export const metadata: Metadata = {
  title: 'Export Leboncoin — Admin',
  robots: { index: false, follow: false },
};

export default function LeboncoinPage() {
  return <LeboncoinExportClient />;
}
