import { Stripe } from 'stripe';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { clearWishlist } from '@/lib/wishlist/actions';
import { createOrder } from '@/lib/order/actions';

export const config = {
  api: {
    bodyParser: false,
  },
};

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
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object as Stripe.Checkout.Session;
          console.log(`💰 CheckoutSession status: ${session.payment_status}`);

          // Retrieve session with line items and shipping details
          const sessionWithLineItems: Stripe.Checkout.Session =
            await stripe.checkout.sessions.retrieve(session.id, {
              expand: ['line_items', 'line_items.data.price.product'],
            });

          const userIdString = sessionWithLineItems.metadata?.userId;
          if (!userIdString) {
            throw new Error('User ID not found in session metadata');
          }
          const userId = parseInt(userIdString, 10);

          const paymentId = sessionWithLineItems.id;
          const paymentStatus = sessionWithLineItems.payment_status;
          // Extract address: use shipping_details if available, else customer_details.address
          // @ts-expect-error shipping_details is not always available
          const shippingDetailsAny = sessionWithLineItems.shipping_details;
          const address: Stripe.Address | null | undefined =
            shippingDetailsAny?.address || sessionWithLineItems.customer_details?.address;

          const itemsToOrder = sessionWithLineItems.line_items?.data.map(item => {
            if (!item.price || !item.price.product || typeof item.price.product === 'string') {
              throw new Error('Price or product data is missing or not expanded for a line item.');
            }
            const product = item.price.product as Stripe.Product;
            const listingIdString = product.metadata?.listingId;
            if (!listingIdString) {
              throw new Error('Listing ID not found in product metadata for a line item.');
            }
            if (item.price.unit_amount_decimal === null && item.price.unit_amount === null) {
              throw new Error('Unit amount is missing for a line item.');
            }
            // Prefer unit_amount_decimal if available (string), otherwise unit_amount (integer cents)
            const priceInCents = item.price.unit_amount_decimal
              ? parseFloat(item.price.unit_amount_decimal)
              : item.price.unit_amount!;

            return {
              listingId: parseInt(listingIdString, 10),
              priceAtPurchase: priceInCents / 100, // Convert from cents to dollars/currency unit
              quantity: item.quantity || 1,
            };
          });

          if (!itemsToOrder || itemsToOrder.length === 0) {
            throw new Error('No items found in checkout session to order.');
          }

          // Create the order in your database
          await createOrder(
            userId,
            itemsToOrder,
            address,
            paymentId,
            paymentStatus || 'incomplete'
          );

          // Clear the user's wishlist
          await clearWishlist(userId);
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
