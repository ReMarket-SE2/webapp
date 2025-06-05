import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions, checkUserSuspension } from '@/lib/auth';
import { db } from '@/lib/db';
import { wishlists, wishlistListings, listings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createWishlist } from '@/lib/wishlist/actions';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  // Authenticate user
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = parseInt(session.user.id as string, 10);

  // Check if user is suspended
  try {
    await checkUserSuspension(userId);
  } catch (e) {
    if (e instanceof Error) {
      return NextResponse.json({ error: e.message }, { status: 403 })
    }
    return NextResponse.json({ error: "Unknown error during checkout"}, { status: 500 });
  }

  // Get or create wishlist
  const existing = await db
    .select({ id: wishlists.id })
    .from(wishlists)
    .where(eq(wishlists.userId, userId))
    .limit(1);
  let wishlistId: number;
  if (existing.length === 0) {
    const created = await createWishlist(userId);
    wishlistId = created.id;
  } else {
    wishlistId = existing[0].id;
  }

  // Fetch wishlist items with price
  const items = await db
    .select({ id: listings.id, title: listings.title, price: listings.price })
    .from(wishlistListings)
    .innerJoin(listings, eq(wishlistListings.listingId, listings.id))
    .where(eq(wishlistListings.wishlistId, wishlistId));

  if (items.length === 0) {
    return NextResponse.json({ error: 'Wishlist is empty' }, { status: 400 });
  }

  // Map to Stripe line items
  const line_items = items.map(item => ({
    price_data: {
      currency: 'usd',
      product_data: {
        name: item.title,
        metadata: { listingId: item.id.toString() },
      },
      unit_amount: Math.round(Number(item.price) * 100),
    },
    quantity: 1,
  }));

  // Build URLs
  const protocol = req.headers.get('x-forwarded-proto') || 'http';
  const host = req.headers.get('host');
  const origin = `${protocol}://${host}`;

  // Create checkout session
  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'DE', 'FR', 'AU'],
      },
      success_url: `${origin}/orders`,
      cancel_url: `${origin}`,
      metadata: { userId: userId.toString() },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
