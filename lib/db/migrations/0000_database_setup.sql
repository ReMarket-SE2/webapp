CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('Active', 'Archived', 'Draft');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('Shipping', 'Shipped');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	CONSTRAINT "categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"password_hash" text NOT NULL,
	"email" varchar(255) NOT NULL,
	"profile_image_id" integer,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "photos" (
	"id" serial PRIMARY KEY NOT NULL,
	"image" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"status" "listing_status" DEFAULT 'Draft' NOT NULL,
	"description" varchar(500),
	"long_description" text,
	"category_id" integer
);
--> statement-breakpoint
CREATE TABLE "listing_photos" (
	"listing_id" integer NOT NULL,
	"photo_id" integer NOT NULL,
	CONSTRAINT "listing_photos_listing_id_photo_id_pk" PRIMARY KEY("listing_id","photo_id")
);
--> statement-breakpoint
CREATE TABLE "wishlists" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"user_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wishlist_listings" (
	"wishlist_id" integer NOT NULL,
	"listing_id" integer NOT NULL,
	CONSTRAINT "wishlist_listings_wishlist_id_listing_id_pk" PRIMARY KEY("wishlist_id","listing_id")
);
--> statement-breakpoint
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
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"listing_id" integer NOT NULL,
	"shipping_address" text NOT NULL,
	"status" "order_status" DEFAULT 'Shipping' NOT NULL,
	"shipped_date" timestamp,
	"payment_id" varchar(255),
	"payment_status" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_profile_image_id_photos_id_fk" FOREIGN KEY ("profile_image_id") REFERENCES "public"."photos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_photos" ADD CONSTRAINT "listing_photos_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_photos" ADD CONSTRAINT "listing_photos_photo_id_photos_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."photos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_listings" ADD CONSTRAINT "wishlist_listings_wishlist_id_wishlists_id_fk" FOREIGN KEY ("wishlist_id") REFERENCES "public"."wishlists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_listings" ADD CONSTRAINT "wishlist_listings_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;