import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  schema: './src/infrastructure/database/schema/*.ts',
  out: './src/infrastructure/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://orbito_user:orbito_password@localhost:5432/orbito_db',
  },
  verbose: true,
  strict: true,
});
