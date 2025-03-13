import { pgTable, serial, varchar } from 'drizzle-orm/pg-core';

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
});

// Types for TypeScript
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert; 