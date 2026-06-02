import { Pool } from 'pg';

// Disable SSL certificate validation for self-signed certs
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

console.log('Database URL:', process.env.DATABASE_URL ? 'Set' : 'NOT SET');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
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
