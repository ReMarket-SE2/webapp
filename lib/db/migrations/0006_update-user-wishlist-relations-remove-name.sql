ALTER TABLE "wishlists" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_user_id_unique" UNIQUE("user_id");