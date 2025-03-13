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
   npm run db:generate
   ```

3. Apply migrations to the database:

   ```bash
   npm run db:migrate
   ```

4. View your database with Drizzle Studio:
   ```bash
   npm run db:studio
   ```

## Database Schema

### Users

- `id`: Primary key
- `username`: Unique username
- `passwordHash`: Hashed password
- `email`: Unique email address
- `profileImageId`: Foreign key to photos
- `createdAt`: Timestamp of creation
- `updatedAt`: Timestamp of last update

### Categories

- `id`: Primary key
- `name`: Category name

### Photos

- `id`: Primary key
- `url`: URL to the photo

### Listings

- `id`: Primary key
- `title`: Listing title
- `price`: Listing price
- `status`: Enum ('Active', 'Archived', 'Draft')
- `description`: Short description
- `longDescription`: Detailed description
- `categoryId`: Foreign key to categories

### Wishlists

- `id`: Primary key
- `name`: Wishlist name
- `userId`: Foreign key to users

### Reviews

- `id`: Primary key
- `title`: Review title
- `score`: Rating score (1-5)
- `description`: Review text
- `userId`: Foreign key to users
- `listingId`: Foreign key to listings

### Orders

- `id`: Primary key
- `userId`: Foreign key to users
- `listingId`: Foreign key to listings
- `shippingAddress`: Shipping address text
- `status`: Enum ('Shipping', 'Shipped')
- `shippedDate`: Date when the order was shipped (nullable)
- `paymentId`: External payment service ID
- `paymentStatus`: Payment status from external service
- `createdAt`: Timestamp of creation
- `updatedAt`: Timestamp of last update

## Junction Tables

### Listing Photos

Links listings to their photos:

- `listingId`: Foreign key to listings
- `photoId`: Foreign key to photos

### Wishlist Listings

Links wishlists to listings (many-to-many):

- `wishlistId`: Foreign key to wishlists
- `listingId`: Foreign key to listings

## Adding New Models

1. Create a new schema file in the `schema/` directory
2. Export the schema in `schema/index.ts`
3. Generate and apply migrations
