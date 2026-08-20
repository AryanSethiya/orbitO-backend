import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './index.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function runMigrations() {
  console.log('🔄 Enabling pgvector extension and running database migrations...');
  try {
    // Enable pgvector extension
    await pool.query('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log('✅ pgvector extension enabled.');

    const migrationsFolder = join(__dirname, 'migrations');
    await migrate(db, { migrationsFolder });
    console.log('✅ Database migrations applied successfully!');
  } catch (error) {
    console.error('❌ Failed to run database migrations:', error);
    throw error;
  }
}

// Execute migrations
runMigrations()
  .then(() => pool.end())
  .catch(() => process.exit(1));
