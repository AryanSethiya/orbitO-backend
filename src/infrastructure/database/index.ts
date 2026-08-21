import dns from 'dns';
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {}

import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema/index.js';
import { env } from '../../config/env.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl:
    env.DATABASE_URL.includes('supabase.co') || env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : undefined,
});

export const db = drizzle(pool, { schema });
