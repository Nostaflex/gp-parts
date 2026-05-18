/**
 * safeJsonLd â XSS-safe JSON-LD serialization for <script type="application/ld+json"> tags.
 *
 * Why: JSON.stringify does NOT escape `<`, `>`, or `&`, so any string containing
 * `</script>` in a product name/description would terminate the enclosing script
 * block and allow arbitrary JS injection (stored XSS).
 *
 * Additionally, U+2028 (LINE SEPARATOR) and U+2029 (PARAGRAPH SEPARATOR) are
 * valid JavaScript line terminators â they can silently break the script block
 * if unescaped inside a JSON string embedded in an HTML page.
 *
 * Fix: after JSON.stringify, replace these characters with JSON-string-safe
 * Unicode escapes. JSON.parse round-trips identically because these escape
 * sequences are part of the JSON specification.
 *
 * No HTML entities are used â we stay in JSON-escape space, so there is no
 * risk of double-encoding.
 */

// U+2028 and U+2029 stored as constants so we never embed literal line
// terminators in regex syntax (avoids security/detect-non-literal-regexp lint rule).
const LS = '\u2028'; // LINE SEPARATOR
const PS = '\u2029'; // PARAGRAPH SEPARATOR

export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .split(LS)
    .join('\\u2028')
    .split(PS)
    .join('\\u2029');
}
