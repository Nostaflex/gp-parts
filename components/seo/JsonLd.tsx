import { safeJsonLd } from '@/lib/safe-json-ld';

/**
 * Rend un ou plusieurs blocs JSON-LD (`<script type="application/ld+json">`).
 * Sérialisation XSS-safe via `safeJsonLd`. Server Component.
 */
export function JsonLd({ data }: { data: unknown | unknown[] }) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((d, i) => (
        <script
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(d) }}
        />
      ))}
    </>
  );
}
