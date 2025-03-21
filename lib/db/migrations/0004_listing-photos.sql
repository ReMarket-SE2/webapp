CREATE TABLE "listing_photos" (
	"listing_id" integer NOT NULL,
	"photo_id" integer NOT NULL,
	CONSTRAINT "listing_photos_listing_id_photo_id_pk" PRIMARY KEY("listing_id","photo_id")
);
--> statement-breakpoint
ALTER TABLE "photos" DROP CONSTRAINT "photos_listing_id_listings_id_fk";
--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "category_id" integer;--> statement-breakpoint
ALTER TABLE "listing_photos" ADD CONSTRAINT "listing_photos_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_photos" ADD CONSTRAINT "listing_photos_photo_id_photos_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."photos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photos" DROP COLUMN "listing_id";