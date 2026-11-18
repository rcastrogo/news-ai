import 'dotenv/config';
import pg from 'pg';
const { types, Pool } = pg;
const host = process.env.POSTGRES_HOST || 'localhost';

// OID 23 es INT4, OID 20 es INT8 (BigInt)
types.setTypeParser(23, (val) => parseInt(val, 10));
types.setTypeParser(20, (val) => parseInt(val, 10));

export const pool = new Pool({
  host,
  user: process.env.POSTGRES_USER,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT, 10) : 5432,
  max: 10
});

pool.on('error', (err) => console.error('PostgreSQL pool error:', err));

console.log("Config de conexión:", {
  user: process.env.POSTGRES_USER,
  host,
  passExists: !!process.env.POSTGRES_PASSWORD,
  db: process.env.POSTGRES_DB
});