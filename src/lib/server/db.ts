import pg from 'pg';
import { DATABASE_URL } from '$app/env/private';
import type {
  Frame,
  FrameWithProducts,
  Product,
  ProductMedia,
  Review,
  SiteSettings
} from '../types';
import {
  BUSINESS_NAME,
  PLACEHOLDER_IMAGE,
  PRODUCTS_PER_FRAME,
  defaultFrameSeeds,
  defaultRubberProducts,
  migrate
} from './schema';
import { PRODUCT_COLUMNS, PRODUCT_MEDIA_COLUMNS, SETTINGS_COLUMNS } from './media';

import { getRequestEvent } from '$app/server';
import { dev } from '$app/env';
import { env as cloudflare } from 'cloudflare:workers';

const { Pool } = pg;

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
    media: [
      ...[a, b, c].map((n, i) => ({
        id: index * 10 + i,
        kind: 'image' as const,
        url: `/products/rubber-${n}.jpg`
      })),
      { id: index * 10 + 3, kind: 'video' as const, url: `/media/product-demo-${video}.mp4` }
    ],
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

export { PRODUCT_COLUMNS, SETTINGS_COLUMNS };

export type ProductRow = Omit<Product, 'image_url' | 'media'>;

// Adds each product's photos and videos, and its main photo (the first photo).
export async function withMedia(products: ProductRow[]): Promise<Product[]> {
  const media = await dbQuery<ProductMedia & { product_id: number }>(
    `SELECT ${PRODUCT_MEDIA_COLUMNS} FROM product_media
     WHERE product_id = ANY($1::int[]) ORDER BY sort_order, id`,
    [products.map((product) => product.id)]
  );
  return attachMedia(products, media.rows);
}

function attachMedia(products: ProductRow[], media: (ProductMedia & { product_id: number })[]) {
  return products.map((product) => {
    const items = media
      .filter((row) => row.product_id === product.id)
      .map(({ id, kind, url }) => ({ id, kind, url }));
    const mainPhoto = items.find((item) => item.kind === 'image')?.url;
    return { ...product, image_url: mainPhoto ?? PLACEHOLDER_IMAGE, media: items };
  });
}

// Cloudflare Workers can't reuse a connection from one request in the next, so each
// request opens its own and hooks.server.ts closes it once the response is ready.
// On Cloudflare the connection goes through Hyperdrive, which keeps warm connections
// to the database so opening one is quick. Local dev connects to DATABASE_URL directly.
function getPool() {
  const { locals } = getRequestEvent();
  const hyperdrive = dev ? undefined : hyperdriveUrl();
  if (!hyperdrive && !DATABASE_URL) return undefined;
  locals.db ??= new Pool(
    hyperdrive
      ? { connectionString: hyperdrive, max: 5 }
      : {
          connectionString: DATABASE_URL,
          ssl: DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
          max: 3
        }
  );
  return locals.db;
}

function hyperdriveUrl() {
  const binding = (cloudflare as { HYPERDRIVE?: { connectionString: string } }).HYPERDRIVE;
  return binding?.connectionString;
}

export function closeDb(locals: App.Locals) {
  const db = locals.db;
  locals.db = undefined;
  db?.end().catch(() => {});
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
  const fallback = {
    settings: defaultSettings,
    frames: defaultFrames,
    reviews: [] as Review[],
    databaseReady: false
  };
  if (!db) return fallback;

  try {
    await initDb();
    // All five queries run at once: each trip to the database takes a while.
    const [settingsResult, framesResult, productsResult, reviewsResult, mediaResult] =
      await Promise.all([
        db.query<SiteSettings>(`SELECT ${SETTINGS_COLUMNS} FROM site_settings WHERE id = 1`),
        db.query<Frame>(
          `SELECT id, title, subtitle, is_active, sort_order FROM frames
         WHERE is_active = TRUE ORDER BY sort_order, id`
        ),
        db.query<ProductRow>(
          `SELECT ${PRODUCT_COLUMNS} FROM products p
         WHERE is_active = TRUE AND EXISTS (
           SELECT 1 FROM frames f WHERE f.id = p.frame_id AND f.is_active = TRUE
         )
         ORDER BY sort_order, id`
        ),
        db.query<Review>(
          `SELECT id, customer_name, location, rating, comment FROM reviews
         WHERE is_approved = TRUE ORDER BY created_at DESC, id DESC LIMIT 30`
        ),
        db.query<ProductMedia & { product_id: number }>(
          `SELECT ${PRODUCT_MEDIA_COLUMNS} FROM product_media
         WHERE product_id IN (SELECT id FROM products WHERE is_active = TRUE)
         ORDER BY sort_order, id`
        )
      ]);

    const products = attachMedia(productsResult.rows, mediaResult.rows);
    const frames = framesResult.rows
      .map((frame) => ({
        ...frame,
        products: products
          .filter((product) => product.frame_id === frame.id)
          .slice(0, PRODUCTS_PER_FRAME)
      }))
      .filter((frame) => frame.products.length > 0);

    return {
      settings: settingsResult.rows[0] ?? defaultSettings,
      frames,
      reviews: reviewsResult.rows,
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
