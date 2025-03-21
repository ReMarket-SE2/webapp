CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"score" integer NOT NULL,
	"description" text,
	"user_id" integer NOT NULL,
	"listing_id" integer NOT NULL,
	CONSTRAINT "score_check" CHECK ("reviews"."score" >= 1 AND "reviews"."score" <= 5)
);
--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;