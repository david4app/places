import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { cancelBooking, getMyTrips, resendVerification } from '../api/client';
import { ConfirmDialog } from '../components/UI/ConfirmDialog';
import { EditProfileDialog } from '../components/UI/EditProfileDialog';
import type { TripRecord } from '../types';

const CANCELLATION_CUTOFF_HOURS = 48;

function canCancel(trip: TripRecord) {
  if (trip.status === 'cancelled') return false;
  const hoursUntilCheckIn = (new Date(trip.checkIn).getTime() - Date.now()) / (60 * 60 * 1000);
  return hoursUntilCheckIn >= CANCELLATION_CUTOFF_HOURS;
}

export function Profile() {
  const { user, token } = useAuth();
  const { showToast } = useToast();
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [tripPendingCancel, setTripPendingCancel] = useState<TripRecord | null>(null);
  const [resending, setResending] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);

  const loadTrips = () => {
    if (!token) return;
    setLoading(true);
    getMyTrips(token)
      .then(setTrips)
      .catch(() => showToast('Could not load your trips.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(loadTrips, [token]);

  if (!user) return null;

  const handleResendVerification = async () => {
    setResending(true);
    try {
      const result = await resendVerification(user.email);
      showToast(result.message);
    } catch (resendError) {
      showToast(resendError instanceof Error ? resendError.message : 'Failed to resend verification email.', 'error');
    } finally {
      setResending(false);
    }
  };

  const handleCancel = async () => {
    const trip = tripPendingCancel;
    if (!token || !trip) return;
    setTripPendingCancel(null);
    setCancellingId(trip.id);
    try {
      await cancelBooking(trip.id, token);
      showToast('Trip cancelled.');
      loadTrips();
    } catch (cancelError) {
      showToast(cancelError instanceof Error ? cancelError.message : 'Failed to cancel booking.', 'error');
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

          {!user.emailVerified && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4">
              <p className="text-sm text-amber-800">Please verify your email address to secure your account.</p>
              <button
                onClick={handleResendVerification}
                disabled={resending}
                className="text-sm font-semibold text-amber-900 hover:underline disabled:opacity-50"
              >
                {resending ? 'Sending…' : 'Resend verification email'}
              </button>
            </div>
          )}

          <div
            role="button"
            tabIndex={0}
            onClick={() => setEditingProfile(true)}
            onKeyDown={(event) => event.key === 'Enter' && setEditingProfile(true)}
            className="flex cursor-pointer items-center gap-4 rounded-2xl border border-gray-200 p-8 transition-colors hover:border-primary hover:shadow-sm"
          >
            <img 
              className="h-20 w-20 rounded-full object-cover" 
              src={user.avatar} 
              alt={user.name} 
            />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {user.name} {user.surname}
              </h2>
              <p className="text-gray-600">{user.email}</p>
              {user.phone && <p className="text-gray-600">{user.phone}</p>}
            </div>
            <span className="text-sm font-semibold text-primary">Edit profile</span>
          </div>
        </div>

        {/* Trips Section */}
        <div>
          <h2 className="mb-6 text-2xl font-bold text-gray-900">Your Trips</h2>

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
                        {!cancelled && trip.paymentStatus !== 'paid' && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Payment due</span>
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
                        {!cancelled && trip.paymentStatus !== 'paid' && (
                          <Link to={`/booking/${trip.id}/pay`} className="text-sm font-medium text-primary hover:underline">
                            Complete payment
                          </Link>
                        )}
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
      <EditProfileDialog open={editingProfile} onClose={() => setEditingProfile(false)} />
    </main>
  );
}
