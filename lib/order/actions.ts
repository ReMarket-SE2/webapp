'use server';

import { db } from '@/lib/db';
import { NewOrder, Order, orders } from '@/lib/db/schema/orders';
import { NewOrderItem, orderItems } from '@/lib/db/schema/order_items';
import { listings } from '@/lib/db/schema/listings';
import type Stripe from 'stripe';
import { eq } from 'drizzle-orm';

interface ItemToOrder {
  listingId: number;
  priceAtPurchase: number; // Price in currency units (e.g., dollars)
  quantity: number;
}

function formatStripeAddress(address: Stripe.Address | null | undefined): string {
  if (!address) {
    // This case should ideally be handled before calling createOrder
    // if shippingAddress is truly not nullable in the DB.
    // For now, returning an empty string or throwing an error.
    // Consider making shippingAddress nullable in schema or ensuring Stripe always provides it.
    console.warn('Stripe address is null or undefined.');
    return 'No address provided';
  }
  // Simple string representation, consider a more structured format or JSON.stringify
  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postal_code,
    address.country,
  ];
  return parts.filter(Boolean).join(', ');
}

export async function createOrder(
  userId: number,
  itemsToOrder: ItemToOrder[],
  shippingAddressDetails: Stripe.Address | null | undefined,
  paymentId: string,
  paymentStatus: string
): Promise<Order> {
  if (!shippingAddressDetails) {
    console.warn('No shipping address provided, storing as "No address provided"');
  }

  const formattedAddress = shippingAddressDetails
    ? formatStripeAddress(shippingAddressDetails)
    : 'No address provided';

  const newOrderData: NewOrder = {
    userId,
    shippingAddress: formattedAddress,
    status: 'Shipping', // Default status
    paymentId,
    paymentStatus,
    // shippedDate can be set later when the order is actually shipped
  };

  // Create the main order record
  const [createdOrder] = await db.insert(orders).values(newOrderData).returning();

  if (!createdOrder) {
    throw new Error('Failed to create order.');
  }

  // Create order item records
  const newOrderItemsData: NewOrderItem[] = itemsToOrder.map(item => ({
    orderId: createdOrder.id,
    listingId: item.listingId,
    quantity: item.quantity,
    // Ensure priceAtPurchase is a string if your decimal column expects it,
    // or a number if it handles numeric types directly. Drizzle typically handles this.
    priceAtPurchase: item.priceAtPurchase.toString(),
  }));

  if (newOrderItemsData.length > 0) {
    await db.insert(orderItems).values(newOrderItemsData);
  }

  return createdOrder;
}

export async function getOrdersByUserId(userId: number) {
  const userOrders = await db.query.orders.findMany({
    where: eq(orders.userId, userId),
    with: {
      orderItems: {
        with: {
          listing: {
            columns: {
              id: true,
              title: true,
              // Potentially add other listing fields needed for display, like an image URL
            },
          },
        },
      },
    },
    orderBy: (orders, { desc }) => [desc(orders.createdAt)],
  });

  if (!userOrders) {
    return [];
  }

  // Calculate total amount for each order and map to a more usable structure
  const ordersWithTotals = userOrders.map(order => {
    const totalAmount = order.orderItems.reduce((acc, item) => {
      return acc + Number(item.priceAtPurchase) * item.quantity;
    }, 0);
    return {
      ...order,
      totalAmount,
    };
  });

  return ordersWithTotals;
}

export async function getOrderByListingId(listingId: number) {
  // Find the order item for this listing
  const orderItem = await db.query.orderItems.findFirst({
    where: eq(orderItems.listingId, listingId),
    with: {
      order: true,
    },
  });
  return orderItem?.order || null;
}

export async function getSellerByListingId(listingId: number) {
  // Get the listing and its seller
  const listing = await db.query.listings.findFirst({
    where: eq(listings.id, listingId),
    with: {
      seller: true,
    },
  });
  return listing?.seller || null;
}

export async function getBuyerByListingId(listingId: number) {
  // Get the order for this listing, then the user (buyer)
  const orderItem = await db.query.orderItems.findFirst({
    where: eq(orderItems.listingId, listingId),
    with: {
      order: {
        with: {
          user: true,
        },
      },
    },
  });
  return orderItem?.order?.user || null;
}