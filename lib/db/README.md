# Database Setup with Drizzle ORM

This directory contains the database setup for the ReMarket online store using Drizzle ORM with PostgreSQL.

## Directory Structure

- `index.ts`: Database connection configuration
- `migrate.ts`: Script to run migrations programmatically
- `schema/`: Contains database schema definitions
  - `users.ts`: User model schema
  - `categories.ts`: Categories model schema
  - `photos.ts`: Photos model schema
  - `listings.ts`: Listings model schema
  - `listing_photos.ts`: Junction table for listings and photos
  - `wishlists.ts`: Wishlists model schema
  - `wishlist_listings.ts`: Junction table for wishlists and listings
  - `reviews.ts`: Reviews model schema
  - `orders.ts`: Orders model schema
  - `index.ts`: Exports all schemas
- `migrations/`: Contains generated migration files

## Getting Started

1. Start the PostgreSQL database:

   ```bash
   docker-compose up -d
   ```

2. Generate migrations when you change the schema:

   ```bash
   pnpm db:generate --name descriptive_name
   ```

   Always use a descriptive name that explains what the migration does, for example:

   ```bash
   pnpm db:generate --name add_oauth_accounts_table
   pnpm db:generate --name make_password_optional
   pnpm db:generate --name add_user_role_column
   ```

3. Apply migrations to the database:

   ```bash
   pnpm db:migrate
   ```

4. View your database with Drizzle Studio:
   ```bash
   pnpm db:studio
   ```

## Database Schema

### Users

- `id`: Primary key (serial)
- `username`: Unique username (varchar(50))
- `passwordHash`: Hashed password (text)
- `email`: Unique email address (varchar(255))
- `profileImageId`: Foreign key to photos (integer, nullable)
- `bio`: Bio of the user profile
- `role`: Enum ('user', 'admin') with default 'user'
- `createdAt`: Timestamp of creation (default: now())
- `updatedAt`: Timestamp of last update (default: now())
- `passwordResetToken`: Reset token for password recovery (text, nullable)
- `passwordResetExpires`: Expiration time for reset token (timestamp, nullable)

### Categories

- `id`: Primary key (serial)
- `name`: Category name (varchar(100), unique)

### Photos

- `id`: Primary key (serial)
- `image`: Base64 encoded image data (text)

### Listings

- `id`: Primary key (serial)
- `title`: Listing title (varchar(255))
- `price`: Listing price (numeric(10,2))
- `status`: Enum ('Active', 'Archived', 'Draft') with default 'Draft'
- `description`: Short description (varchar(500), nullable)
- `longDescription`: Detailed description (text, nullable)
- `categoryId`: Foreign key to categories (integer, nullable)

### Wishlists

- `id`: Primary key (serial)
- `name`: Wishlist name (varchar(100))
- `userId`: Foreign key to users (integer)

### Reviews

- `id`: Primary key (serial)
- `title`: Review title (varchar(255))
- `score`: Rating score (integer, 1-5)
- `description`: Review text (text, nullable)
- `userId`: Foreign key to users (integer)
- `listingId`: Foreign key to listings (integer)

### Orders

- `id`: Primary key (serial)
- `userId`: Foreign key to users (integer)
- `listingId`: Foreign key to listings (integer)
- `shippingAddress`: Shipping address text (text)
- `status`: Enum ('Shipping', 'Shipped') with default 'Shipping'
- `shippedDate`: Date when shipped (timestamp, nullable)
- `paymentId`: External payment service ID (varchar(255), nullable)
- `paymentStatus`: Payment status (varchar(50), nullable)
- `createdAt`: Timestamp of creation (default: now())
- `updatedAt`: Timestamp of last update (default: now())

## Junction Tables

### Listing Photos

Links listings to their photos (with cascade delete):

- `listingId`: Foreign key to listings (integer)
- `photoId`: Foreign key to photos (integer)
- Primary key: (listingId, photoId)

### Wishlist Listings

Links wishlists to listings (many-to-many, with cascade delete):

- `wishlistId`: Foreign key to wishlists (integer)
- `listingId`: Foreign key to listings (integer)
- Primary key: (wishlistId, listingId)

## Adding New Models

1. Create a new schema file in the `schema/` directory
2. Export the schema in `schema/index.ts`
3. Generate and apply migrations
