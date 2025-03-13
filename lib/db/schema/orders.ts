import { pgTable, serial, integer, varchar, text, pgEnum, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { listings } from './listings';

// Create an enum for order status
export const orderStatusEnum = pgEnum('order_status', ['Shipping', 'Shipped']);

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  listingId: integer('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  shippingAddress: text('shipping_address').notNull(),
  status: orderStatusEnum('status').notNull().default('Shipping'),
  shippedDate: timestamp('shipped_date'),
  paymentId: varchar('payment_id', { length: 255 }),
  paymentStatus: varchar('payment_status', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Define the relations
export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  listing: one(listings, {
    fields: [orders.listingId],
    references: [listings.id],
  }),
}));

// Types for TypeScript
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderStatus = 'Shipping' | 'Shipped'; 