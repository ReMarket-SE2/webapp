ALTER TABLE "listings" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;