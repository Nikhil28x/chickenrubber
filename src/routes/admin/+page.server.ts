import { fail, redirect } from '@sveltejs/kit';
import {
  PRODUCT_COLUMNS,
  SETTINGS_COLUMNS,
  dbQuery,
  initDb,
  withMedia,
  type ProductRow
} from '../../lib/server/db';
import { insertPlaceholderProducts } from '../../lib/server/schema';
import type { AdminReview, Frame } from '../../lib/types';
import type { Actions, PageServerLoad } from './$types';

function field(form: FormData, name: string) {
  return String(form.get(name) || '').trim();
}

function reviewFields(form: FormData) {
  return {
    name: field(form, 'customer_name').slice(0, 80),
    location: field(form, 'location').slice(0, 80),
    rating: Math.min(5, Math.max(1, Math.round(Number(field(form, 'rating'))) || 5)),
    comment: field(form, 'comment').slice(0, 300)
  };
}

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.admin) redirect(303, '/admin/login');
  await initDb();

  const [settings, frames, products, orders, counts, reviews] = await Promise.all([
    dbQuery(`SELECT ${SETTINGS_COLUMNS} FROM site_settings WHERE id = 1`),
    dbQuery<Frame>(
      'SELECT id, title, subtitle, is_active, sort_order FROM frames ORDER BY sort_order, id'
    ),
    dbQuery<ProductRow>(`SELECT ${PRODUCT_COLUMNS} FROM products ORDER BY sort_order, id`),
    dbQuery(
      `SELECT id, order_number::text, customer_name, mobile_primary, mobile_secondary, pincode, state,
       district, city, locality, road, landmark, shop_name, payment_method, items, total::float8 AS total,
       message, status, notifications, created_at FROM orders ORDER BY created_at DESC LIMIT 100`
    ),
    dbQuery(
      `SELECT COUNT(*)::int AS total_orders,
       COUNT(*) FILTER (WHERE status IN ('confirmed', 'processing'))::int AS open_orders,
       (SELECT COUNT(*)::int FROM frames WHERE is_active) AS live_frames FROM orders`
    ),
    dbQuery<AdminReview>(
      `SELECT id, customer_name, location, mobile, rating, comment, source, is_approved, created_at
       FROM reviews ORDER BY is_approved, created_at DESC, id DESC LIMIT 200`
    )
  ]);

  const allProducts = await withMedia(products.rows);
  return {
    settings: settings.rows[0],
    frames: frames.rows.map((frame) => ({
      ...frame,
      products: allProducts.filter((product) => product.frame_id === frame.id)
    })),
    orders: orders.rows,
    reviews: reviews.rows,
    stats: counts.rows[0]
  };
};

export const actions: Actions = {
  updateSettings: async ({ request, locals }) => {
    if (!locals.admin) redirect(303, '/admin/login');
    const form = await request.formData();
    await dbQuery(
      `UPDATE site_settings SET
        business_name=$1, phone=$2, secondary_phone=$3, email=$4, whatsapp=$5, address=$6,
        updated_at=NOW()
      WHERE id=1`,
      [
        field(form, 'business_name'),
        field(form, 'phone'),
        field(form, 'secondary_phone'),
        field(form, 'email'),
        field(form, 'whatsapp'),
        field(form, 'address')
      ]
    );
    return { success: 'Business details saved.', tab: 'settings' as const };
  },

  updateFrame: async ({ request, locals }) => {
    if (!locals.admin) redirect(303, '/admin/login');
    const form = await request.formData();
    const title = field(form, 'title');
    if (!title) return fail(400, { error: 'Frame title is required', tab: 'products' as const });
    const live = form.get('is_active') === 'on';
    await dbQuery(
      `UPDATE frames SET title=$1, subtitle=$2, is_active=$3, sort_order=$4, updated_at=NOW()
       WHERE id=$5`,
      [
        title,
        field(form, 'subtitle'),
        live,
        Number(field(form, 'sort_order')) || 0,
        Number(field(form, 'id'))
      ]
    );
    return {
      success: live ? `“${title}” is live on the website.` : `“${title}” saved and hidden.`,
      tab: 'products' as const
    };
  },

  addFrame: async ({ request, locals }) => {
    if (!locals.admin) redirect(303, '/admin/login');
    const form = await request.formData();
    const title = field(form, 'title');
    if (!title) return fail(400, { error: 'Give the new frame a title', tab: 'products' as const });
    const frame = await dbQuery<{ id: number }>(
      `INSERT INTO frames (title, subtitle, is_active, sort_order)
       VALUES ($1, '', FALSE, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM frames))
       RETURNING id`,
      [title]
    );
    await insertPlaceholderProducts({ query: dbQuery }, frame.rows[0].id, title);
    return {
      success: `Frame “${title}” added with 4 product slots. Fill them in, then switch it on.`,
      tab: 'products' as const
    };
  },

  updateProduct: async ({ request, locals }) => {
    if (!locals.admin) redirect(303, '/admin/login');
    const form = await request.formData();
    // Photos and videos are saved on their own as soon as they are picked.
    await dbQuery(
      `UPDATE products SET name=$1, description=$2, price=$3, stock=$4, is_active=$5,
       sort_order=$6, updated_at=NOW() WHERE id=$7`,
      [
        field(form, 'name'),
        field(form, 'description'),
        Math.max(0, Number(field(form, 'price')) || 0),
        Math.max(0, Number(field(form, 'stock')) || 0),
        form.get('is_active') === 'on',
        Number(field(form, 'sort_order')) || 0,
        Number(field(form, 'id'))
      ]
    );
    return { success: `${field(form, 'name')} saved.`, tab: 'products' as const };
  },

  addReview: async ({ request, locals }) => {
    if (!locals.admin) redirect(303, '/admin/login');
    const { name, location, rating, comment } = reviewFields(await request.formData());
    if (!name || !comment) {
      return fail(400, { error: 'Enter the customer name and review', tab: 'reviews' as const });
    }
    await dbQuery(
      `INSERT INTO reviews (customer_name, location, rating, comment, source, is_approved)
       VALUES ($1, $2, $3, $4, 'admin', TRUE)`,
      [name, location, rating, comment]
    );
    return { success: `Review from ${name} is on the website.`, tab: 'reviews' as const };
  },

  updateReview: async ({ request, locals }) => {
    if (!locals.admin) redirect(303, '/admin/login');
    const form = await request.formData();
    const { name, location, rating, comment } = reviewFields(form);
    if (!name || !comment) {
      return fail(400, { error: 'Enter the customer name and review', tab: 'reviews' as const });
    }
    const show = field(form, 'show') === '1';
    await dbQuery(
      `UPDATE reviews SET customer_name=$1, location=$2, rating=$3, comment=$4, is_approved=$5
       WHERE id=$6`,
      [name, location, rating, comment, show, Number(field(form, 'id'))]
    );
    return {
      success: show ? `Review from ${name} is on the website.` : `Review from ${name} is hidden.`,
      tab: 'reviews' as const
    };
  },

  deleteReview: async ({ request, locals }) => {
    if (!locals.admin) redirect(303, '/admin/login');
    const form = await request.formData();
    await dbQuery('DELETE FROM reviews WHERE id=$1', [Number(field(form, 'id'))]);
    return { success: 'Review deleted.', tab: 'reviews' as const };
  },

  updateOrder: async ({ request, locals }) => {
    if (!locals.admin) redirect(303, '/admin/login');
    const form = await request.formData();
    const id = field(form, 'id');
    const status = field(form, 'status');
    if (!['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return fail(400, { error: 'Invalid status' });
    }
    await dbQuery('UPDATE orders SET status=$1, updated_at=NOW() WHERE id=$2', [status, id]);
    return { success: 'Request status updated.' };
  },

  logout: async ({ cookies }) => {
    cookies.delete('naazare_admin', { path: '/' });
    redirect(303, '/admin/login');
  }
};
