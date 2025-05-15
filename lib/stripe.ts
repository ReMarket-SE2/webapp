import Stripe from 'stripe';

const apiKey = process.env.STRIPE_SECRET_KEY || 'invalid_secret';

const stripe = new Stripe(apiKey, {
  apiVersion: '2025-04-30.basil',
});

export { stripe };
