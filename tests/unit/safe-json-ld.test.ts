/**
 * TDD tests for safeJsonLd — written BEFORE the implementation.
 * These must FAIL until lib/safe-json-ld.ts is created.
 */
import { describe, it, expect } from 'vitest';
import { safeJsonLd } from '@/lib/safe-json-ld';

describe('safeJsonLd — XSS prevention', () => {
  it('escapes </script> so a stored XSS payload cannot break out of the script tag', () => {
    const payload = '</script><script>alert(1)</script>';
    const result = safeJsonLd({ name: payload });

    // Must NOT contain the literal closing tag that would terminate the script block
    expect(result).not.toContain('</script>');
    // < is escaped to < — the closing tag becomes </script>
    expect(result).toContain('\\u003c/script\\u003e');
  });

  it('round-trips to the original object via JSON.parse', () => {
    const obj = { name: '</script><script>alert(1)</script>' };
    const parsed = JSON.parse(safeJsonLd(obj));
    expect(parsed).toEqual(obj);
  });

  it('escapes standalone < and >', () => {
    const result = safeJsonLd({ a: '<b>hello</b>' });
    expect(result).not.toContain('<b>');
    expect(result).not.toContain('</b>');
    // round-trip
    expect(JSON.parse(result)).toEqual({ a: '<b>hello</b>' });
  });

  it('escapes & to prevent &amp; injection in adjacent HTML contexts', () => {
    const result = safeJsonLd({ x: 'Tom & Jerry' });
    expect(result).not.toContain(' & ');
    expect(JSON.parse(result)).toEqual({ x: 'Tom & Jerry' });
  });

  it('escapes U+2028 LINE SEPARATOR (valid JS line terminator, breaks script block)', () => {
    const result = safeJsonLd({ s: 'line sep' });
    expect(result).not.toContain(' ');
    expect(JSON.parse(result)).toEqual({ s: 'line sep' });
  });

  it('escapes U+2029 PARAGRAPH SEPARATOR (valid JS line terminator)', () => {
    const result = safeJsonLd({ s: 'para sep' });
    expect(result).not.toContain(' ');
    expect(JSON.parse(result)).toEqual({ s: 'para sep' });
  });
});

describe('safeJsonLd — JSON integrity (SEO must survive)', () => {
  it('round-trips a nested product JSON-LD object', () => {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Filtre à huile — Référence éàù',
      description: 'Compatible moteurs FR & DE. Prix : 14,90 €',
      offers: {
        '@type': 'Offer',
        price: '14.90',
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
      },
    };
    expect(JSON.parse(safeJsonLd(jsonLd))).toEqual(jsonLd);
  });

  it('round-trips an array of objects', () => {
    const arr = [{ name: 'A <b>item</b>' }, { name: 'B & C' }];
    expect(JSON.parse(safeJsonLd(arr))).toEqual(arr);
  });

  it('round-trips accented FR strings without corruption', () => {
    const obj = { label: 'Référence éàù üöä' };
    expect(JSON.parse(safeJsonLd(obj))).toEqual(obj);
  });

  it('handles an empty object', () => {
    expect(JSON.parse(safeJsonLd({}))).toEqual({});
  });

  it('handles null-ish and numeric fields', () => {
    const obj = { name: null, price: 0, active: false };
    expect(JSON.parse(safeJsonLd(obj))).toEqual(obj);
  });

  it('handles a string containing both U+2028 and U+2029 in a complex object', () => {
    const obj = {
      title: 'line break para',
      safe: 'no special chars',
    };
    const result = safeJsonLd(obj);
    expect(result).not.toContain(' ');
    expect(result).not.toContain(' ');
    expect(JSON.parse(result)).toEqual(obj);
  });
});
