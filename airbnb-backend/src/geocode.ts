import { Agent, fetch as undiciFetch } from 'undici';

// Some corporate networks intercept HTTPS with a self-signed proxy certificate.
// Only fall back to relaxed TLS verification for this specific outbound call, and only when needed.
const relaxedTlsAgent = new Agent({ connect: { rejectUnauthorized: false } });

function isCertificateError(error: unknown): boolean {
  const cause = error instanceof Error ? (error.cause as { code?: string } | undefined) : undefined;
  return cause?.code === 'SELF_SIGNED_CERT_IN_CHAIN' || cause?.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || cause?.code === 'CERT_HAS_EXPIRED';
}

async function fetchNominatim(url: string): Promise<Awaited<ReturnType<typeof undiciFetch>> | null> {
  const headers = { 'User-Agent': 'staybnb-app (dev)', 'Accept-Language': 'en' };
  try {
    return await undiciFetch(url, { headers });
  } catch (error) {
    if (!isCertificateError(error)) return null;
    try {
      return await undiciFetch(url, { headers, dispatcher: relaxedTlsAgent });
    } catch {
      return null;
    }
  }
}

// Free geocoding via OpenStreetMap's Nominatim — no API key required.
export async function geocodeLocation(location: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(location)}`;
  const response = await fetchNominatim(url);

  try {
    if (!response || !response.ok) return null;
    const results = (await response.json()) as Array<{ lat: string; lon: string }>;
    const first = results[0];
    if (!first) return null;
    return { lat: Number(first.lat), lng: Number(first.lon) };
  } catch {
    return null;
  }
}

export type LocationSuggestion = { label: string; lat: number; lng: number };

// Live city/country autocomplete suggestions, backed by the same free Nominatim search.
export async function searchLocations(query: string): Promise<LocationSuggestion[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&q=${encodeURIComponent(query)}`;
  const response = await fetchNominatim(url);

  try {
    if (!response || !response.ok) return [];
    const results = (await response.json()) as Array<{ lat: string; lon: string; display_name: string }>;
    return results.map((result) => ({
      label: result.display_name,
      lat: Number(result.lat),
      lng: Number(result.lon),
    }));
  } catch {
    return [];
  }
}



