/**
 * Arabic & Urdu text utilities:
 * - Strip / restore A'raab (diacritics)
 * - Normalize text for diacritic-insensitive search
 * - Highlight matches
 */

// Arabic diacritics (Tashkeel) unicode ranges: Fatha, Damma, Kasra, Sukun, Shadda, Tanween, etc.
const ARABIC_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED\u0670\u08D4-\u08E1\u08E3-\u08FF]/g;

// Tatweel / kashida (elongation character) — also stripped for search purposes
const TATWEEL = /\u0640/g;

/** Remove Arabic diacritics (A'raab) from a string. Never mutates the source/original text. */
export function stripAraab(text: string): string {
  if (!text) return text;
  return text.replace(ARABIC_DIACRITICS, "").replace(TATWEEL, "");
}

/**
 * Normalize Arabic text for indexing/searching:
 * - Remove diacritics
 * - Unify Alef forms (أ إ آ ا -> ا)
 * - Unify Yaa/Alef Maqsura (ى -> ي)
 * - Unify Taa Marbuta (ة -> ه) for looser matching
 * - Unify Hamza on Waw/Yaa carriers loosely
 * - Collapse whitespace
 */
export function normalizeArabic(text: string): string {
  if (!text) return "";
  let t = stripAraab(text);
  t = t
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ٱ/g, "ا");
  t = t.replace(/\s+/g, " ").trim();
  return t;
}

/** Normalize Urdu text for indexing/searching (lighter — Urdu doesn't use the same diacritic set). */
export function normalizeUrdu(text: string): string {
  if (!text) return "";
  let t = text.replace(ARABIC_DIACRITICS, ""); // Urdu text can still carry Arabic loanword diacritics
  t = t.replace(/\s+/g, " ").trim();
  return t;
}

/** General-purpose normalizer used at index time and query time — keeps both scripts consistent. */
export function normalizeForSearch(text: string): string {
  if (!text) return "";
  return normalizeArabic(normalizeUrdu(text)).toLowerCase();
}

/** True if the string contains any Arabic diacritic marks. */
export function hasAraab(text: string): boolean {
  return ARABIC_DIACRITICS.test(text);
}

/**
 * Wrap every case-insensitive / diacritic-insensitive occurrence of `query`
 * inside `sourceText` with <mark>...</mark>, while preserving the ORIGINAL
 * (possibly diacritized) source text for display.
 */
export function highlightMatches(sourceText: string, query: string): string {
  if (!query?.trim()) return escapeHtml(sourceText);

  const normalizedQuery = normalizeForSearch(query);
  if (!normalizedQuery) return escapeHtml(sourceText);

  // Build a map from normalized-string index -> original-string index so we can
  // highlight the ORIGINAL (diacritized) characters even though we matched on
  // the normalized version.
  const chars = Array.from(sourceText);
  let normalized = "";
  const indexMap: number[] = []; // normalized char index -> original char index

  chars.forEach((ch, i) => {
    const n = normalizeForSearch(ch);
    for (const nc of n) {
      normalized += nc;
      indexMap.push(i);
    }
  });

  let result = "";
  let cursor = 0;
  let searchFrom = 0;

  while (true) {
    const idx = normalized.indexOf(normalizedQuery, searchFrom);
    if (idx === -1) break;

    const startOrigIdx = indexMap[idx];
    const endOrigIdx = indexMap[idx + normalizedQuery.length - 1] + 1;

    result += escapeHtml(chars.slice(cursor, startOrigIdx).join(""));
    result += `<mark>${escapeHtml(chars.slice(startOrigIdx, endOrigIdx).join(""))}</mark>`;

    cursor = endOrigIdx;
    searchFrom = idx + normalizedQuery.length;
  }

  result += escapeHtml(chars.slice(cursor).join(""));
  return result;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Extract a short snippet of `text` around the first match of `query`, for search-result previews. */
export function makeSnippet(text: string, query: string, radius = 60): string {
  const normalizedText = normalizeForSearch(text);
  const normalizedQuery = normalizeForSearch(query);
  const idx = normalizedQuery ? normalizedText.indexOf(normalizedQuery) : -1;

  if (idx === -1) {
    return text.length > radius * 2 ? text.slice(0, radius * 2) + "…" : text;
  }

  const chars = Array.from(text);
  // Approximate mapping back since normalization rarely changes length drastically for CJK-free scripts
  const start = Math.max(0, idx - radius);
  const end = Math.min(chars.length, idx + normalizedQuery.length + radius);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < chars.length ? "…" : "";
  return prefix + chars.slice(start, end).join("") + suffix;
}
