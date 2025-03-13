CREATE TYPE "public"."listing_status" AS ENUM('Active', 'Archived', 'Draft');--> statement-breakpoint
CREATE TABLE "listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"status" "listing_status" DEFAULT 'Draft' NOT NULL,
	"description" varchar(500),
	"long_description" text
);
--> statement-breakpoint
ALTER TABLE "photos" ADD COLUMN "listing_id" integer;--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "photos_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;