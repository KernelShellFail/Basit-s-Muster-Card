import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

export const hashPassword = (password: string): string => {
  if (!password) return '';
  return crypto.createHash('sha256').update(password).digest('hex');
};

export const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'mustermate',
  password: process.env.DB_PASSWORD === 'YOUR_POSTGRESQL_PASSWORD_HERE' ? '' : process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

pool.on('connect', () => {
  console.log('PostgreSQL database pool connected.');
});

pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
});

// For compatibility with the old setup during transition
export const getClient = async (): Promise<PoolClient> => {
  return await pool.connect();
};
