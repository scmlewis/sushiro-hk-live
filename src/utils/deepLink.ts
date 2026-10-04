export function parseStoreIdFromUrl(url: string): number | null {
  try {
    const u = new URL(url, 'http://localhost');
    const raw = u.searchParams.get('store');
    if (!raw) return null;
    const id = Number.parseInt(raw, 10);
    if (!Number.isInteger(id) || id <= 0) return null;
    return id;
  } catch {
    return null;
  }
}

export function buildStoreUrl(storeId: number): string {
  return `/?store=${storeId}`;
}
