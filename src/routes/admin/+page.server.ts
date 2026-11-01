import { fail, redirect } from '@sveltejs/kit';
import { PRODUCT_COLUMNS, dbQuery, initDb } from '../../lib/server/db';
import { insertPlaceholderProducts } from '../../lib/server/schema';
import type { Frame, Product } from '../../lib/types';
import type { Actions, PageServerLoad } from './$types';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 15 * 1024 * 1024;

function field(form: FormData, name: string) {
  return String(form.get(name) || '').trim();
}

async function fileToDataUrl(value: FormDataEntryValue | null, maxSize: number) {
  if (!(value instanceof File) || value.size === 0) return '';
  if (value.size > maxSize)
    throw new Error(`File is too large. Maximum ${Math.round(maxSize / 1024 / 1024)} MB.`);
  const allowed = value.type.startsWith('image/') || value.type.startsWith('video/');
  if (!allowed) throw new Error('Only image and video files are allowed.');
  return `data:${value.type};base64,${Buffer.from(await value.arrayBuffer()).toString('base64')}`;
}

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.admin) redirect(303, '/admin/login');
  await initDb();

  const [settings, frames, products, orders, counts] = await Promise.all([
    dbQuery('SELECT * FROM site_settings WHERE id = 1'),
    dbQuery<Frame>(
      'SELECT id, title, subtitle, is_active, sort_order FROM frames ORDER BY sort_order, id'
    ),
    dbQuery<Product>(`SELECT ${PRODUCT_COLUMNS} FROM products ORDER BY sort_order, id`),
    dbQuery(
      `SELECT id, order_number::text, customer_name, mobile_primary, mobile_secondary, pincode, state,
       district, city, locality, road, landmark, shop_name, payment_method, items, total::float8 AS total,
       message, status, notifications, created_at FROM orders ORDER BY created_at DESC LIMIT 100`
    ),
    dbQuery(
      `SELECT COUNT(*)::int AS total_orders,
       COUNT(*) FILTER (WHERE status IN ('confirmed', 'processing'))::int AS open_orders,
       (SELECT COUNT(*)::int FROM frames WHERE is_active) AS live_frames FROM orders`
    )
  ]);

  return {
    settings: settings.rows[0],
    frames: frames.rows.map((frame) => ({
      ...frame,
      products: products.rows.filter((product) => product.frame_id === frame.id)
    })),
    orders: orders.rows,
    stats: counts.rows[0]
  };
};

export const actions: Actions = {
  updateSettings: async ({ request, locals }) => {
    if (!locals.admin) redirect(303, '/admin/login');
    try {
      const form = await request.formData();
      const heroUpload = await fileToDataUrl(form.get('hero_upload'), MAX_IMAGE_SIZE);
      const video1Upload = await fileToDataUrl(form.get('video_1_upload'), MAX_VIDEO_SIZE);
      const video2Upload = await fileToDataUrl(form.get('video_2_upload'), MAX_VIDEO_SIZE);

      await dbQuery(
        `UPDATE site_settings SET
          business_name=$1, phone=$2, secondary_phone=$3, email=$4, whatsapp=$5, address=$6,
          hero_image_url=$7, video_1_url=$8, video_2_url=$9, updated_at=NOW()
        WHERE id=1`,
        [
          field(form, 'business_name'),
          field(form, 'phone'),
          field(form, 'secondary_phone'),
          field(form, 'email'),
          field(form, 'whatsapp'),
          field(form, 'address'),
          heroUpload || field(form, 'hero_image_url'),
          video1Upload || field(form, 'video_1_url'),
          video2Upload || field(form, 'video_2_url')
        ]
      );
      return { success: 'Business details saved.', tab: 'settings' as const };
    } catch (error) {
      return fail(400, {
        error: error instanceof Error ? error.message : 'Could not save settings',
        tab: 'settings' as const
      });
    }
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
    try {
      const form = await request.formData();
      const id = Number(field(form, 'id'));
      const imageUpload = await fileToDataUrl(form.get('image_upload'), MAX_IMAGE_SIZE);
      const image2Upload = await fileToDataUrl(form.get('image_2_upload'), MAX_IMAGE_SIZE);
      const image3Upload = await fileToDataUrl(form.get('image_3_upload'), MAX_IMAGE_SIZE);
      const productVideoUpload = await fileToDataUrl(
        form.get('product_video_upload'),
        MAX_VIDEO_SIZE
      );
      await dbQuery(
        `UPDATE products SET name=$1, description=$2, price=$3, stock=$4, image_url=$5,
         image_2_url=$6, image_3_url=$7, product_video_url=$8, is_active=$9, sort_order=$10,
         updated_at=NOW() WHERE id=$11`,
        [
          field(form, 'name'),
          field(form, 'description'),
          Math.max(0, Number(field(form, 'price')) || 0),
          Math.max(0, Number(field(form, 'stock')) || 0),
          imageUpload || field(form, 'image_url'),
          image2Upload || field(form, 'image_2_url'),
          image3Upload || field(form, 'image_3_url'),
          productVideoUpload || field(form, 'product_video_url'),
          form.get('is_active') === 'on',
          Number(field(form, 'sort_order')) || 0,
          id
        ]
      );
      return { success: `${field(form, 'name')} saved.`, tab: 'products' as const };
    } catch (error) {
      return fail(400, {
        error: error instanceof Error ? error.message : 'Could not save product',
        tab: 'products' as const
      });
    }
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
