import pg from 'pg';
import { migrate } from '../src/lib/server/schema.ts';

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('Set DATABASE_URL before running npm run db:setup');
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
  max: 1
});

await migrate(pool);

const summary = await pool.query(
  `SELECT (SELECT COUNT(*) FROM frames)::int AS frames,
   (SELECT COUNT(*) FROM frames WHERE is_active)::int AS active_frames,
   (SELECT COUNT(*) FROM products)::int AS products,
   (SELECT COUNT(*) FROM orders)::int AS orders`
);
const { frames, active_frames, products, orders } = summary.rows[0];
console.log(
  `Database ready: ${frames} frames (${active_frames} live), ${products} products, ${orders} requests`
);
await pool.end();
