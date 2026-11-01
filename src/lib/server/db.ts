import pg from 'pg';
import { DATABASE_URL } from '$app/env/private';
import type { Frame, FrameWithProducts, Product, SiteSettings } from '../types';
import {
  BUSINESS_NAME,
  PRODUCTS_PER_FRAME,
  defaultFrameSeeds,
  defaultRubberProducts,
  migrate
} from './schema';

const { Pool } = pg;

let pool: pg.Pool | undefined;
let initialized: Promise<void> | undefined;

export const defaultSettings: SiteSettings = {
  business_name: BUSINESS_NAME,
  phone: '9900281928',
  secondary_phone: '',
  email: 'mahamaaya9@gmail.com',
  whatsapp: '9900281928',
  address: '',
  hero_image_url: '',
  video_1_url: '/media/product-demo-1.mp4',
  video_2_url: '/media/product-demo-2.mp4'
};

const defaultProducts: Product[] = defaultRubberProducts.map(
  ([name, description, a, b, c, video], index) => ({
    id: index + 1,
    frame_id: 1,
    name,
    description,
    price: 0,
    stock: 100,
    image_url: `/products/rubber-${a}.jpg`,
    image_2_url: `/products/rubber-${b}.jpg`,
    image_3_url: `/products/rubber-${c}.jpg`,
    product_video_url: `/media/product-demo-${video}.mp4`,
    is_active: true,
    sort_order: index + 1
  })
);

const defaultFrames: FrameWithProducts[] = [
  {
    id: 1,
    title: defaultFrameSeeds[0].title,
    subtitle: defaultFrameSeeds[0].subtitle,
    is_active: true,
    sort_order: 1,
    products: defaultProducts
  }
];

export const PRODUCT_COLUMNS = `id, frame_id, name, description, price::float8 AS price, stock,
  image_url, image_2_url, image_3_url, product_video_url, is_active, sort_order`;

function getPool() {
  if (!DATABASE_URL) return undefined;
  if (!pool) {
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
      max: 5
    });
  }
  return pool;
}

export async function initDb() {
  const db = getPool();
  if (!db) return false;
  initialized ??= migrate(db).catch((error) => {
    initialized = undefined;
    throw error;
  });
  await initialized;
  return true;
}

export async function getStorefront() {
  const db = getPool();
  const fallback = { settings: defaultSettings, frames: defaultFrames, databaseReady: false };
  if (!db) return fallback;

  try {
    await initDb();
    const [settingsResult, framesResult, productsResult] = await Promise.all([
      db.query<SiteSettings>('SELECT * FROM site_settings WHERE id = 1'),
      db.query<Frame>(
        `SELECT id, title, subtitle, is_active, sort_order FROM frames
         WHERE is_active = TRUE ORDER BY sort_order, id`
      ),
      db.query<Product>(
        `SELECT ${PRODUCT_COLUMNS} FROM products p
         WHERE is_active = TRUE AND EXISTS (
           SELECT 1 FROM frames f WHERE f.id = p.frame_id AND f.is_active = TRUE
         )
         ORDER BY sort_order, id`
      )
    ]);

    const frames = framesResult.rows
      .map((frame) => ({
        ...frame,
        products: productsResult.rows
          .filter((product) => product.frame_id === frame.id)
          .slice(0, PRODUCTS_PER_FRAME)
      }))
      .filter((frame) => frame.products.length > 0);

    return {
      settings: settingsResult.rows[0] ?? defaultSettings,
      frames,
      databaseReady: true
    };
  } catch (error) {
    console.error('Database unavailable, using storefront defaults', error);
    return fallback;
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
