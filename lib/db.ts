import { Pool } from 'pg';

console.log('Database URL:', process.env.DATABASE_URL ? 'Set' : 'NOT SET');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Pool error:', err);
});

pool.on('connect', () => {
  console.log('✓ Database connected successfully');
});

export default pool;

