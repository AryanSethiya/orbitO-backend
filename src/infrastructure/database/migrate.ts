import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './index.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function runMigrations() {
  console.log('🔄 Running database migrations...');
  try {
    const migrationsFolder = join(__dirname, 'migrations');
    await migrate(db, { migrationsFolder });
    console.log('✅ Database migrations applied successfully!');
  } catch (error) {
    console.error('❌ Failed to run database migrations:', error);
    throw error;
  }
}

// Enable direct script execution (e.g. for package.json scripts)
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => pool.end())
    .catch(() => process.exit(1));
}
