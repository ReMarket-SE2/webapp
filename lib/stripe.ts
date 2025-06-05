import Stripe from 'stripe';

const apiKey = process.env.STRIPE_SECRET_KEY || 'invalid_secret';

const stripe = new Stripe(apiKey, {
  apiVersion: '2025-05-28.basil',
});

export { stripe };
