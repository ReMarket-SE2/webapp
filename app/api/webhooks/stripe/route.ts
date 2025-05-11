import { Stripe } from 'stripe';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  let event: Stripe.Event;

  try {
    const stripeSignature = (await headers()).get('stripe-signature');

    event = stripe.webhooks.constructEvent(
      await req.text(),
      stripeSignature as string,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    // On error, log and return the error message.
    if (err! instanceof Error) console.log(err);
    console.log(`❌ Error message: ${errorMessage}`);
    return NextResponse.json({ message: `Webhook Error: ${errorMessage}` }, { status: 400 });
  }

  // Successfully constructed event.
  console.log('✅ Success:', event.id);

  const permittedEvents: string[] = ['checkout.session.completed'];

  if (permittedEvents.includes(event.type)) {
    let data;

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          data = event.data.object as Stripe.Checkout.Session;
          console.log(`💰 CheckoutSession status: ${data.payment_status}`);
          break;
        default:
          throw new Error(`Unhandled event: ${event.type}`);
      }
    } catch (error) {
      console.log(error);
      return NextResponse.json({ message: 'Webhook handler failed' }, { status: 500 });
    }
  }

  // Return a response to acknowledge receipt of the event.
  return NextResponse.json({ message: 'Received' }, { status: 200 });
}
