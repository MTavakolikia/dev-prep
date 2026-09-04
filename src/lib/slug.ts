// Small shared slug helper (client-safe)
export function slugify(text: string): string {
  return text.toLowerCase()
    .replace(/[’'"`,:()&?!]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function excerptFrom(text: string, len = 160): string {
  const clean = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return clean.length > len ? `${clean.slice(0, len - 1).trimEnd()}…` : clean;
}
