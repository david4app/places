import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useNavigate, useParams, Link } from 'react-router-dom';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Button } from '../components/UI/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { confirmPayment, createPaymentIntent, getBooking } from '../api/client';
import { stripePromise } from '../stripe';
import type { TripRecord } from '../types';

function CheckoutForm({ bookingId }: { bookingId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const { token } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements || !token) return;
    setError('');
    setSubmitting(true);

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (stripeError) {
      setError(stripeError.message ?? 'Payment failed.');
      setSubmitting(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      try {
        await confirmPayment(bookingId, token);
        showToast('Payment successful! Your trip is booked.');
        navigate('/profile');
      } catch (confirmError) {
        showToast(confirmError instanceof Error ? confirmError.message : 'Payment succeeded but confirmation failed.', 'error');
      }
    } else {
      setError('Payment did not complete. Please try again.');
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <Button type="submit" disabled={!stripe || submitting} className="w-full text-lg py-4">
        {submitting ? 'Processing…' : 'Pay now'}
      </Button>
    </form>
  );
}

export function Payment() {
  const { id } = useParams();
  const { token } = useAuth();
  const [booking, setBooking] = useState<TripRecord | null | undefined>(undefined);
  const [clientSecret, setClientSecret] = useState('');
  const [setupError, setSetupError] = useState('');

  useEffect(() => {
    if (!id || !token) return;
    getBooking(id, token)
      .then(setBooking)
      .catch(() => setBooking(null));
    createPaymentIntent(id, token)
      .then(({ clientSecret: secret }) => setClientSecret(secret))
      .catch((error) => setSetupError(error instanceof Error ? error.message : 'Failed to start payment.'));
  }, [id, token]);

  if (!id) return <Navigate to="/404" replace />;
  if (booking === null) return <Navigate to="/404" replace />;

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-lg px-4 py-12 sm:px-6 lg:px-8">
        <Link to="/profile" className="mb-6 inline-flex text-gray-600 hover:text-gray-900 transition-colors">
          ← Back to profile
        </Link>

        <h1 className="mb-2 text-3xl font-bold text-gray-900">Complete your payment</h1>
        <p className="mb-8 text-gray-600">Secure checkout powered by Stripe.</p>

        {booking && (
          <div className="mb-8 rounded-2xl border border-gray-200 p-6">
            <p className="font-semibold text-gray-900">{booking.listing.title}</p>
            <p className="text-sm text-gray-600">{booking.listing.location}</p>
            <p className="mt-3 text-sm text-gray-600">
              {booking.checkIn} → {booking.checkOut} · {booking.guests} guest{booking.guests > 1 ? 's' : ''}
            </p>
            <p className="mt-3 text-2xl font-bold text-gray-900">${booking.totalPrice}</p>
          </div>
        )}

        {!stripePromise ? (
          <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
            Payments aren't configured yet. Set VITE_STRIPE_PUBLISHABLE_KEY in the frontend and STRIPE_SECRET_KEY in the backend.
          </p>
        ) : setupError ? (
          <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{setupError}</p>
        ) : !clientSecret ? (
          <p className="text-gray-600">Preparing checkout…</p>
        ) : (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CheckoutForm bookingId={id} />
          </Elements>
        )}
      </div>
    </main>
  );
}
