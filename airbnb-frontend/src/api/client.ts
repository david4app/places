import type {
  AuthResponse,
  AvailabilityRange,
  BookingRecord,
  BookingRequest,
  CreateListingRequest,
  CreateReviewRequest,
  Listing,
  Message,
  Review,
  TripRecord,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

async function parseErrorMessage(response: Response, fallback: string) {
  const body = await response.json().catch(() => ({ message: fallback }));
  return body.message ?? fallback;
}

export async function getListings(): Promise<Listing[]> {
  const response = await fetch(`${API_BASE}/api/listings`);
  if (!response.ok) throw new Error('Failed to load listings.');
  return (await response.json()) as Listing[];
}

export async function getListing(id: string): Promise<Listing | null> {
  const response = await fetch(`${API_BASE}/api/listings/${id}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Failed to load listing.');
  return (await response.json()) as Listing;
}

export async function getMyListings(token: string): Promise<Listing[]> {
  const response = await fetch(`${API_BASE}/api/listings/mine`, { headers: authHeaders(token) });
  if (!response.ok) throw new Error(await parseErrorMessage(response, 'Failed to load your listings.'));
  return (await response.json()) as Listing[];
}

export async function deleteListing(id: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/listings/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(await parseErrorMessage(response, 'Failed to delete listing.'));
}

export async function getListingBookings(id: string, token: string): Promise<BookingRecord[]> {
  const response = await fetch(`${API_BASE}/api/listings/${id}/bookings`, { headers: authHeaders(token) });
  if (!response.ok) throw new Error(await parseErrorMessage(response, 'Failed to load bookings.'));
  return (await response.json()) as BookingRecord[];
}

export async function getReviews(listingId: string): Promise<Review[]> {
  const response = await fetch(`${API_BASE}/api/listings/${listingId}/reviews`);
  if (!response.ok) throw new Error('Failed to load reviews.');
  return (await response.json()) as Review[];
}

export async function addReview(listingId: string, payload: CreateReviewRequest, token: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/listings/${listingId}/reviews`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await parseErrorMessage(response, 'Failed to submit review.'));
}

export async function getFavorites(token: string): Promise<Listing[]> {
  const response = await fetch(`${API_BASE}/api/favorites`, { headers: authHeaders(token) });
  if (!response.ok) throw new Error(await parseErrorMessage(response, 'Failed to load favorites.'));
  return (await response.json()) as Listing[];
}

export async function addFavorite(listingId: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/favorites/${listingId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(await parseErrorMessage(response, 'Failed to add favorite.'));
}

export async function removeFavorite(listingId: string, token: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/favorites/${listingId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(await parseErrorMessage(response, 'Failed to remove favorite.'));
}

export async function createListing(payload: CreateListingRequest, token: string): Promise<Listing> {
  const response = await fetch(`${API_BASE}/api/listings`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await parseErrorMessage(response, 'Failed to create listing.'));
  return (await response.json()) as Listing;
}

async function authRequest(path: string, payload: Record<string, string>): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/api/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({ message: 'Authentication failed.' }));
  if (!response.ok) throw new Error(body.message ?? 'Authentication failed.');
  return body as AuthResponse;
}

export function register(name: string, email: string, password: string) {
  return authRequest('register', { name, email, password });
}

export function login(email: string, password: string) {
  return authRequest('login', { email, password });
}

export async function logout(token: string) {
  await fetch(`${API_BASE}/api/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createBooking(payload: BookingRequest, token: string): Promise<BookingRecord> {
  const response = await fetch(`${API_BASE}/api/bookings`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await parseErrorMessage(response, 'Failed to create booking.'));
  return (await response.json()) as BookingRecord;
}

export async function getMyTrips(token: string): Promise<TripRecord[]> {
  const response = await fetch(`${API_BASE}/api/bookings/mine`, { headers: authHeaders(token) });
  if (!response.ok) throw new Error(await parseErrorMessage(response, 'Failed to load your trips.'));
  return (await response.json()) as TripRecord[];
}

export async function getBooking(id: string, token: string): Promise<TripRecord> {
  const response = await fetch(`${API_BASE}/api/bookings/${id}`, { headers: authHeaders(token) });
  if (!response.ok) throw new Error(await parseErrorMessage(response, 'Failed to load booking.'));
  return (await response.json()) as TripRecord;
}

export async function cancelBooking(id: string, token: string): Promise<BookingRecord> {
  const response = await fetch(`${API_BASE}/api/bookings/${id}/cancel`, {
    method: 'POST',
    headers: authHeaders(token),
  });
  if (!response.ok) throw new Error(await parseErrorMessage(response, 'Failed to cancel booking.'));
  return (await response.json()) as BookingRecord;
}

export async function getListingAvailability(listingId: string): Promise<AvailabilityRange[]> {
  const response = await fetch(`${API_BASE}/api/listings/${listingId}/availability`);
  if (!response.ok) throw new Error('Failed to load availability.');
  return (await response.json()) as AvailabilityRange[];
}

export async function getBookingMessages(bookingId: string, token: string): Promise<Message[]> {
  const response = await fetch(`${API_BASE}/api/bookings/${bookingId}/messages`, { headers: authHeaders(token) });
  if (!response.ok) throw new Error(await parseErrorMessage(response, 'Failed to load messages.'));
  return (await response.json()) as Message[];
}

export async function sendBookingMessage(bookingId: string, body: string, token: string): Promise<Message> {
  const response = await fetch(`${API_BASE}/api/bookings/${bookingId}/messages`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ body }),
  });
  if (!response.ok) throw new Error(await parseErrorMessage(response, 'Failed to send message.'));
  return (await response.json()) as Message;
}
