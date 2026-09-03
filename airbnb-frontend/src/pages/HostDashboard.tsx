import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { deleteListing, getListingBookings, getMyListings } from '../api/client';
import type { BookingRecord, Listing } from '../types';

export function HostDashboard() {
  const { token } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [bookingsByListing, setBookingsByListing] = useState<Record<string, BookingRecord[]>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    getMyListings(token)
      .then(setListings)
      .catch(() => setError('Could not load your listings.'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleToggleBookings = async (listingId: string) => {
    if (expandedId === listingId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(listingId);
    if (!token || bookingsByListing[listingId]) return;
    try {
      const bookings = await getListingBookings(listingId, token);
      setBookingsByListing((current) => ({ ...current, [listingId]: bookings }));
    } catch {
      setBookingsByListing((current) => ({ ...current, [listingId]: [] }));
    }
  };

  const handleDelete = async (listingId: string) => {
    if (!token) return;
    if (!window.confirm('Delete this listing? This cannot be undone.')) return;
    try {
      await deleteListing(listingId, token);
      setListings((current) => current.filter((listing) => listing.id !== listingId));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete listing.');
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold text-gray-900">Your listings</h1>
          <Link to="/host" className="px-4 py-2 text-sm font-semibold text-primary hover:underline">
            + Add a listing
          </Link>
        </div>

        {error && <p className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        {loading ? (
          <p className="text-gray-600">Loading…</p>
        ) : listings.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 border-dashed p-12 text-center">
            <p className="text-xl text-gray-600 mb-2">You haven't listed any places yet</p>
            <Link to="/host" className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors">
              Become a host
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map((listing) => (
              <div key={listing.id} className="rounded-2xl border border-gray-200 p-6">
                <div className="flex gap-4">
                  <img src={listing.images[0]} alt={listing.title} className="h-24 w-32 shrink-0 rounded-lg object-cover" />
                  <div className="flex-1">
                    <Link to={`/listing/${listing.id}`} className="font-semibold text-gray-900 hover:underline">
                      {listing.title}
                    </Link>
                    <p className="text-sm text-gray-600">{listing.location}</p>
                    <p className="text-sm text-gray-500">${listing.price} / night · Up to {listing.maxGuests} guests</p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <button
                      onClick={() => handleToggleBookings(listing.id)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      {expandedId === listing.id ? 'Hide bookings' : 'View bookings'}
                    </button>
                    <button
                      onClick={() => handleDelete(listing.id)}
                      className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {expandedId === listing.id && (
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    {!bookingsByListing[listing.id] ? (
                      <p className="text-sm text-gray-500">Loading bookings…</p>
                    ) : bookingsByListing[listing.id].length === 0 ? (
                      <p className="text-sm text-gray-500">No bookings yet for this listing.</p>
                    ) : (
                      <ul className="space-y-2">
                        {bookingsByListing[listing.id].map((booking) => (
                          <li key={booking.id} className="flex items-center justify-between text-sm text-gray-700">
                            <span>
                              {booking.checkIn} → {booking.checkOut} · {booking.guests} guest{booking.guests > 1 ? 's' : ''}
                              {booking.status === 'cancelled' && (
                                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">Cancelled</span>
                              )}
                            </span>
                            <div className="flex items-center gap-4">
                              <span className="font-semibold text-gray-900">${booking.totalPrice}</span>
                              <Link to={`/messages/${booking.id}`} className="text-sm font-medium text-primary hover:underline">
                                Message guest
                              </Link>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
