/**
 * Generates a URL-friendly slug from a title while strictly preserving native Unicode characters.
 * Perfect for local use in Russian (Cyrillic), Arabic, Chinese, and other alphabets.
 */
export function generateNativeSlug(title: string): string {
  if (!title) return "";

  return title
    .toLowerCase()
    .trim()
    // \p{L} matches any kind of letter from any language
    // \p{N} matches any kind of numeric character
    // \s matches whitespace
    // - matches hyphen
    // We remove anything that is NOT a letter, number, space, or hyphen
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    // Replace 1 or more spaces with a single hyphen
    .replace(/\s+/g, '-')
    // Replace multiple consecutive hyphens with a single hyphen
    .replace(/-+/g, '-');
}

/**
 * Temporary alias to support older refs.
 * @deprecated Use generateNativeSlug going forward.
 */
export function generateSlugFromTitle(title: string): string {
  return generateNativeSlug(title);
}

/**
 * Temporary alias to support older refs.
 * @deprecated Use generateNativeSlug going forward.
 */
export async function generateSlugFromTitleAsync(title: string): Promise<string> {
  return generateNativeSlug(title);
}
