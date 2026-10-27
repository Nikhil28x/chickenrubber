import pg from 'pg';
import type { Product, SiteSettings } from '../types';

const { Pool } = pg;

let pool: pg.Pool | undefined;
let initialized = false;

export const defaultSettings: SiteSettings = {
  business_name: 'Raghav Chicken Machine Rubber',
  phone: '9900281928',
  secondary_phone: '',
  email: 'mahamaaya9@gmail.com',
  whatsapp: '9900281928',
  upi_id: '',
  qr_url: '',
  hero_image_url: '/media/raghav-brand-poster.png',
  video_1_url: '/media/product-demo-1.mp4',
  video_2_url: '/media/product-demo-2.mp4'
};

export const defaultProducts: Product[] = [
  {
    id: 1,
    name: 'Soft Black Rubber',
    description: 'Rubber with washer for chicken machines',
    price: 0,
    stock: 100,
    image_url: '/products/rubber-1.jpg',
    is_active: true,
    sort_order: 1
  },
  {
    id: 2,
    name: 'Flexible Rubber',
    description: 'Soft and flexible machine rubber',
    price: 0,
    stock: 100,
    image_url: '/products/rubber-2.jpg',
    is_active: true,
    sort_order: 2
  },
  {
    id: 3,
    name: 'Rubber Pair',
    description: 'Machine rubber shown as a pair',
    price: 0,
    stock: 100,
    image_url: '/products/rubber-3.jpg',
    is_active: true,
    sort_order: 3
  },
  {
    id: 4,
    name: 'Long Machine Rubber',
    description: 'Long rubber part for chicken machines',
    price: 0,
    stock: 100,
    image_url: '/products/rubber-4.jpg',
    is_active: true,
    sort_order: 4
  }
];

function getPool() {
  if (!process.env.DATABASE_URL) return undefined;
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5
    });
  }
  return pool;
}

export async function initDb() {
  const db = getPool();
  if (!db || initialized) return Boolean(db);

  await db.query(`
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
  `);

  await db.query(
    `INSERT INTO site_settings (
      id, business_name, phone, secondary_phone, email, whatsapp, upi_id, qr_url,
      hero_image_url, video_1_url, video_2_url
    ) VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (id) DO NOTHING`,
    [
      defaultSettings.business_name,
      defaultSettings.phone,
      defaultSettings.secondary_phone,
      defaultSettings.email,
      defaultSettings.whatsapp,
      defaultSettings.upi_id,
      defaultSettings.qr_url,
      defaultSettings.hero_image_url,
      defaultSettings.video_1_url,
      defaultSettings.video_2_url
    ]
  );

  const count = await db.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM products');
  if (Number(count.rows[0]?.count) === 0) {
    for (const product of defaultProducts) {
      await db.query(
        `INSERT INTO products (name, description, price, stock, image_url, is_active, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          product.name,
          product.description,
          product.price,
          product.stock,
          product.image_url,
          product.is_active,
          product.sort_order
        ]
      );
    }
  }

  initialized = true;
  return true;
}

export async function getStorefront() {
  const db = getPool();
  if (!db) return { settings: defaultSettings, products: defaultProducts, databaseReady: false };

  try {
    await initDb();
    const [settingsResult, productsResult] = await Promise.all([
      db.query<SiteSettings>('SELECT * FROM site_settings WHERE id = 1'),
      db.query<Product>(
        'SELECT id, name, description, price::float8 AS price, stock, image_url, is_active, sort_order FROM products WHERE is_active = TRUE ORDER BY sort_order, id LIMIT 4'
      )
    ]);
    return {
      settings: settingsResult.rows[0] ?? defaultSettings,
      products: productsResult.rows.length ? productsResult.rows : defaultProducts,
      databaseReady: true
    };
  } catch (error) {
    console.error('Database unavailable, using storefront defaults', error);
    return { settings: defaultSettings, products: defaultProducts, databaseReady: false };
  }
}

export async function dbQuery<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  values: unknown[] = []
) {
  const db = getPool();
  if (!db) throw new Error('DATABASE_URL is not configured');
  await initDb();
  return db.query<T>(text, values);
}
