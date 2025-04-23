import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { Pool } from '@neondatabase/serverless';
import * as schema from './schema';

// For local development
const connectionString =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/remarket';

// Create a Drizzle client based on environment with the schema for query builder
export const db =
  process.env.NODE_ENV === 'production'
    ? drizzleNeon(new Pool({ connectionString }), { schema })
    : drizzlePostgres(postgres(connectionString, { max: 10 }), { schema });

// Function to run migrations programmatically if needed
export const runMigrations = async () => {
  const migrationClient = postgres(connectionString, { max: 1 });

  try {
    await migrate(drizzlePostgres(migrationClient), {
      migrationsFolder: 'lib/db/migrations',
    });
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  } finally {
    await migrationClient.end();
  }
};
