ALTER TABLE "reviews" DROP CONSTRAINT "reviews_listing_id_listings_id_fk";
--> statement-breakpoint
ALTER TABLE "reviews" DROP COLUMN "listing_id";