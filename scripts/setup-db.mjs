import pg from 'pg';

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('Set DATABASE_URL before running npm run db:setup');
}

const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false }, max: 1 });

await pool.query(`
  CREATE TABLE IF NOT EXISTS site_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    business_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    secondary_phone TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    upi_id TEXT NOT NULL DEFAULT '',
    qr_url TEXT NOT NULL DEFAULT '',
    hero_image_url TEXT NOT NULL,
    video_1_url TEXT NOT NULL,
    video_2_url TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    price NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    image_url TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY,
    order_number BIGSERIAL UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    mobile_primary TEXT NOT NULL,
    mobile_secondary TEXT NOT NULL DEFAULT '',
    pincode TEXT NOT NULL,
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    city TEXT NOT NULL,
    locality TEXT NOT NULL,
    road TEXT NOT NULL DEFAULT '',
    landmark TEXT NOT NULL DEFAULT '',
    shop_name TEXT NOT NULL DEFAULT '',
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cod', 'upi')),
    items JSONB NOT NULL,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'confirmed',
    notifications JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  ALTER TABLE products ADD COLUMN IF NOT EXISTS image_2_url TEXT NOT NULL DEFAULT '';
  ALTER TABLE products ADD COLUMN IF NOT EXISTS image_3_url TEXT NOT NULL DEFAULT '';
  ALTER TABLE products ADD COLUMN IF NOT EXISTS product_video_url TEXT NOT NULL DEFAULT '';
`);

await pool.query(`
  UPDATE products SET
    image_2_url = CASE ((sort_order - 1) % 4) + 1
      WHEN 1 THEN '/products/rubber-2.jpg' WHEN 2 THEN '/products/rubber-3.jpg'
      WHEN 3 THEN '/products/rubber-4.jpg' ELSE '/products/rubber-1.jpg' END,
    image_3_url = CASE ((sort_order - 1) % 4) + 1
      WHEN 1 THEN '/products/rubber-3.jpg' WHEN 2 THEN '/products/rubber-4.jpg'
      WHEN 3 THEN '/products/rubber-1.jpg' ELSE '/products/rubber-2.jpg' END,
    product_video_url = CASE WHEN sort_order % 2 = 0
      THEN '/media/product-demo-2.mp4' ELSE '/media/product-demo-1.mp4' END
  WHERE image_2_url = '' OR image_3_url = '' OR product_video_url = ''
`);

await pool.query(
  `INSERT INTO site_settings (id, business_name, phone, email, whatsapp, hero_image_url, video_1_url, video_2_url)
   VALUES (1, 'Raghav Chicken Machine Rubber', '9900281928', 'mahamaaya9@gmail.com', '9900281928', '/media/raghav-brand-poster.png', '/media/product-demo-1.mp4', '/media/product-demo-2.mp4')
   ON CONFLICT (id) DO NOTHING`
);

const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM products');
if (rows[0].count === 0) {
  const defaults = [
    ['Soft Black Rubber', 'Rubber with washer for chicken machines', '/products/rubber-1.jpg'],
    ['Flexible Rubber', 'Soft and flexible machine rubber', '/products/rubber-2.jpg'],
    ['Rubber Pair', 'Machine rubber shown as a pair', '/products/rubber-3.jpg'],
    ['Long Machine Rubber', 'Long rubber part for chicken machines', '/products/rubber-4.jpg']
  ];
  for (const [index, item] of defaults.entries()) {
    await pool.query(
      'INSERT INTO products (name, description, stock, image_url, sort_order) VALUES ($1, $2, 100, $3, $4)',
      [item[0], item[1], item[2], index + 1]
    );
  }
}

const summary = await pool.query(
  'SELECT (SELECT COUNT(*) FROM products)::int AS products, (SELECT COUNT(*) FROM orders)::int AS orders'
);
console.log(
  `Database ready: ${summary.rows[0].products} products, ${summary.rows[0].orders} orders`
);
await pool.end();
