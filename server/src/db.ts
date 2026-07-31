import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const PBKDF2_ITERATIONS = 210000;

export const hashPassword = (password: string): string => {
  if (!password) return '';
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 64, 'sha512').toString('hex');
  return `pbkdf2$sha512$${PBKDF2_ITERATIONS}$${salt}$${hash}`;
};

export const verifyPassword = (password: string, storedHash: string): boolean => {
  if (!password || !storedHash) return false;

  // Backward compatibility with legacy SHA-256 seeded passwords (no separator)
  if (!storedHash.includes('$') && !storedHash.includes(':')) {
    const legacyHash = crypto.createHash('sha256').update(password).digest('hex');
    return legacyHash === storedHash;
  }

  // Legacy PBKDF2 format (salt:hash, 1000 iterations)
  if (!storedHash.includes('$')) {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;
    const checkHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === checkHash;
  }

  // Current format: pbkdf2$sha512$<iterations>$<salt>$<hash>
  const [algorithm, digest, iterationsStr, salt, hash] = storedHash.split('$');
  if (algorithm !== 'pbkdf2' || !salt || !hash) return false;
  const checkHash = crypto.pbkdf2Sync(password, salt, parseInt(iterationsStr, 10) || PBKDF2_ITERATIONS, 64, digest as any).toString('hex');
  return hash === checkHash;
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

export const getClient = async (): Promise<PoolClient> => {
  return await pool.connect();
};
