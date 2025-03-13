# Database Setup with Drizzle ORM

This directory contains the database setup for the ReMarket online store using Drizzle ORM with PostgreSQL.

## Directory Structure

- `index.ts`: Database connection configuration
- `migrate.ts`: Script to run migrations programmatically
- `schema/`: Contains database schema definitions
  - `users.ts`: User model schema
  - `index.ts`: Exports all schemas
- `migrations/`: Contains generated migration files
- `repositories/`: Contains database operation functions
  - `users.ts`: User repository with CRUD operations
  - `index.ts`: Exports all repositories

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

## Usage Examples

```typescript
// Import the repository
import { usersRepository } from 'lib/db/repositories';

// Create a new user
const newUser = await usersRepository.create({
  username: 'johndoe',
  passwordHash: 'hashed_password_here',
  email: 'john@example.com',
});

// Get user by ID
const user = await usersRepository.getById(1);

// Get user by username
const userByUsername = await usersRepository.getByUsername('johndoe');

// Update user
const updatedUser = await usersRepository.update(1, {
  email: 'newemail@example.com',
});

// Delete user
await usersRepository.delete(1);
```

## Adding New Models

1. Create a new schema file in the `schema/` directory
2. Export the schema in `schema/index.ts`
3. Create a repository file in the `repositories/` directory
4. Export the repository in `repositories/index.ts`
5. Generate and apply migrations
