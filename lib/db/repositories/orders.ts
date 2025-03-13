import { db } from '..';
import { orders, NewOrder, Order, OrderStatus } from '../schema/orders';
import { eq } from 'drizzle-orm';

export const ordersRepository = {
  /**
   * Create a new order
   */
  create: async (order: NewOrder): Promise<Order> => {
    const result = await db.insert(orders).values(order).returning();
    return result[0];
  },

  /**
   * Get an order by ID
   */
  getById: async (id: number): Promise<Order | undefined> => {
    const result = await db.select().from(orders).where(eq(orders.id, id));
    return result[0];
  },

  /**
   * Get all orders for a user
   */
  getByUserId: async (userId: number): Promise<Order[]> => {
    return await db.select().from(orders).where(eq(orders.userId, userId));
  },

  /**
   * Get all orders for a listing
   */
  getByListingId: async (listingId: number): Promise<Order[]> => {
    return await db.select().from(orders).where(eq(orders.listingId, listingId));
  },

  /**
   * Update an order
   */
  update: async (id: number, order: Partial<NewOrder>): Promise<Order | undefined> => {
    const result = await db
      .update(orders)
      .set(order)
      .where(eq(orders.id, id))
      .returning();
    return result[0];
  },

  /**
   * Update order status
   */
  updateStatus: async (id: number, status: OrderStatus, shippedDate?: Date): Promise<Order | undefined> => {
    const updateData: Partial<NewOrder> = { status };
    
    // If status is 'Shipped', set the shipped date if not provided
    if (status === 'Shipped' && !shippedDate) {
      updateData.shippedDate = new Date();
    } else if (shippedDate) {
      updateData.shippedDate = shippedDate;
    }
    
    return await ordersRepository.update(id, updateData);
  },

  /**
   * Update payment status
   */
  updatePaymentStatus: async (id: number, paymentId: string, paymentStatus: string): Promise<Order | undefined> => {
    return await ordersRepository.update(id, { paymentId, paymentStatus });
  },

  /**
   * Delete an order
   */
  delete: async (id: number): Promise<void> => {
    await db.delete(orders).where(eq(orders.id, id));
  },
}; 