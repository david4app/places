import Stripe from 'stripe';

const secretKey = process.env.STRIPE_SECRET_KEY;

// Payment routes check this and return a clear error instead of crashing when the key is missing.
export const stripe = secretKey ? new Stripe(secretKey) : null;
