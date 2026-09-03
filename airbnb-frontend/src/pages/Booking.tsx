import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { differenceInCalendarDays } from 'date-fns';
import { Button } from '../components/UI/Button';
import { Input } from '../components/UI/Input';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { createBooking, getListing, getListingAvailability } from '../api/client';
import type { AvailabilityRange, Listing } from '../types';

export function Booking() {
  const { id } = useParams();
  const [listing, setListing] = useState<Listing | null | undefined>(undefined);
  const [blockedRanges, setBlockedRanges] = useState<AvailabilityRange[]>([]);
  const navigate = useNavigate();
  const { token } = useAuth();
  const { showToast } = useToast();

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    getListing(id)
      .then(setListing)
      .catch(() => setListing(null));
    getListingAvailability(id)
      .then(setBlockedRanges)
      .catch(() => setBlockedRanges([]));
  }, [id]);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    return differenceInCalendarDays(new Date(checkOut), new Date(checkIn));
  }, [checkIn, checkOut]);

  if (listing === undefined) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-xl text-gray-600">Loading…</p>
      </main>
    );
  }

  if (!listing) {
    return <Navigate to="/404" replace />;
  }

  const totalPrice = nights > 0 ? nights * listing.price : 0;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    if (nights <= 0) {
      setError('Check-out date must be after check-in date.');
      return;
    }
    if (guests < 1 || guests > listing.maxGuests) {
      setError(`This place fits up to ${listing.maxGuests} guests.`);
      return;
    }
    const hasConflict = blockedRanges.some(
      (range) => checkIn < range.checkOut && checkOut > range.checkIn,
    );
    if (hasConflict) {
      setError('Those dates overlap with an existing booking. Please choose different dates.');
      return;
    }
    if (!token) {
      setError('You must be logged in to book a stay.');
      return;
    }

    setSubmitting(true);
    const payload = { listingId: listing.id, checkIn, checkOut, guests };
    try {
      const booking = await createBooking(payload, token);
      navigate(`/booking/${booking.id}/pay`);
    } catch (bookingError) {
      const message = bookingError instanceof Error ? bookingError.message : 'Failed to create booking.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link to={`/listing/${listing.id}`} className="mb-6 inline-flex text-gray-600 hover:text-gray-900 transition-colors">
          ← Back to listing
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <h1 className="mb-2 text-3xl font-bold text-gray-900">Confirm your booking</h1>
            <p className="mb-8 text-gray-600">Review and complete your reservation</p>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Check-in/Check-out Section */}
              <div className="rounded-xl border border-gray-200 p-6">
                <h2 className="mb-6 text-lg font-semibold text-gray-900">Your stay</h2>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Check in
                    </label>
                    <Input 
                      type="date" 
                      required 
                      value={checkIn} 
                      onChange={(event) => setCheckIn(event.target.value)}
                      className="rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Check out
                    </label>
                    <Input 
                      type="date" 
                      required 
                      value={checkOut} 
                      onChange={(event) => setCheckOut(event.target.value)}
                      className="rounded-lg"
                    />
                  </div>
                </div>

                {nights > 0 && (
                  <p className="mt-3 text-sm text-gray-600">
                    {nights} night{nights !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {/* Guests Section */}
              <div className="rounded-xl border border-gray-200 p-6">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">Guests</h2>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700 mb-2 block">
                    Number of guests
                  </span>
                  <select
                    value={guests}
                    onChange={(event) => setGuests(Number(event.target.value))}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {Array.from({ length: listing.maxGuests }, (_, i) => i + 1).map((num) => (
                      <option key={num} value={num}>
                        {num} guest{num > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                disabled={submitting}
                className="w-full text-lg py-4"
              >
                {submitting ? 'Confirming…' : 'Confirm and pay'}
              </Button>

              <p className="text-center text-sm text-gray-600">
                You won't be charged yet. After the next step you'll have a chance to review your booking.
              </p>
            </form>
          </div>

          {/* Booking Summary Card */}
          <div>
            <div className="sticky top-24 rounded-2xl border border-gray-200 p-6 shadow-lg">
              {/* Property Image */}
              <div className="rounded-xl overflow-hidden mb-4">
                <img 
                  className="h-48 w-full object-cover" 
                  src={listing.images[0]} 
                  alt={listing.title} 
                />
              </div>

              {/* Property Info */}
              <h3 className="font-semibold text-gray-900 mb-1">{listing.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{listing.location}</p>

              {/* Price Breakdown */}
              <div className="border-t border-gray-200 pt-4 space-y-3 text-sm">
                <div className="flex justify-between text-gray-700">
                  <span>
                    ${listing.price} × {nights || 0} night{nights === 1 ? '' : 's'}
                  </span>
                  <span className="font-medium">${nights * listing.price}</span>
                </div>

                <div className="flex justify-between pt-3 border-t border-gray-200 text-gray-700">
                  <span>Cleaning fee</span>
                  <span className="font-medium">$0</span>
                </div>

                <div className="flex justify-between text-base font-semibold text-gray-900 pt-3 border-t border-gray-200">
                  <span>Total</span>
                  <span>${totalPrice}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
