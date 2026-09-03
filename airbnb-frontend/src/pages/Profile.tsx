import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cancelBooking, getMyTrips } from '../api/client';
import { ConfirmDialog } from '../components/UI/ConfirmDialog';
import type { TripRecord } from '../types';

const CANCELLATION_CUTOFF_HOURS = 48;

function canCancel(trip: TripRecord) {
  if (trip.status === 'cancelled') return false;
  const hoursUntilCheckIn = (new Date(trip.checkIn).getTime() - Date.now()) / (60 * 60 * 1000);
  return hoursUntilCheckIn >= CANCELLATION_CUTOFF_HOURS;
}

export function Profile() {
  const { user, token } = useAuth();
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [tripPendingCancel, setTripPendingCancel] = useState<TripRecord | null>(null);

  const loadTrips = () => {
    if (!token) return;
    setLoading(true);
    getMyTrips(token)
      .then(setTrips)
      .catch(() => setError('Could not load your trips.'))
      .finally(() => setLoading(false));
  };

  useEffect(loadTrips, [token]);

  if (!user) return null;

  const handleCancel = async () => {
    const trip = tripPendingCancel;
    if (!token || !trip) return;
    setTripPendingCancel(null);
    setError('');
    setCancellingId(trip.id);
    try {
      await cancelBooking(trip.id, token);
      loadTrips();
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : 'Failed to cancel booking.');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="mb-6 text-4xl font-bold text-gray-900">Your Profile</h1>
          
          <div className="flex items-center gap-4 rounded-2xl border border-gray-200 p-8">
            <img 
              className="h-20 w-20 rounded-full object-cover" 
              src={user.avatar} 
              alt={user.name} 
            />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Trips Section */}
        <div>
          <h2 className="mb-6 text-2xl font-bold text-gray-900">Your Trips</h2>

          {error && <p className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          {loading ? (
            <p className="text-gray-600">Loading…</p>
          ) : trips.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 border-dashed p-12 text-center">
              <p className="text-xl text-gray-600 mb-2">No trips booked yet</p>
              <p className="text-gray-500 mb-6">Start exploring and book your next adventure</p>
              <Link 
                to="/" 
                className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Explore stays
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {trips.map((trip) => {
                const checkInDate = new Date(trip.checkIn).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                });
                const checkOutDate = new Date(trip.checkOut).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                });
                const cancelled = trip.status === 'cancelled';

                return (
                  <div
                    key={trip.id}
                    className={`flex gap-6 rounded-2xl border p-6 ${cancelled ? 'border-gray-100 opacity-60' : 'border-gray-200'}`}
                  >
                    {/* Property Image */}
                    <Link to={`/listing/${trip.listingId}`} className="shrink-0">
                      <img 
                        src={trip.listing.image ?? undefined} 
                        alt={trip.listing.title}
                        className="h-32 w-40 rounded-lg object-cover"
                      />
                    </Link>

                    {/* Trip Info */}
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <Link to={`/listing/${trip.listingId}`} className="text-lg font-semibold text-gray-900 hover:underline">
                          {trip.listing.title}
                        </Link>
                        {cancelled && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">Cancelled</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        {trip.listing.location}
                      </p>

                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <div>
                          <p className="font-semibold text-gray-900">{checkInDate}</p>
                          <p className="text-xs">Check-in</p>
                        </div>
                        <span>→</span>
                        <div>
                          <p className="font-semibold text-gray-900">{checkOutDate}</p>
                          <p className="text-xs">Check-out</p>
                        </div>
                        <span className="ml-auto">·</span>
                        <span>{trip.guests} guest{trip.guests > 1 ? 's' : ''}</span>
                      </div>

                      <div className="mt-4 flex items-center gap-4">
                        <Link to={`/messages/${trip.id}`} className="text-sm font-medium text-primary hover:underline">
                          Message host
                        </Link>
                        {!cancelled && (
                          canCancel(trip) ? (
                            <button
                              onClick={() => setTripPendingCancel(trip)}
                              disabled={cancellingId === trip.id}
                              className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
                            >
                              {cancellingId === trip.id ? 'Cancelling…' : 'Cancel trip'}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">
                              Free cancellation window has passed
                            </span>
                          )
                        )}
                      </div>
                    </div>

                    {/* Price */}
                    <div className="shrink-0 text-right">
                      <p className="text-2xl font-bold text-gray-900">${trip.totalPrice}</p>
                      <p className="text-xs text-gray-500 mt-1">Total paid</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={tripPendingCancel !== null}
        title="Cancel this trip?"
        message="This will free up your dates and cannot be undone."
        confirmLabel="Cancel trip"
        cancelLabel="Keep trip"
        destructive
        onConfirm={handleCancel}
        onCancel={() => setTripPendingCancel(null)}
      />
    </main>
  );
}
