'use server';

import { db } from '@/lib/db';
import { NewOrder, Order, orders } from '@/lib/db/schema/orders';
import { NewOrderItem, OrderItem, orderItems } from '@/lib/db/schema/order_items';
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

export async function getOrdersByUserId(
  userId: number,
  options: { bought?: boolean; sold?: boolean } = {}
) {
  // Bought orders: user is the buyer (orders.userId === userId)
  if (options.bought && !options.sold) {
    const boughtOrders = await db.query.orders.findMany({
      where: eq(orders.userId, userId),
      with: {
        orderItems: {
          with: {
            listing: {
              columns: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
    });

    if (!boughtOrders) return [];

    return boughtOrders.map(order => ({
      ...order,
      totalAmount: order.orderItems.reduce(
        (acc, item) => acc + Number(item.priceAtPurchase) * item.quantity,
        0
      ),
    }));
  }

  // Sold orders: user is the seller (any order containing a listing where listings.sellerId === userId)
  if (options.sold && !options.bought) {
    // Find all orderItems where the listing's sellerId is the user
    const soldOrderItems = await db.query.orderItems.findMany({
      with: {
        order: true,
        listing: {
          columns: {
            id: true,
            title: true,
            sellerId: true,
          },
        },
      },
    });

    // Filter orderItems where the listing's sellerId matches the userId
    const filteredOrderItems = soldOrderItems.filter(
      item => item.listing?.sellerId === userId
    );

    // Group orderItems by orderId
    const orderMap = new Map<number, { order: Order; orderItems: OrderItem[] }>();
    for (const item of filteredOrderItems) {
      if (!item.order) continue;
      if (!orderMap.has(item.order.id))
        orderMap.set(item.order.id, { order: item.order, orderItems: [] });
      orderMap.get(item.order.id)!.orderItems.push(item);
    }

    // Compose orders with totals
    const ordersWithTotals = Array.from(orderMap.values()).map(({ order, orderItems }) => ({
      ...order,
      orderItems,
      totalAmount: orderItems.reduce(
        (acc, item) => acc + Number(item.priceAtPurchase) * item.quantity,
        0
      ),
    }));

    // Sort: "Shipping" status first, then by createdAt descending
    ordersWithTotals.sort((a, b) => {
      if (a.status === b.status) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (a.status === "Shipping") return -1;
      if (b.status === "Shipping") return 1;
      return 0;
    });

    return ordersWithTotals;
  }

  // Default: return all orders where user is the buyer (legacy behavior)
  const userOrders = await db.query.orders.findMany({
    where: eq(orders.userId, userId),
    with: {
      orderItems: {
        with: {
          listing: {
            columns: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
    orderBy: (orders, { desc }) => [desc(orders.createdAt)],
  });

  if (!userOrders) return [];

  return userOrders.map(order => ({
    ...order,
    totalAmount: order.orderItems.reduce(
      (acc, item) => acc + Number(item.priceAtPurchase) * item.quantity,
      0
    ),
  }));
}

export async function getSellerByOrderId(orderId: number) {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      orderItems: {
        with: {
          listing: {
            with: {
              seller: true,
            },
          },
        },
      },
    },
  });
  return order?.orderItems[0]?.listing?.seller || null;
}

export async function getBuyerByOrderId(orderId: number) {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    with: {
      user: true,
    },
  });
  return order?.user || null;
}

export async function markOrderAsShipped(orderId: number) {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });

  if (!order) {
    throw new Error('Order not found');
  }

  // Update the order status to "Shipped"
  await db.update(orders).set({ status: 'Shipped' }).where(eq(orders.id, orderId));
}