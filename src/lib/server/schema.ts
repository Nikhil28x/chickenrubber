import type pg from 'pg';

// Shared by the app (lazy init on first request) and `npm run db:setup`.
// Every step is idempotent, so it is safe to run on each cold start.
// Bump SCHEMA_VERSION whenever you change migrate(), so live sites run it again;
// otherwise a cold start only checks the stored version (one quick query).
const SCHEMA_VERSION = 1;

export const BUSINESS_NAME = 'Raghav Kitchen Equipments';
// Earlier names, renamed automatically unless the owner chose another name in admin.
const OLD_BUSINESS_NAMES = ['Raghav Chicken Machine Rubber', 'Naazare Enterprises'];
const OLD_HERO_IMAGE = '/media/raghav-brand-poster.png';
export const PLACEHOLDER_IMAGE = '/products/placeholder.svg';
export const PRODUCTS_PER_FRAME = 4;

export const defaultFrameSeeds = [
  {
    title: 'Rubbers & bushes',
    subtitle: 'Long-lasting rubber fingers and bushes for chicken feather cleaning machines.',
    item: 'Rubber',
    active: true
  },
  {
    title: 'Chicken feather cleaning machines',
    subtitle: 'Hygienic, high-capacity feather plucking machines for poultry shops.',
    item: 'Feather cleaning machine',
    active: false
  },
  {
    title: 'Chicken cutting machines',
    subtitle: 'Fast, precise cutting machines for meat and poultry outlets.',
    item: 'Chicken cutting machine',
    active: false
  },
  {
    title: 'Commercial mixers',
    subtitle: 'Heavy-duty mixers built for hotel, restaurant and canteen kitchens.',
    item: 'Commercial mixer',
    active: false
  },
  {
    title: 'Grinders',
    subtitle: 'Wet and table-top grinders for batter, masala and chutney.',
    item: 'Grinder',
    active: false
  },
  {
    title: 'Dough kneading machines',
    subtitle: 'Consistent dough for bakeries, sweet shops and commercial kitchens.',
    item: 'Dough kneader',
    active: false
  }
];

export const defaultRubberProducts = [
  ['Soft Black Rubber', 'Rubber with washer for chicken machines', 1, 2, 3, 1],
  ['Flexible Rubber', 'Soft and flexible machine rubber', 2, 3, 4, 2],
  ['Rubber Pair', 'Machine rubber shown as a pair', 3, 4, 1, 1],
  ['Long Machine Rubber', 'Long rubber part for chicken machines', 4, 1, 2, 2]
] as const;

type Queryable = { query: (text: string, values?: unknown[]) => Promise<unknown> };

export async function insertPlaceholderProducts(db: Queryable, frameId: number, item: string) {
  for (let slot = 1; slot <= PRODUCTS_PER_FRAME; slot++) {
    await db.query(
      `INSERT INTO products (frame_id, name, description, price, stock, image_url, image_2_url,
       image_3_url, product_video_url, is_active, sort_order, media_migrated)
       VALUES ($1, $2, '', 0, 10, $3, '', '', '', TRUE, $4, TRUE)`,
      [frameId, `${item} · Model ${slot}`, PLACEHOLDER_IMAGE, slot]
    );
  }
}

export async function migrate(pool: pg.Pool) {
  try {
    const stored = await pool.query<{ version: number }>('SELECT version FROM schema_version');
    if (stored.rows[0]?.version === SCHEMA_VERSION) return;
  } catch {
    // No version table yet: run the full setup below.
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Serialise concurrent cold starts so seed rows are only inserted once.
    await client.query('SELECT pg_advisory_xact_lock(2004)');

    await client.query(`
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

      CREATE TABLE IF NOT EXISTS frames (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        subtitle TEXT NOT NULL DEFAULT '',
        is_active BOOLEAN NOT NULL DEFAULT FALSE,
        sort_order INTEGER NOT NULL DEFAULT 0,
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
        payment_method TEXT NOT NULL CHECK (payment_method IN ('cod', 'upi', 'callback')),
        items JSONB NOT NULL,
        total NUMERIC(12, 2) NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'confirmed',
        notifications JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS address TEXT NOT NULL DEFAULT '';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS image_2_url TEXT NOT NULL DEFAULT '';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS image_3_url TEXT NOT NULL DEFAULT '';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS product_video_url TEXT NOT NULL DEFAULT '';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS frame_id INTEGER REFERENCES frames(id);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS message TEXT NOT NULL DEFAULT '';

      -- Any number of photos and videos per product, in display order.
      CREATE TABLE IF NOT EXISTS product_media (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        kind TEXT NOT NULL CHECK (kind IN ('image', 'video')),
        url TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS product_media_product_idx
        ON product_media (product_id, sort_order, id);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS media_migrated BOOLEAN NOT NULL DEFAULT FALSE;

      -- Customer reviews. Nothing shows on the website until it is approved.
      -- The mobile number is only for checking a review and is never shown.
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        customer_name TEXT NOT NULL,
        location TEXT NOT NULL DEFAULT '',
        mobile TEXT NOT NULL DEFAULT '',
        rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT 'website' CHECK (source IN ('website', 'admin')),
        is_approved BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS reviews_approved_idx ON reviews (is_approved, created_at DESC);

      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'orders_payment_method_check'
            AND pg_get_constraintdef(oid) LIKE '%callback%'
        ) THEN
          ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_check;
          ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check
            CHECK (payment_method IN ('cod', 'upi', 'callback'));
        END IF;
      END $$;
    `);

    await client.query(
      `INSERT INTO site_settings (id, business_name, phone, email, whatsapp, hero_image_url,
       video_1_url, video_2_url)
       VALUES (1, $1, '9900281928', 'mahamaaya9@gmail.com', '9900281928', '',
       '/media/product-demo-1.mp4', '/media/product-demo-2.mp4')
       ON CONFLICT (id) DO NOTHING`,
      [BUSINESS_NAME]
    );
    await client.query(
      `UPDATE site_settings SET
         business_name = CASE WHEN business_name = ANY($1) THEN $2 ELSE business_name END,
         hero_image_url = CASE WHEN hero_image_url = $3 THEN '' ELSE hero_image_url END
       WHERE business_name = ANY($1) OR hero_image_url = $3`,
      [OLD_BUSINESS_NAMES, BUSINESS_NAME, OLD_HERO_IMAGE]
    );

    const productCount = await client.query<{ count: number }>(
      'SELECT COUNT(*)::int AS count FROM products'
    );
    if (productCount.rows[0].count === 0) {
      for (const [index, [name, description, a, b, c, video]] of defaultRubberProducts.entries()) {
        await client.query(
          `INSERT INTO products (name, description, price, stock, image_url, image_2_url,
           image_3_url, product_video_url, is_active, sort_order)
           VALUES ($1, $2, 0, 100, $3, $4, $5, $6, TRUE, $7)`,
          [
            name,
            description,
            `/products/rubber-${a}.jpg`,
            `/products/rubber-${b}.jpg`,
            `/products/rubber-${c}.jpg`,
            `/media/product-demo-${video}.mp4`,
            index + 1
          ]
        );
      }
    }

    const frameCount = await client.query<{ count: number }>(
      'SELECT COUNT(*)::int AS count FROM frames'
    );
    if (frameCount.rows[0].count === 0) {
      for (const [index, seed] of defaultFrameSeeds.entries()) {
        const frame = await client.query<{ id: number }>(
          'INSERT INTO frames (title, subtitle, is_active, sort_order) VALUES ($1, $2, $3, $4) RETURNING id',
          [seed.title, seed.subtitle, seed.active, index + 1]
        );
        const frameId = frame.rows[0].id;
        if (index === 0) {
          // The original four rubber products become the first frame.
          await client.query('UPDATE products SET frame_id = $1 WHERE frame_id IS NULL', [frameId]);
        } else {
          await insertPlaceholderProducts(client, frameId, seed.item);
        }
      }
    }

    // Copy each product's original three photos and one video into
    // product_media once; after that, product_media is the only source.
    await client.query(
      `INSERT INTO product_media (product_id, kind, url, sort_order)
       SELECT p.id, m.kind, m.url, m.position
       FROM products p
       CROSS JOIN LATERAL (VALUES
         ('image', p.image_url, 1), ('image', p.image_2_url, 2),
         ('image', p.image_3_url, 3), ('video', p.product_video_url, 4)
       ) AS m(kind, url, position)
       WHERE NOT p.media_migrated AND m.url <> '' AND m.url <> $1`,
      [PLACEHOLDER_IMAGE]
    );
    await client.query('UPDATE products SET media_migrated = TRUE WHERE NOT media_migrated');

    await client.query('CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL)');
    await client.query('DELETE FROM schema_version');
    await client.query('INSERT INTO schema_version (version) VALUES ($1)', [SCHEMA_VERSION]);

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
