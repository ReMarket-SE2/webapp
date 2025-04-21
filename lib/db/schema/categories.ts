import { pgTable, serial, varchar, integer, AnyPgColumn } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  parentId: integer('parent_id').references((): AnyPgColumn => categories.id, { onDelete: 'set null' }),
});

// Define the relations
export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'parentCategory',
  }),
  children: many(categories, { relationName: 'parentCategory' }),
}));

// Types for TypeScript
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;