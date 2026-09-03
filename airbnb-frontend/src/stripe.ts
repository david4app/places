import { loadStripe } from '@stripe/stripe-js';

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Payment pages check this and show a setup message instead of crashing when the key is missing.
export const stripePromise = publishableKey ? loadStripe(publishableKey) : null;
