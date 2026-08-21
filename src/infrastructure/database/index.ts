import dns from 'dns';
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {}

import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema/index.js';
import { env } from '../../config/env.js';

const { Pool } = pg;

// Helper to ensure IPv4 pooler is used for Supabase on cloud providers without IPv6
function getResolvedDatabaseUrl(rawUrl: string): string {
  if (rawUrl.includes('db.deuqepmhuahgayczkolf.supabase.co')) {
    return rawUrl
      .replace('postgres:', 'postgres.deuqepmhuahgayczkolf:')
      .replace('db.deuqepmhuahgayczkolf.supabase.co:5432', 'aws-0-ap-south-1.pooler.supabase.com:6543');
  }
  return rawUrl;
}

const connectionString = getResolvedDatabaseUrl(env.DATABASE_URL);

export const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl:
    connectionString.includes('supabase.co') || connectionString.includes('pooler.supabase.com') || env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : undefined,
});

export const db = drizzle(pool, { schema });
