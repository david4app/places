const STORAGE_KEY = 'staybnb-recently-viewed';
const MAX_ITEMS = 12;

function readIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function recordRecentlyViewed(listingId: string) {
  const current = readIds().filter((id) => id !== listingId);
  current.unshift(listingId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current.slice(0, MAX_ITEMS)));
}

export function getRecentlyViewedIds(): string[] {
  return readIds();
}
